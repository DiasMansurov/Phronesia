"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  INVESTMENT_ACCOUNT_STORAGE_KEY,
  INVESTMENT_ASSETS,
  INVESTMENT_EDUCATIONAL_CARDS,
  INVESTMENT_RECENT_BUY_TRADE_STORAGE_KEY,
  INVESTMENT_STARTING_CASH,
  INVESTMENT_TRANSACTION_FEE_RATE,
  formatPercent,
  formatUsd,
  type InvestmentAssetQuote,
  type InvestmentAssetSearchResult,
  type InvestmentEducationalCard,
  type InvestmentMarketStatus,
  type InvestmentRecentBuyTradeContext,
  type TradeSide
} from "@/lib/investment-challenge";
import type { InvestmentAccountView, InvestmentCompetitionView, InvestmentPositionView } from "@/lib/server-investments";

type MarketPayload = {
  marketStatus: InvestmentMarketStatus;
  quotes: InvestmentAssetQuote[];
  educationalCards: InvestmentEducationalCard[];
};

type RefreshPricesPayload = {
  ok?: boolean;
  apiLimitReached?: boolean;
  results?: Array<{
    symbol: string;
    ok?: boolean;
    success?: boolean;
    price?: number;
    priceDate?: string | null;
    tradingDay?: string | null;
    source?: string;
    apiLimitReached?: boolean;
    error?: string;
    message?: string;
  }>;
  quotes?: InvestmentAssetQuote[];
  error?: string;
};

type RefreshSymbolPayload = RefreshPricesPayload & {
  result?: NonNullable<RefreshPricesPayload["results"]>[number];
};

const closedMessage =
  "US market is closed. Latest cached stock prices are still shown. Trading reopens at 9:30 AM ET.";

function defaultMarketStatus(): InvestmentMarketStatus {
  return {
    isOpen: false,
    isMarketDay: false,
    isHoliday: false,
    holidayName: null,
    etDate: "",
    etTime: "",
    opensAtEt: "9:30 AM ET",
    closesAtEt: "4:00 PM ET",
    message: closedMessage
  };
}

function featuredQuotes(): InvestmentAssetQuote[] {
  return INVESTMENT_ASSETS.map((asset) => ({
    ...asset,
    latestClose: asset.referencePrice,
    priceDate: null,
    provider: "educational_reference",
    priceAvailable: false,
    priceSource: "reference",
    priceMessage: "No saved price yet. Select the asset to fetch the latest price.",
    fetchedAt: null,
    cacheStatus: "missing"
  }));
}

function mergeQuote(quotes: InvestmentAssetQuote[], next: InvestmentAssetQuote) {
  const filtered = quotes.filter((quote) => quote.symbol !== next.symbol);
  return [next, ...filtered];
}

export function InvestmentChallengeDashboard({
  initialCompetitionCode = "",
  initialAccountId = "",
  initialAccount = null
}: {
  initialCompetitionCode?: string;
  initialAccountId?: string;
  initialAccount?: InvestmentAccountView | null;
}) {
  const router = useRouter();
  const [market, setMarket] = useState<MarketPayload>({
    marketStatus: defaultMarketStatus(),
    quotes: featuredQuotes(),
    educationalCards: INVESTMENT_EDUCATIONAL_CARDS
  });
  const [account, setAccount] = useState<InvestmentAccountView | null>(initialAccount);
  const [competitionCode, setCompetitionCode] = useState(initialCompetitionCode);
  const [resolvedCompetition, setResolvedCompetition] = useState<InvestmentCompetitionView | null>(initialAccount?.competition ?? null);
  const [symbol, setSymbol] = useState("SPY");
  const [selectedQuote, setSelectedQuote] = useState<InvestmentAssetQuote>(featuredQuotes()[0]);
  const [hasSelectedAsset, setHasSelectedAsset] = useState(false);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetResults, setAssetResults] = useState<InvestmentAssetSearchResult[]>([]);
  const [assetSearchStatus, setAssetSearchStatus] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [side, setSide] = useState<TradeSide>("buy");
  const [positionSide, setPositionSide] = useState<"long" | "short">("long");
  const [positionLeverage, setPositionLeverage] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [showLevPanel, setShowLevPanel] = useState(false);

  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "info" }>>([]);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    void loadMarket();
    if (initialAccount) {
      setAccount(initialAccount);
      setResolvedCompetition(initialAccount.competition);
      setCompetitionCode(initialAccount.competition.code);
      const current = initialAccount.quotes.find((quote) => quote.symbol === symbol) ?? initialAccount.quotes[0];
      if (current) setSelectedQuote(current);
      window.localStorage.setItem(INVESTMENT_ACCOUNT_STORAGE_KEY, initialAccount.account.id);
      return;
    }
    if (initialAccountId.trim()) {
      void loadAccount(initialAccountId);
      return;
    }
    if (initialCompetitionCode.trim()) {
      setCompetitionCode(initialCompetitionCode);
      void resolveCompetitionCode(initialCompetitionCode);
    }
  }, [initialAccount, initialAccountId, initialCompetitionCode]);

  useEffect(() => {
    const query = assetQuery.trim();
    if (query.length < 2) {
      setAssetResults([]);
      setAssetSearchStatus("");
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setAssetSearchStatus("Searching assets...");
      try {
        const response = await fetch(`/api/investment/assets/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
        const data = (await response.json()) as { results?: InvestmentAssetSearchResult[] };
        if (cancelled) return;
        setAssetResults(data.results ?? []);
        setAssetSearchStatus(data.results?.length ? "" : "No US-listed stocks or ETFs found.");
      } catch {
        if (!cancelled) setAssetSearchStatus("Asset search is temporarily unavailable.");
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [assetQuery]);

  const quotes = account?.quotes ?? market.quotes;
  const marketStatus = account?.marketStatus ?? market.marketStatus;
  const activeCompetition = account?.competition ?? resolvedCompetition ?? null;
  const portfolio = account?.portfolio;
  const holdingsCount = account?.holdings.length ?? 0;
  const estimatedGross = hasSelectedAsset && selectedQuote.priceAvailable ? selectedQuote.latestClose * Math.max(0, quantity) : 0;
  const estimatedFee = estimatedGross * INVESTMENT_TRANSACTION_FEE_RATE;
  const estimatedNet = side === "buy" ? estimatedGross + estimatedFee : Math.max(0, estimatedGross - estimatedFee);
  const estimatedPositionMargin = positionLeverage > 0 ? estimatedGross / positionLeverage : 0;
  const estimatedPositionRequired = estimatedPositionMargin + estimatedFee;
  const ownedQuantity = hasSelectedAsset ? (account?.holdings.find((holding) => holding.symbol === symbol)?.quantity ?? 0) : 0;
  const cashBalance = portfolio?.cash ?? INVESTMENT_STARTING_CASH;
  const currentPortfolioValue = portfolio?.totalValue ?? INVESTMENT_STARTING_CASH;
  const currentExposure = portfolio?.totalExposure ?? 0;
  const clientTradeWarning =
    !hasSelectedAsset
      ? ""
    : !selectedQuote.priceAvailable
      ? selectedQuote.priceMessage ?? "No saved price yet. Select the asset to fetch the latest price."
      : activeCompetition?.runtimeStatus === "not_started"
        ? "Competition has not started yet. You can register and prepare your thesis, but trading is disabled."
      : activeCompetition?.runtimeStatus === "closed"
        ? "Competition closed. Rankings are final and buy/sell orders are disabled."
      : !marketStatus.isOpen
        ? "US market is closed. Latest cached stock prices are shown, but buy/sell orders are disabled."
        : side === "buy" && account && estimatedNet > cashBalance + 0.00001
          ? `Insufficient virtual cash. Total cost including commission is ${formatUsd(estimatedNet)}.`
          : side === "sell" && account && quantity > ownedQuantity
            ? "You cannot sell more shares than you own."
            : "";
  const canTrade = Boolean(
    account &&
      hasSelectedAsset &&
      marketStatus.isOpen &&
      (!activeCompetition || activeCompetition.runtimeStatus === "active") &&
      !busy &&
      !priceLoading &&
      selectedQuote.priceAvailable &&
      !(side === "buy" && estimatedNet > cashBalance + 0.00001) &&
      !(side === "sell" && quantity > ownedQuantity)
  );
  const positionWarning =
    !hasSelectedAsset
      ? ""
      : !selectedQuote.priceAvailable
        ? selectedQuote.priceMessage ?? "No saved price yet. Select the asset to fetch the latest price."
        : activeCompetition?.runtimeStatus === "not_started"
          ? "Competition has not started yet."
        : activeCompetition?.runtimeStatus === "closed"
          ? "Competition closed. Rankings are final."
        : !marketStatus.isOpen
          ? "US market is closed. Latest cached stock prices are shown, but position orders are disabled."
        : estimatedPositionMargin > currentPortfolioValue * 0.3 + 0.00001
          ? "Position exceeds 30% margin limit."
        : currentExposure + estimatedGross > currentPortfolioValue * 1.5 + 0.00001
          ? "Total exposure limit exceeded."
        : account && estimatedPositionRequired > cashBalance + 0.00001
          ? `Insufficient cash. Required margin plus commission is ${formatUsd(estimatedPositionRequired)}.`
          : "";
  const canOpenPosition = Boolean(
    account &&
      hasSelectedAsset &&
      marketStatus.isOpen &&
      (!activeCompetition || activeCompetition.runtimeStatus === "active") &&
      !busy &&
      !priceLoading &&
      selectedQuote.priceAvailable &&
      !positionWarning
  );
  const selectedHasDisplayPrice =
    hasSelectedAsset && selectedQuote.priceAvailable && Number.isFinite(selectedQuote.latestClose) && selectedQuote.latestClose > 0;
  const selectedPriceText = priceLoading
    ? "Checking..."
    : selectedHasDisplayPrice
      ? formatUsd(selectedQuote.latestClose)
      : hasSelectedAsset
        ? "No saved price yet"
        : "Select an asset";
  const feeRateLabel = `${(INVESTMENT_TRANSACTION_FEE_RATE * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

  async function loadMarket() {
    const response = await fetch("/api/investment/market", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as MarketPayload;
    setMarket(data);
    if (hasSelectedAsset) {
      const current = data.quotes.find((quote) => quote.symbol === symbol);
      if (current) setSelectedQuote(current);
    }
  }

  async function loadAccount(accountId: string) {
    const response = await fetch(`/api/investment/accounts?accountId=${encodeURIComponent(accountId)}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      window.localStorage.removeItem(INVESTMENT_ACCOUNT_STORAGE_KEY);
      return;
    }
    const data = (await response.json()) as { account: InvestmentAccountView | null };
    if (data.account) {
      setAccount(data.account);
      const current = data.account.quotes.find((quote) => quote.symbol === symbol) ?? data.account.quotes[0];
      if (current) setSelectedQuote(current);
      setResolvedCompetition(data.account.competition);
      setCompetitionCode(data.account.competition.code);
    }
  }

  async function resolveCompetitionCode(inputCode = competitionCode) {
    const code = inputCode.trim();
    if (!code) {
      setResolvedCompetition(null);
      showToast("Using the public Phronesia Investment Challenge.", "info");
      return;
    }
    showToast("Checking competition code...", "info");
    try {
      const response = await fetch(`/api/investment/competitions/resolve?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; competition?: InvestmentCompetitionView; reason?: string };
      if (!response.ok || !data.competition) {
        showToast(data.reason ?? "Competition code was not found.", "error");
        return;
      }
      setResolvedCompetition(data.competition);
      showToast(data.competition.welcomeMessage ?? `Competition loaded: ${data.competition.name}.`, "success");
    } catch {
      showToast("Competition code lookup is temporarily unavailable.", "error");
    }
  }

  async function selectAsset(asset: InvestmentAssetSearchResult | InvestmentAssetQuote) {
    const hasOptimisticPrice = Boolean(asset.priceAvailable || asset.latestClose || asset.referencePrice);
    const optimistic: InvestmentAssetQuote = {
      ...asset,
      latestClose: asset.latestClose ?? asset.referencePrice,
      priceDate: asset.priceDate ?? null,
      provider: "search",
      priceAvailable: Boolean(asset.priceAvailable),
      priceSource: hasOptimisticPrice ? "reference" : "unavailable",
      priceMessage: hasOptimisticPrice
        ? "Checking saved cache and the approved MarketData.app stock price endpoint..."
        : "Checking latest stock price..."
    };
    setSymbol(asset.symbol);
    setHasSelectedAsset(true);
    setAssetQuery("");
    setSelectedQuote(optimistic);
    setAssetResults([]);
    setAssetSearchStatus("Checking latest stock price...");
    setPriceLoading(true);

    try {
      const response = await fetch(`/api/investment/assets/quote?symbol=${encodeURIComponent(asset.symbol)}`, {
        cache: "no-store"
      });
      const data = (await response.json()) as { ok?: boolean; quote?: InvestmentAssetQuote; reason?: string };
      if (response.ok && data.ok && data.quote) {
        setSelectedQuote(data.quote);
        setMarket((current) => ({ ...current, quotes: mergeQuote(current.quotes, data.quote as InvestmentAssetQuote) }));
        setAssetSearchStatus("");
      } else {
        const reason = data.reason ?? "MarketData.app stock price unavailable.";
        setSelectedQuote({
          ...optimistic,
          latestClose: 0,
          priceAvailable: false,
          provider: "unavailable",
          priceSource: "unavailable",
          priceMessage: reason
        });
        setAssetSearchStatus(data.reason ?? "No saved price yet. Select the asset to fetch the latest price.");
      }
    } catch {
      const reason = "No saved price yet. Select the asset to fetch the latest price.";
      setSelectedQuote({
        ...optimistic,
        latestClose: 0,
        priceAvailable: false,
        provider: "unavailable",
        priceSource: "unavailable",
        priceMessage: reason
      });
      setAssetSearchStatus(reason);
    } finally {
      setPriceLoading(false);
    }
  }

  function applySelectedQuote(nextQuote: InvestmentAssetQuote) {
    setSymbol(nextQuote.symbol);
    setHasSelectedAsset(true);
    setSelectedQuote(nextQuote);
    setMarket((current) => ({ ...current, quotes: mergeQuote(current.quotes, nextQuote) }));
    setAccount((current) => (current ? { ...current, quotes: mergeQuote(current.quotes, nextQuote) } : current));
  }

  async function fetchSelectedSymbolPrice(actionLabel = "Fetching") {
    if (!hasSelectedAsset || !symbol) return;
    setPriceLoading(true);
    showToast(`${actionLabel} ${symbol} price from MarketData.app...`, "info");
    setAssetSearchStatus(`${actionLabel} ${symbol} price from the backend endpoint...`);
    try {
      const response = await fetch(`/api/investment/assets/quote?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; quote?: InvestmentAssetQuote; reason?: string; error?: string };

      if (response.ok && data.ok && data.quote?.priceAvailable && data.quote.latestClose > 0) {
        applySelectedQuote(data.quote);
        showToast(`${data.quote.symbol} price loaded: ${formatUsd(data.quote.latestClose)} from ${sourceLabel(data.quote)}.`, "success");
        setAssetSearchStatus("");
        return;
      }

      const message = data.reason ?? data.error ?? `${symbol} price is unavailable.`;
      showToast(message, "error");
      setAssetSearchStatus(message);
    } catch {
      const message = `${symbol} price endpoint is temporarily unavailable.`;
      showToast(message, "error");
      setAssetSearchStatus(message);
    } finally {
      setPriceLoading(false);
    }
  }

  async function refreshSelectedSymbol() {
    if (!symbol) return;
    setPriceLoading(true);
    showToast(`Refreshing ${symbol} server-side through /stocks/quotes...`, "info");
    try {
      const response = await fetch("/api/investment/refresh-symbol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
        cache: "no-store"
      });
      const data = (await response.json()) as RefreshSymbolPayload;
      if (!response.ok || !data.ok) {
        const message = data.error ?? data.result?.error ?? `Could not refresh ${symbol}.`;
        showToast(message, "error");
        setAssetSearchStatus(message);
        return;
      }
      if (data.quotes?.length) {
        setMarket((current) => ({ ...current, quotes: data.quotes as InvestmentAssetQuote[] }));
        const refreshedSelected = data.quotes.find((quote) => quote.symbol === symbol);
        if (refreshedSelected) setSelectedQuote(refreshedSelected);
      }
      const resultMessage = data.result?.message ?? `${symbol} refreshed.`;
      showToast(resultMessage, "success");
      setAssetSearchStatus("");
      if (account) void loadAccount(account.account.id);
    } catch {
      const message = `Could not refresh ${symbol}.`;
      showToast(message, "error");
      setAssetSearchStatus(message);
    } finally {
      setPriceLoading(false);
    }
  }

  async function submitTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !hasSelectedAsset) return;
    const submittedSide = side;
    const submittedSymbol = symbol;
    const submittedQuantity = quantity;
    const submittedQuote = selectedQuote;
    setBusy(true);
    showToast("Validating trade on the server...", "info");
    try {
      const response = await fetch("/api/investment/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.account.id,
          symbol: submittedSymbol,
          side: submittedSide,
          quantity: submittedQuantity
        })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        account?: InvestmentAccountView | null;
        price?: number;
        fee?: number;
        gross?: number;
        net?: number;
        reason?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.account) {
        showToast(data.reason ?? data.error ?? "Trade was rejected.", "error");
        return;
      }
      setAccount(data.account);
      showToast(
        `${submittedSide === "buy" ? "Bought" : "Sold"} ${submittedQuantity} ${submittedSymbol} at ${formatUsd(data.price ?? 0)}. Commission: ${formatUsd(data.fee ?? 0)}. ${submittedSide === "buy" ? "Total cost" : "Net proceeds"}: ${formatUsd(data.net ?? 0)}.`,
        "success"
      );
      if (submittedSide === "buy") {
        const latestTrade =
          data.account.trades.find(
            (trade) =>
              !trade.rejected &&
              trade.side === "buy" &&
              trade.symbol === submittedSymbol &&
              trade.quantity === submittedQuantity
          ) ?? null;
        const recentBuyTrade: InvestmentRecentBuyTradeContext = {
          accountId: data.account.account.id,
          symbol: submittedSymbol,
          companyName: submittedQuote.name,
          quantity: submittedQuantity,
          tradeValue: data.gross ?? (data.price ?? 0) * submittedQuantity,
          commission: data.fee ?? 0,
          totalCost: data.net ?? 0,
          executedAt: latestTrade?.executedAt ?? latestTrade?.createdAt ?? null
        };
        window.sessionStorage.setItem(INVESTMENT_RECENT_BUY_TRADE_STORAGE_KEY, JSON.stringify(recentBuyTrade));
        router.push("/investment/thesis");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitPosition() {
    if (!account || !hasSelectedAsset) return;
    setBusy(true);
    showToast(`Opening ${positionSide} ${symbol} x${positionLeverage} on the server...`, "info");
    try {
      const response = await fetch("/api/investment/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.account.id,
          symbol,
          side: positionSide,
          quantity,
          leverage: positionLeverage
        })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        account?: InvestmentAccountView | null;
        price?: number;
        fee?: number;
        margin?: number;
        exposure?: number;
        reason?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.account) {
        showToast(data.reason ?? data.error ?? "Position order was rejected.", "error");
        return;
      }
      setAccount(data.account);
      showToast(
        `Opened ${positionSide.toUpperCase()} ${quantity} ${symbol} x${positionLeverage} at ${formatUsd(data.price ?? 0)}. Margin: ${formatUsd(data.margin ?? 0)}. Exposure: ${formatUsd(data.exposure ?? 0)}. Commission: ${formatUsd(data.fee ?? 0)}.`,
        "success"
      );
    } finally {
      setBusy(false);
    }
  }

  async function closePosition(position: InvestmentPositionView) {
    if (!account) return;
    setBusy(true);
    showToast(`Closing ${position.side} ${position.symbol} position...`, "info");
    try {
      const response = await fetch(`/api/investment/positions/${position.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.account.id })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        account?: InvestmentAccountView | null;
        price?: number;
        fee?: number;
        realizedPnl?: number;
        liquidated?: boolean;
        reason?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.account) {
        showToast(data.reason ?? data.error ?? "Could not close position.", "error");
        return;
      }
      setAccount(data.account);
      showToast(
        `${data.liquidated ? "Liquidated" : "Closed"} ${position.side.toUpperCase()} ${position.symbol} at ${formatUsd(data.price ?? 0)}. Realized P/L: ${formatUsd(data.realizedPnl ?? 0)}. Closing commission: ${formatUsd(data.fee ?? 0)}.`,
        "success"
      );
    } finally {
      setBusy(false);
    }
  }

  const profitLoss = (portfolio?.totalValue ?? INVESTMENT_STARTING_CASH) - (portfolio?.startingCash ?? INVESTMENT_STARTING_CASH);
  const currentRankText = account?.currentRank?.rank ? `#${account.currentRank.rank}` : "Not ranked yet";
  const quickPickQuotes = useMemo(() => quotes.filter((quote) => quote.featured), [quotes]);
  const centerSuggestionQuotes = useMemo(() => {
    const preferredSymbols = ["AAPL", "AMD", "AMZN", "BAC"];
    const preferred = preferredSymbols
      .map((preferredSymbol) => quickPickQuotes.find((quote) => quote.symbol === preferredSymbol))
      .filter((quote): quote is InvestmentAssetQuote => Boolean(quote));
    return preferred.length ? preferred : quickPickQuotes.slice(0, 4);
  }, [quickPickQuotes]);
  const recentTrades = account?.trades.slice(0, 10) ?? [];
  const openPositions = account?.positions.filter((position) => position.status === "open") ?? [];
  const watchlistSymbols = ["AAPL", "AMD", "AMZN", "BAC", "COST", "DIS", "GLD"];
  const watchlistQuotes = useMemo(
    () => watchlistSymbols.map((sym) => quotes.find((q) => q.symbol === sym)).filter((q): q is InvestmentAssetQuote => q !== undefined),
    [quotes]
  );
  const typedTickerCandidate = assetQuery.trim().toUpperCase();
  const hasAssetSearchQuery = assetQuery.trim().length > 0;
  const showAssetResults = assetQuery.trim().length >= 2 && assetResults.length > 0;
  const canTryTypedTicker =
    /^[A-Z][A-Z0-9.-]{0,11}$/.test(typedTickerCandidate) &&
    !assetResults.some((asset) => asset.symbol === typedTickerCandidate) &&
    !quotes.some((asset) => asset.symbol === typedTickerCandidate);

  void holdingsCount;
  void currentRankText;

  return (
    <>
      {/* Mobile fallback */}
      <div className="mobile-desktop-only">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
        <p>This platform is designed for desktop.</p>
        <p>Please open it on a laptop or computer.</p>
      </div>

      {/* Trading terminal */}
      <div className="trading-terminal">

        {/* Zone A: Top bar */}
        <header className="t-topbar">
          <div className="t-topbar-left">
            <span className="t-team-name">Team: {account?.account.teamName ?? "—"}</span>
            <span className="t-topbar-sep">/</span>
            <span className="t-comp-name">{activeCompetition?.name ?? "Investment Challenge"}</span>
          </div>
          <div className="t-topbar-right">
            <span className={`t-market-badge ${marketStatus.isOpen ? "t-market-open" : "t-market-closed"}`}>
              <span className="t-market-dot" />
              {marketStatus.isOpen ? "Market Open" : "Market Closed"}
            </span>
            {marketStatus.etTime ? <span className="t-et-time">{marketStatus.etTime} ET</span> : null}
          </div>
        </header>

        {/* Zone B: Portfolio hero */}
        <div className="t-hero">
          <div className="t-hero-main">
            <span className="t-hero-label">PORTFOLIO VALUE</span>
            <div className="t-hero-value">{formatUsd(currentPortfolioValue)}</div>
          </div>
          <div className="t-hero-metrics">
            <div className="t-metric-pill">
              <span className="t-mpill-label">CASH</span>
              <span className="t-mpill-value">{formatUsd(cashBalance)}</span>
            </div>
            <div className="t-metric-pill">
              <span className="t-mpill-label">HOLDINGS</span>
              <span className="t-mpill-value">{formatUsd(portfolio?.holdingsValue ?? 0)}</span>
            </div>
            <div className="t-metric-pill">
              <span className="t-mpill-label">P&amp;L</span>
              <span className={`t-mpill-value ${profitLoss >= 0 ? "t-pos" : "t-neg"}`}>{formatUsd(profitLoss)}</span>
            </div>
            <div className="t-metric-pill">
              <span className="t-mpill-label">RETURN</span>
              <span className={`t-mpill-value ${(portfolio?.totalReturn ?? 0) >= 0 ? "t-pos" : "t-neg"}`}>
                {formatPercent(portfolio?.totalReturn ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Zone C: 3-column grid */}
        <div className="t-grid">

          {/* Left column: Asset browser */}
          <aside className="t-col-left">
            <input
              className="t-search"
              value={assetQuery}
              onChange={(e) => setAssetQuery(e.target.value)}
              placeholder="Search ticker or company name"
              autoComplete="off"
            />

            {showAssetResults && (
              <div className="t-search-results">
                {assetResults.map((asset) => (
                  <button key={asset.symbol} className="t-search-row" type="button" onClick={() => void selectAsset(asset)}>
                    <strong>{asset.symbol}</strong>
                    <span>{asset.name}</span>
                    {asset.priceAvailable && asset.latestClose ? <b>{formatUsd(asset.latestClose)}</b> : null}
                  </button>
                ))}
              </div>
            )}

            {hasAssetSearchQuery && canTryTypedTicker && (
              <button
                className="t-direct-pick"
                type="button"
                onClick={() => void selectAsset({ symbol: typedTickerCandidate, name: typedTickerCandidate, type: "Stock", theme: "US-listed asset", referencePrice: 0, region: "United States", currency: "USD", exchange: null, featured: false })}
              >
                Use ticker {typedTickerCandidate} →
              </button>
            )}

            {hasAssetSearchQuery && assetSearchStatus && (
              <p className="t-search-status">{assetSearchStatus}</p>
            )}

            {!hasAssetSearchQuery && (
              <>
                <div className="t-section-label" style={{ marginTop: 10 }}>Watchlist</div>
                <div className="t-wl-header">
                  <span>Asset</span><span>Price</span>
                </div>
                {watchlistQuotes.map((quote) => {
                  const pctChange = quote.referencePrice > 0 ? ((quote.latestClose - quote.referencePrice) / quote.referencePrice) * 100 : 0;
                  return (
                    <button
                      key={quote.symbol}
                      className={`t-wl-row${hasSelectedAsset && quote.symbol === symbol ? " t-wl-active" : ""}`}
                      type="button"
                      onClick={() => void selectAsset(quote)}
                    >
                      <div className="t-wl-left">
                        <strong>{quote.symbol}</strong>
                        <span>{quote.name}</span>
                      </div>
                      <div className="t-wl-right">
                        <strong>{quote.priceAvailable ? formatUsd(quote.latestClose) : "—"}</strong>
                        {quote.priceAvailable && quote.referencePrice > 0
                          ? <span className={pctChange >= 0 ? "t-pos" : "t-neg"}>{formatPercent(pctChange)}</span>
                          : null}
                      </div>
                    </button>
                  );
                })}
              </>
            )}

          </aside>

          {/* Center column: Trade panel */}
          <main className="t-col-center">
            <div className="t-section-label">Trade</div>

            <form className="t-trade-form" onSubmit={submitTrade}>
              {!hasSelectedAsset ? (
                <div className="t-trade-empty">
                  <p>Select an asset from the watchlist</p>
                  <div className="t-suggestion-chips">
                    {centerSuggestionQuotes.map((quote) => (
                      <button key={quote.symbol} className="t-chip" type="button" onClick={() => void selectAsset(quote)}>
                        {quote.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="t-asset-card">
                    <div className="t-asset-meta">{selectedQuote.name} · {selectedQuote.type} · {selectedQuote.region ?? "US"}</div>
                    <div className="t-asset-ticker">{selectedQuote.symbol}</div>
                    <div className="t-asset-price">{selectedPriceText}</div>
                    <div className="t-asset-source">
                      {priceLoading ? "Checking price..." : selectedQuote.priceAvailable
                        ? `${sourceLabel(selectedQuote)}${selectedQuote.priceDate ? ` · ${selectedQuote.priceDate}` : ""}`
                        : selectedQuote.priceMessage ?? "No saved price"}
                    </div>
                  </div>

                  <div className="t-side-toggle">
                    <button
                      type="button"
                      className={`t-side-btn t-side-buy${side === "buy" ? " t-side-active-buy" : ""}`}
                      onClick={() => setSide("buy")}
                    >BUY</button>
                    <button
                      type="button"
                      className={`t-side-btn t-side-sell${side === "sell" ? " t-side-active-sell" : ""}`}
                      onClick={() => setSide("sell")}
                    >SELL</button>
                  </div>

                  <div className="t-qty-row">
                    <label className="t-qty-label">
                      <span>SHARES</span>
                      <input
                        className="t-qty-input"
                        min={1}
                        step={1}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        required
                      />
                    </label>
                    <div className="t-est-group">
                      <div className="t-est-item">
                        <span>Est. total</span>
                        <strong>{formatUsd(estimatedNet)}</strong>
                      </div>
                      <div className="t-est-item">
                        <span>Fee ({feeRateLabel})</span>
                        <strong>{formatUsd(estimatedFee)}</strong>
                      </div>
                    </div>
                  </div>

                  {clientTradeWarning ? (
                    <div className="t-trade-warning">{clientTradeWarning}</div>
                  ) : null}

                  {!selectedQuote.priceAvailable ? (
                    <button
                      className="t-btn-sm"
                      type="button"
                      style={{ marginBottom: 8 }}
                      onClick={() => void fetchSelectedSymbolPrice("Fetching")}
                      disabled={priceLoading}
                    >
                      Fetch latest price
                    </button>
                  ) : null}

                  <button
                    className={`t-confirm-btn ${side === "buy" ? "t-confirm-buy" : "t-confirm-sell"}`}
                    type="submit"
                    disabled={!canTrade || busy}
                  >
                    {busy ? "Processing..." : side === "buy" ? "Confirm Buy" : "Confirm Sell"}
                  </button>

                  <button
                    className="t-leveraged-link"
                    type="button"
                    onClick={() => setShowLevPanel((v) => !v)}
                  >
                    {showLevPanel ? "Hide" : "Open"} Leveraged Position (Long / Short / x1–x3)
                  </button>
                </>
              )}
            </form>

            {/* Leveraged position panel */}
            {hasSelectedAsset && showLevPanel && (
              <div className="t-lev-panel">
                <div className="t-section-label" style={{ marginBottom: 8 }}>Leveraged Position</div>
                <div className="t-side-toggle">
                  <button type="button" className={`t-side-btn${positionSide === "long" ? " t-side-active-buy" : ""}`} onClick={() => setPositionSide("long")}>Long</button>
                  <button type="button" className={`t-side-btn${positionSide === "short" ? " t-side-active-sell" : ""}`} onClick={() => setPositionSide("short")}>Short</button>
                </div>
                <div className="t-side-toggle" style={{ marginTop: 6 }}>
                  {[1, 2, 3].map((level) => (
                    <button key={level} type="button" className={`t-side-btn${positionLeverage === level ? " t-side-active-buy" : ""}`} onClick={() => setPositionLeverage(level)}>
                      x{level}
                    </button>
                  ))}
                </div>
                <div className="t-lev-metrics">
                  <div className="t-lev-metric"><span>Margin</span><strong>{formatUsd(estimatedPositionMargin)}</strong></div>
                  <div className="t-lev-metric"><span>Exposure</span><strong>{formatUsd(estimatedGross)}</strong></div>
                  <div className="t-lev-metric"><span>Required cash</span><strong>{formatUsd(estimatedPositionRequired)}</strong></div>
                </div>
                {positionWarning ? <div className="t-trade-warning" style={{ marginTop: 6 }}>{positionWarning}</div> : null}
                <button
                  className="t-confirm-btn t-confirm-buy"
                  type="button"
                  disabled={!canOpenPosition || busy}
                  onClick={() => void submitPosition()}
                  style={{ marginTop: 8 }}
                >
                  {busy ? "Processing..." : `Open ${positionSide === "short" ? "Short" : "Long"} x${positionLeverage}`}
                </button>
                <p className="t-lev-disclaimer">Educational simulation. No real money used.</p>
              </div>
            )}
          </main>

          {/* Right column: Portfolio info */}
          <aside className="t-col-right">
            {/* Holdings & Positions */}
            <div className="t-section-label">Holdings</div>

            {(account?.holdings.length ?? 0) === 0 && openPositions.length === 0 ? (
              <p className="t-empty-msg">No positions yet.</p>
            ) : (
              <div className="t-holdings-list">
                {account?.holdings.map((holding) => (
                  <div key={holding.symbol} className="t-holding-row">
                    <div className="t-holding-left">
                      <strong>{holding.symbol}</strong>
                      <span>{holding.quantity} shares</span>
                    </div>
                    <div className="t-holding-right">
                      <strong>{formatUsd(holding.marketValue)}</strong>
                      <span className={holding.unrealizedGainLoss >= 0 ? "t-pos" : "t-neg"}>
                        {formatUsd(holding.unrealizedGainLoss)}
                      </span>
                    </div>
                  </div>
                ))}
                {openPositions.map((position) => (
                  <div key={position.id} className="t-holding-row">
                    <div className="t-holding-left">
                      <strong>{position.symbol} <span className="t-lev-badge">LEV</span></strong>
                      <span>{position.side.toUpperCase()} x{position.leverage}</span>
                    </div>
                    <div className="t-holding-right">
                      <strong>{formatUsd(position.exposureValue)}</strong>
                      <span className={position.unrealizedPnl >= 0 ? "t-pos" : "t-neg"}>
                        {formatUsd(position.unrealizedPnl)}
                      </span>
                      <button className="t-close-pos-btn" type="button" onClick={() => void closePosition(position)} disabled={busy}>
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Trades */}
            <div className="t-section-divider" />
            <div className="t-section-label">Recent Trades</div>

            {recentTrades.length === 0 ? (
              <p className="t-empty-msg">No trades yet.</p>
            ) : (
              <div className="t-trades-list">
                {recentTrades.map((trade, i) => (
                  <div key={i} className="t-trade-row">
                    <span className={`t-trade-badge ${trade.side === "buy" ? "t-badge-buy" : "t-badge-sell"}`}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="t-trade-ticker">{trade.symbol}</span>
                    <span className="t-trade-detail">{trade.quantity} @ {formatUsd(trade.price ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Competition */}
            <div className="t-section-divider" />

            <button className="t-right-btn" type="button" onClick={() => router.push("/investment-challenge/rules")}>Rules</button>
            <button className="t-right-btn t-thesis-btn" type="button" onClick={() => router.push("/investment/thesis")}>Thesis</button>
          </aside>
        </div>

        {/* Zone D: Footer */}
        <footer className="t-footer">
          Educational simulation only. Not real financial advice.
        </footer>

        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function sourceLabel(quote: InvestmentAssetQuote) {
  if (quote.priceSource === "cache") return "Saved cache";
  if (quote.priceSource === "marketdata_app") return "MarketData.app";
  if (quote.provider === "marketdata_app") return "MarketData.app";
  if (quote.priceSource === "reference") return "Educational reference";
  return quote.provider || "Market data";
}

function formatDateTime(value: string | null) {
  if (!value) return "Organizer controlled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Organizer controlled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function formatTradeTimestamp(value: string | null) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function MetricCard({
  label,
  value,
  tone,
  emphasis
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  emphasis?: "primary";
}) {
  const className = `metric-card-v2 ${emphasis === "primary" ? "metric-card-primary" : "metric-card-secondary"}`;
  return (
    <div className={className}>
      <span>{label}</span>
      <strong className={tone === "positive" ? "positive-text" : tone === "negative" ? "negative-text" : undefined}>
        {value}
      </strong>
    </div>
  );
}

void formatDateTime;
void formatTradeTimestamp;
void MetricCard;
void Link;
