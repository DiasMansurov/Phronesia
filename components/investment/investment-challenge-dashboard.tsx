"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
  const compactMarketMessage = marketStatus.isOpen ? marketStatus.message : closedMessage;
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
  const priceModeLabel = marketStatus.isOpen ? "Live if available" : "Cached prices";

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
      setStatus("Using the public Phronesia Investment Challenge.");
      return;
    }
    setStatus("Checking competition code...");
    try {
      const response = await fetch(`/api/investment/competitions/resolve?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; competition?: InvestmentCompetitionView; reason?: string };
      if (!response.ok || !data.competition) {
        setStatus(data.reason ?? "Competition code was not found.");
        return;
      }
      setResolvedCompetition(data.competition);
      setStatus(data.competition.welcomeMessage ?? `Competition loaded: ${data.competition.name}.`);
    } catch {
      setStatus("Competition code lookup is temporarily unavailable.");
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
    setStatus(`${actionLabel} ${symbol} price from MarketData.app...`);
    setAssetSearchStatus(`${actionLabel} ${symbol} price from the backend endpoint...`);
    try {
      const response = await fetch(`/api/investment/assets/quote?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; quote?: InvestmentAssetQuote; reason?: string; error?: string };

      if (response.ok && data.ok && data.quote?.priceAvailable && data.quote.latestClose > 0) {
        applySelectedQuote(data.quote);
        setStatus(`${data.quote.symbol} price loaded: ${formatUsd(data.quote.latestClose)} from ${sourceLabel(data.quote)}.`);
        setAssetSearchStatus("");
        return;
      }

      const message = data.reason ?? data.error ?? `${symbol} price is unavailable.`;
      setStatus(message);
      setAssetSearchStatus(message);
    } catch {
      const message = `${symbol} price endpoint is temporarily unavailable.`;
      setStatus(message);
      setAssetSearchStatus(message);
    } finally {
      setPriceLoading(false);
    }
  }

  async function refreshSelectedSymbol() {
    if (!symbol) return;
    setPriceLoading(true);
    setStatus(`Refreshing ${symbol} server-side through /stocks/quotes...`);
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
        setStatus(message);
        setAssetSearchStatus(message);
        return;
      }
      if (data.quotes?.length) {
        setMarket((current) => ({ ...current, quotes: data.quotes as InvestmentAssetQuote[] }));
        const refreshedSelected = data.quotes.find((quote) => quote.symbol === symbol);
        if (refreshedSelected) setSelectedQuote(refreshedSelected);
      }
      const resultMessage = data.result?.message ?? `${symbol} refreshed.`;
      setStatus(resultMessage);
      setAssetSearchStatus("");
      if (account) void loadAccount(account.account.id);
    } catch {
      const message = `Could not refresh ${symbol}.`;
      setStatus(message);
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
    setStatus("Validating trade on the server...");
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
        setStatus(data.reason ?? data.error ?? "Trade was rejected.");
        return;
      }
      setAccount(data.account);
      setStatus(
        `${submittedSide === "buy" ? "Bought" : "Sold"} ${submittedQuantity} ${submittedSymbol} at ${formatUsd(data.price ?? 0)}. Commission: ${formatUsd(
          data.fee ?? 0
        )}. ${submittedSide === "buy" ? "Total cost" : "Net proceeds"}: ${formatUsd(data.net ?? 0)}.`
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
    setStatus(`Opening ${positionSide} ${symbol} x${positionLeverage} on the server...`);
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
        setStatus(data.reason ?? data.error ?? "Position order was rejected.");
        return;
      }
      setAccount(data.account);
      setStatus(
        `Opened ${positionSide.toUpperCase()} ${quantity} ${symbol} x${positionLeverage} at ${formatUsd(data.price ?? 0)}. Margin: ${formatUsd(
          data.margin ?? 0
        )}. Exposure: ${formatUsd(data.exposure ?? 0)}. Commission: ${formatUsd(data.fee ?? 0)}.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function closePosition(position: InvestmentPositionView) {
    if (!account) return;
    setBusy(true);
    setStatus(`Closing ${position.side} ${position.symbol} position...`);
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
        setStatus(data.reason ?? data.error ?? "Could not close position.");
        return;
      }
      setAccount(data.account);
      setStatus(
        `${data.liquidated ? "Liquidated" : "Closed"} ${position.side.toUpperCase()} ${position.symbol} at ${formatUsd(data.price ?? 0)}. Realized P/L: ${formatUsd(
          data.realizedPnl ?? 0
        )}. Closing commission: ${formatUsd(data.fee ?? 0)}.`
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
  const educationCards = market.educationalCards.filter((card) =>
    ["Stocks", "ETFs", "Diversification", "Market Hours", "Closing Price", "Risk vs Return"].includes(card.title)
  );
  const typedTickerCandidate = assetQuery.trim().toUpperCase();
  const hasAssetSearchQuery = assetQuery.trim().length > 0;
  const showAssetResults = assetQuery.trim().length >= 2 && assetResults.length > 0;
  const canTryTypedTicker =
    /^[A-Z][A-Z0-9.-]{0,11}$/.test(typedTickerCandidate) &&
    !assetResults.some((asset) => asset.symbol === typedTickerCandidate) &&
    !quotes.some((asset) => asset.symbol === typedTickerCandidate);
  const totalCostLabel = side === "buy" ? "Estimated total cost" : "Estimated net proceeds";
  const priceStatusLabel = priceLoading ? "Checking price" : selectedQuote.priceAvailable ? "Price available" : "Price missing";
  const latestPortfolioStatus = portfolio
    ? `${formatUsd(portfolio.totalValue)} · ${formatPercent(portfolio.totalReturn)}`
    : "Not available";
  const primaryMetrics: Array<{ label: string; value: string; tone?: "positive" | "negative" }> = [
    { label: "Portfolio Value", value: formatUsd(portfolio?.totalValue ?? INVESTMENT_STARTING_CASH) },
    {
      label: "Total Return",
      value: formatPercent(portfolio?.totalReturn ?? 0),
      tone: (portfolio?.totalReturn ?? 0) >= 0 ? "positive" : "negative"
    }
  ];
  const secondaryMetrics: Array<{ label: string; value: string; tone?: "positive" | "negative" }> = [
    { label: "Current Cash", value: formatUsd(portfolio?.cash ?? INVESTMENT_STARTING_CASH) },
    { label: "Current Rank", value: currentRankText },
    { label: "Starting Balance", value: formatUsd(portfolio?.startingCash ?? INVESTMENT_STARTING_CASH) },
    {
      label: "Daily Change",
      value: formatPercent(portfolio?.dailyChange ?? 0),
      tone: (portfolio?.dailyChange ?? 0) >= 0 ? "positive" : "negative"
    },
    { label: "Profit / Loss", value: formatUsd(profitLoss), tone: profitLoss >= 0 ? "positive" : "negative" },
    { label: "Holdings", value: String(holdingsCount) },
    { label: "Locked Margin", value: formatUsd(portfolio?.lockedMargin ?? 0) },
    { label: "Open Exposure", value: formatUsd(portfolio?.totalExposure ?? 0) },
    {
      label: "Position P/L",
      value: formatUsd(portfolio?.unrealizedPnl ?? 0),
      tone: (portfolio?.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"
    },
    { label: "Diversification", value: `${portfolio?.diversificationScore ?? 0}/100` },
    { label: "Risk Score", value: `${portfolio?.riskScore ?? 0}/100` }
  ];

  return (
    <div className="trading-terminal">
      {/* Header */}
      <header className="terminal-header">
        <div className="terminal-header-left">
          <strong className="terminal-team-label">
            {account ? `Team: ${account.account.teamName}` : "Team access required"}
          </strong>
          {activeCompetition ? (
            <span className="terminal-comp-name">{activeCompetition.name}</span>
          ) : null}
        </div>
        <div className="terminal-header-right">
          <span className={`terminal-market-badge ${marketStatus.isOpen ? "open" : "closed"}`}>
            {marketStatus.isOpen ? "● Market Open" : "● Market Closed"}
          </span>
          {marketStatus.etTime ? <span className="terminal-et-time">{marketStatus.etTime} ET</span> : null}
          {!account ? (
            <Link className="terminal-join-btn" href="/investment-challenge/join">
              Join Competition
            </Link>
          ) : null}
        </div>
      </header>

      {status ? (
        <div className="terminal-status-bar">
          <span>{status}</span>
        </div>
      ) : null}

      {/* 3-column grid */}
      <div className="terminal-grid">

        {/* LEFT: Asset Browser */}
        <aside className="terminal-left">
          <div className="terminal-search-wrap">
            <input
              className="terminal-search"
              value={assetQuery}
              onChange={(event) => setAssetQuery(event.target.value)}
              placeholder="Search ticker or company name"
              autoComplete="off"
            />
          </div>

          {showAssetResults ? (
            <div className="terminal-search-results">
              {assetResults.map((asset) => (
                <button
                  key={asset.symbol}
                  className="terminal-search-result-row"
                  type="button"
                  onClick={() => void selectAsset(asset)}
                >
                  <strong>{asset.symbol}</strong>
                  <span>{asset.name}</span>
                  {asset.priceAvailable && asset.latestClose ? <b>{formatUsd(asset.latestClose)}</b> : null}
                </button>
              ))}
            </div>
          ) : null}

          {hasAssetSearchQuery && canTryTypedTicker ? (
            <button
              className="terminal-direct-pick"
              type="button"
              onClick={() => void selectAsset({ symbol: typedTickerCandidate, name: typedTickerCandidate, type: "Stock", theme: "US-listed asset", referencePrice: 0, region: "United States", currency: "USD", exchange: null, featured: false })}
            >
              Use ticker {typedTickerCandidate} →
            </button>
          ) : null}

          {hasAssetSearchQuery && assetSearchStatus ? (
            <p className="terminal-search-status">{assetSearchStatus}</p>
          ) : null}

          {!hasAssetSearchQuery ? (
            <div className="terminal-watchlist">
              <div className="terminal-watchlist-header">
                <span>Watchlist</span>
                <span>Price</span>
              </div>
              {watchlistQuotes.map((quote) => {
                const pctChange = quote.referencePrice > 0 ? ((quote.latestClose - quote.referencePrice) / quote.referencePrice) * 100 : 0;
                return (
                  <button
                    key={quote.symbol}
                    className={`terminal-watchlist-row${hasSelectedAsset && quote.symbol === symbol ? " active" : ""}`}
                    type="button"
                    onClick={() => void selectAsset(quote)}
                  >
                    <div className="terminal-wl-ticker">
                      <strong>{quote.symbol}</strong>
                      <span>{quote.name}</span>
                    </div>
                    <div className="terminal-wl-price">
                      <strong>{quote.priceAvailable ? formatUsd(quote.latestClose) : "—"}</strong>
                      {quote.priceAvailable && quote.referencePrice > 0 ? (
                        <span className={pctChange >= 0 ? "terminal-pos" : "terminal-neg"}>{formatPercent(pctChange)}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              <div className="terminal-watchlist-divider" />
              {quickPickQuotes.filter((q) => !watchlistSymbols.includes(q.symbol)).map((quote) => (
                <button
                  key={quote.symbol}
                  className={`terminal-watchlist-row terminal-wl-sm${hasSelectedAsset && quote.symbol === symbol ? " active" : ""}`}
                  type="button"
                  onClick={() => void selectAsset(quote)}
                >
                  <div className="terminal-wl-ticker">
                    <strong>{quote.symbol}</strong>
                  </div>
                  <div className="terminal-wl-price">
                    <strong>{quote.priceAvailable ? formatUsd(quote.latestClose) : "—"}</strong>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {hasSelectedAsset ? (
            <div className="terminal-price-actions">
              <button className="terminal-btn-sm" type="button" onClick={() => void fetchSelectedSymbolPrice("Fetching")} disabled={priceLoading}>
                Fetch price
              </button>
              <button className="terminal-btn-sm" type="button" onClick={() => void refreshSelectedSymbol()} disabled={priceLoading}>
                Refresh
              </button>
            </div>
          ) : null}
        </aside>

        {/* CENTER: Main Workspace */}
        <main className="terminal-center">
          {/* Portfolio Hero */}
          <div className="terminal-portfolio-hero">
            {!account ? (
              <div className="terminal-no-account">
                <strong>Join the competition to start trading</strong>
                <p>Team portfolios are unlocked with a competition code, team name, and password.</p>
                <Link className="button primary" href="/investment-challenge/join">Join Competition</Link>
              </div>
            ) : (
              <>
                <div className="terminal-portfolio-main">
                  <div>
                    <span className="terminal-hero-label">Portfolio Value</span>
                    <div className={`terminal-portfolio-value${profitLoss >= 0 ? " terminal-pos" : " terminal-neg"}`}>
                      {formatUsd(currentPortfolioValue)}
                    </div>
                  </div>
                  <div className="terminal-portfolio-return">
                    <span className={`terminal-return-badge${(portfolio?.totalReturn ?? 0) >= 0 ? " terminal-pos-bg" : " terminal-neg-bg"}`}>
                      {formatPercent(portfolio?.totalReturn ?? 0)}
                    </span>
                    <span className="terminal-hero-sub">{currentRankText}</span>
                  </div>
                </div>
                <div className="terminal-portfolio-metrics">
                  <div className="terminal-metric">
                    <span>Cash</span>
                    <strong>{formatUsd(cashBalance)}</strong>
                  </div>
                  <div className="terminal-metric">
                    <span>Holdings</span>
                    <strong>{formatUsd(portfolio?.holdingsValue ?? 0)}</strong>
                  </div>
                  <div className="terminal-metric">
                    <span>P&amp;L</span>
                    <strong className={profitLoss >= 0 ? "terminal-pos" : "terminal-neg"}>{formatUsd(profitLoss)}</strong>
                  </div>
                  <div className="terminal-metric">
                    <span>Return</span>
                    <strong className={(portfolio?.totalReturn ?? 0) >= 0 ? "terminal-pos" : "terminal-neg"}>
                      {formatPercent(portfolio?.totalReturn ?? 0)}
                    </strong>
                  </div>
                  <div className="terminal-metric">
                    <span>Rank</span>
                    <strong>{currentRankText}</strong>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Trade Panel */}
          <form className="terminal-trade-panel" onSubmit={submitTrade}>
            {!hasSelectedAsset ? (
              <div className="terminal-trade-empty">
                <strong>Select an asset to trade</strong>
                <p>Choose a stock or ETF from the watchlist on the left.</p>
                <div className="terminal-suggestion-chips">
                  {centerSuggestionQuotes.map((quote) => (
                    <button key={quote.symbol} className="terminal-chip" type="button" onClick={() => void selectAsset(quote)}>
                      {quote.symbol}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="terminal-asset-display">
                  <div className="terminal-asset-info">
                    <strong className="terminal-asset-ticker">{selectedQuote.symbol}</strong>
                    <span className="terminal-asset-name">{selectedQuote.name}</span>
                    <span className="terminal-asset-type">{selectedQuote.type} · {selectedQuote.region ?? "US"}</span>
                  </div>
                  <div className="terminal-asset-price-block">
                    <strong className="terminal-price-big">{selectedPriceText}</strong>
                    <span className={`terminal-price-status-label${selectedQuote.priceAvailable ? " terminal-pos" : " terminal-neg"}`}>
                      {priceLoading ? "Checking..." : selectedQuote.priceAvailable
                        ? `${sourceLabel(selectedQuote)}${selectedQuote.priceDate ? ` · ${selectedQuote.priceDate}` : ""}`
                        : selectedQuote.priceMessage ?? "No saved price"}
                    </span>
                  </div>
                </div>

                <div className="terminal-trade-controls">
                  <div className="terminal-side-toggle">
                    <button type="button" className={`terminal-side-btn buy${side === "buy" ? " active" : ""}`} onClick={() => setSide("buy")}>
                      BUY
                    </button>
                    <button type="button" className={`terminal-side-btn sell${side === "sell" ? " active" : ""}`} onClick={() => setSide("sell")}>
                      SELL
                    </button>
                  </div>

                  <div className="terminal-qty-row">
                    <label className="terminal-qty-label">
                      <span>Shares</span>
                      <input
                        className="terminal-qty-input"
                        min={1}
                        step={1}
                        type="number"
                        value={quantity}
                        onChange={(event) => setQuantity(Number(event.target.value))}
                        required
                      />
                    </label>
                    <div className="terminal-est-block">
                      <span>Est. total</span>
                      <strong>{formatUsd(estimatedNet)}</strong>
                    </div>
                    <div className="terminal-est-block">
                      <span>Fee ({feeRateLabel})</span>
                      <strong>{formatUsd(estimatedFee)}</strong>
                    </div>
                  </div>

                  {clientTradeWarning ? <p className="terminal-warning">{clientTradeWarning}</p> : null}

                  {!selectedQuote.priceAvailable ? (
                    <button className="terminal-btn-sm" type="button" onClick={() => void fetchSelectedSymbolPrice("Fetching")} disabled={priceLoading}>
                      Fetch latest price
                    </button>
                  ) : null}

                  <button className="terminal-submit-btn" type="submit" disabled={!canTrade}>
                    {priceLoading ? "Checking price..." : busy ? "Submitting..." : `Confirm ${side === "buy" ? "Buy" : "Sell"}`}
                  </button>

                  {account?.holdings.length ? (
                    <Link className="terminal-thesis-link" href="/investment/thesis">
                      Write Investment Thesis →
                    </Link>
                  ) : null}
                </div>

                {/* Leveraged position — collapsed */}
                <details className="terminal-position-ticket">
                  <summary>Open Leveraged Position (Long / Short / x1–x3)</summary>
                  <div className="terminal-position-body">
                    <div className="terminal-side-toggle">
                      <button type="button" className={`terminal-side-btn${positionSide === "long" ? " active" : ""}`} onClick={() => setPositionSide("long")}>Long</button>
                      <button type="button" className={`terminal-side-btn${positionSide === "short" ? " active" : ""}`} onClick={() => setPositionSide("short")}>Short</button>
                    </div>
                    <div className="terminal-side-toggle">
                      {[1, 2, 3].map((level) => (
                        <button key={level} type="button" className={`terminal-side-btn${positionLeverage === level ? " active" : ""}`} onClick={() => setPositionLeverage(level)}>
                          x{level}
                        </button>
                      ))}
                    </div>
                    <div className="terminal-pos-metrics">
                      <div><span>Margin</span><strong>{formatUsd(estimatedPositionMargin)}</strong></div>
                      <div><span>Exposure</span><strong>{formatUsd(estimatedGross)}</strong></div>
                      <div><span>Required cash</span><strong>{formatUsd(estimatedPositionRequired)}</strong></div>
                    </div>
                    {positionWarning ? <p className="terminal-warning">{positionWarning}</p> : null}
                    <button className="terminal-submit-btn" type="button" disabled={!canOpenPosition} onClick={() => void submitPosition()}>
                      Open {positionSide === "short" ? "Short" : "Long"} x{positionLeverage}
                    </button>
                    <p className="terminal-disclaimer">Educational simulation only. No real money used. Losses are limited to margin.</p>
                  </div>
                </details>
              </>
            )}
          </form>

          {/* Holdings Table */}
          <div className="terminal-section terminal-holdings-section">
            <div className="terminal-section-header">
              <span>Holdings</span>
              <span className="terminal-holdings-count">{holdingsCount} position{holdingsCount !== 1 ? "s" : ""}</span>
            </div>
            {!account?.holdings.length ? (
              <p className="terminal-empty-note">No holdings yet. Buy your first asset to get started.</p>
            ) : (
              <div className="table-wrap">
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Shares</th>
                      <th>Avg Price</th>
                      <th>Current</th>
                      <th>Value</th>
                      <th>P&amp;L</th>
                      <th>Weight</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.holdings.map((holding) => (
                      <tr
                        key={holding.symbol}
                        onClick={() => {
                          const q = quotes.find((q) => q.symbol === holding.symbol);
                          if (q) void selectAsset(q);
                          else void selectAsset({ symbol: holding.symbol, name: holding.assetName, type: "Stock", theme: "", referencePrice: holding.averageBuyPrice, region: "United States", currency: "USD", exchange: null, featured: false });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <strong>{holding.symbol}</strong>
                          <span className="terminal-holding-name">{holding.assetName}</span>
                        </td>
                        <td>{holding.quantity}</td>
                        <td>{formatUsd(holding.averageBuyPrice)}</td>
                        <td>{formatUsd(holding.latestClose)}</td>
                        <td>{formatUsd(holding.marketValue)}</td>
                        <td className={holding.unrealizedGainLoss >= 0 ? "terminal-pos" : "terminal-neg"}>
                          {formatUsd(holding.unrealizedGainLoss)}
                          <span className="terminal-holding-pct">
                            {holding.averageBuyPrice > 0 ? formatPercent(((holding.latestClose - holding.averageBuyPrice) / holding.averageBuyPrice) * 100) : ""}
                          </span>
                        </td>
                        <td>{holding.weight.toFixed(1)}%</td>
                        <td>
                          <button
                            className="terminal-sell-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const q = quotes.find((q) => q.symbol === holding.symbol);
                              if (q) void selectAsset(q);
                              else void selectAsset({ symbol: holding.symbol, name: holding.assetName, type: "Stock", theme: "", referencePrice: holding.averageBuyPrice, region: "United States", currency: "USD", exchange: null, featured: false });
                              setSide("sell");
                            }}
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT: Activity & Stats */}
        <aside className="terminal-right">
          {/* Open Positions */}
          <div className="terminal-section">
            <div className="terminal-section-header">
              <span>Open Positions</span>
              <span className="terminal-count">{openPositions.length}</span>
            </div>
            {!openPositions.length ? (
              <p className="terminal-empty-note">No open leveraged positions.</p>
            ) : (
              <div className="terminal-position-list">
                {openPositions.map((position) => (
                  <div className="terminal-position-row" key={position.id}>
                    <div className="terminal-pos-head">
                      <div className="terminal-pos-head-left">
                        <strong>{position.symbol}</strong>
                        <span className={`terminal-pos-badge${position.side === "long" ? " terminal-pos" : " terminal-neg"}`}>
                          {position.side.toUpperCase()} x{position.leverage}
                        </span>
                      </div>
                      <span className={position.unrealizedPnl >= 0 ? "terminal-pos" : "terminal-neg"}>
                        {formatUsd(position.unrealizedPnl)}
                      </span>
                    </div>
                    <div className="terminal-pos-details">
                      <span>Qty {position.quantity}</span>
                      <span>Entry {formatUsd(position.entryPrice)}</span>
                      <span>Now {formatUsd(position.currentPrice)}</span>
                    </div>
                    <button
                      className="terminal-close-btn"
                      type="button"
                      disabled={busy || !marketStatus.isOpen}
                      onClick={() => void closePosition(position)}
                    >
                      Close position
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div className="terminal-section">
            <div className="terminal-section-header">
              <span>Recent Trades</span>
            </div>
            {!recentTrades.length ? (
              <p className="terminal-empty-note">No trades yet.</p>
            ) : (
              <div className="terminal-trade-feed">
                {recentTrades.map((trade) => (
                  <div className="terminal-trade-row" key={trade.id}>
                    <div className="terminal-trade-head">
                      <span className={`terminal-trade-side${trade.side === "buy" ? " terminal-pos" : " terminal-neg"}`}>
                        {(trade.action ?? trade.side).replaceAll("_", " ").toUpperCase()}
                      </span>
                      <strong>{trade.symbol}</strong>
                      <span className="terminal-trade-time">{formatTradeTimestamp(trade.executedAt ?? trade.createdAt)}</span>
                    </div>
                    {trade.rejected ? (
                      <span className="terminal-neg terminal-trade-detail">Rejected: {trade.rejectReason ?? ""}</span>
                    ) : (
                      <span className="terminal-trade-detail">
                        {trade.quantity} shares · {formatUsd(trade.price)}
                        {trade.leverage ? ` · x${trade.leverage}` : ""}
                        {trade.realizedPnl ? ` · P/L ${formatUsd(trade.realizedPnl)}` : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competition info */}
          {activeCompetition ? (
            <div className="terminal-section">
              <div className="terminal-section-header">
                <span>Competition</span>
                <span className={activeCompetition.runtimeStatus === "active" ? "terminal-pos" : "terminal-neg"}>
                  {activeCompetition.runtimeStatus === "active" ? "Active" : activeCompetition.runtimeStatus === "not_started" ? "Not started" : "Closed"}
                </span>
              </div>
              <div className="terminal-comp-details">
                <div><span>Name</span><strong>{activeCompetition.name}</strong></div>
                <div><span>Starting cash</span><strong>{formatUsd(activeCompetition.startingCash)}</strong></div>
                <div><span>Start</span><strong>{formatDateTime(activeCompetition.startAt)}</strong></div>
                <div><span>End</span><strong>{formatDateTime(activeCompetition.endAt)}</strong></div>
                <div><span>Your rank</span><strong>{currentRankText}</strong></div>
                <div><span>Diversification</span><strong>{portfolio?.diversificationScore ?? 0}/100</strong></div>
                <div><span>Risk score</span><strong>{portfolio?.riskScore ?? 0}/100</strong></div>
              </div>
              <div className="terminal-scoring-note">
                40% return · 20% risk-adjusted · 15% diversification · 15% thesis · 10% drawdown
              </div>
            </div>
          ) : null}

          {/* Links */}
          <div className="terminal-links">
            <Link className="terminal-link-btn" href="/investment-challenge/rules">Rules</Link>
            <Link className="terminal-link-btn" href="/investment-challenge/options">Options Simulator</Link>
          </div>
        </aside>
      </div>

      {/* Educational content — collapsed */}
      <details className="terminal-education-drawer">
        <summary>Finance Cards</summary>
        <div className="terminal-education-grid">
          {educationCards.map((card) => (
            <article className="terminal-edu-card" key={card.title}>
              <span>{card.concept}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
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
