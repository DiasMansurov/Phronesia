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
  const recentTrades = account?.trades.slice(0, 5) ?? [];
  const openPositions = account?.positions.filter((position) => position.status === "open") ?? [];
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
    },
    { label: "Current Cash", value: formatUsd(portfolio?.cash ?? INVESTMENT_STARTING_CASH) },
    { label: "Current Rank", value: currentRankText }
  ];
  const secondaryMetrics: Array<{ label: string; value: string; tone?: "positive" | "negative" }> = [
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
    <div className="investment-app investment-student-product stack-xl">
      <section className="investment-hero-v2 investment-dashboard-hero">
        <div className="investment-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1>Team Portfolio Workspace</h1>
            <p>
              Build and manage your virtual portfolio, analyze real companies, and track your competition performance.
            </p>
            <div className="investment-hero-team-chip">
              <span>{activeCompetition?.name ?? "Teenvestor Investment Competition"}</span>
              <strong>{account ? `Team: ${account.account.teamName}` : "Team access required"}</strong>
            </div>
          </div>
          <div className="cta-row">
            <a className="button primary" href="#team-portfolio">
              {account ? "Continue Portfolio" : "Start Portfolio"}
            </a>
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Rules
            </Link>
            <Link className="button secondary" href="/investment-challenge/options">
              Options Simulator
            </Link>
          </div>
        </div>
        <aside className="market-status-card-v2 investment-hero-status-card">
          <div className="market-status-head">
            <span>Market Status</span>
            <strong className={marketStatus.isOpen ? "positive-text" : "negative-text"}>
              {marketStatus.isOpen ? "Open" : "Closed"}
            </strong>
          </div>
          <p>{compactMarketMessage}</p>
          <div className="market-status-grid">
            <div><span>US Market</span><strong>{marketStatus.isOpen ? "Open" : "Closed"}</strong></div>
            <div><span>Price mode</span><strong>{priceModeLabel}</strong></div>
            <div><span>Starting cash</span><strong>{formatUsd(INVESTMENT_STARTING_CASH)}</strong></div>
            <div><span>Commission</span><strong>{feeRateLabel}</strong></div>
            <div><span>ET time</span><strong>{marketStatus.etTime || "Review"}</strong></div>
          </div>
        </aside>

        {activeCompetition ? (
          <div className={`competition-inline-strip ${activeCompetition.isTeenvestor ? "teenvestor" : ""}`}>
            <span className={`pill ${activeCompetition.runtimeStatus === "active" ? "positive-text" : "negative-text"}`}>
              {activeCompetition.runtimeStatus === "not_started"
                ? "Not started"
                : activeCompetition.runtimeStatus === "closed"
                  ? "Competition closed"
                  : "Competition active"}
            </span>
            <div><span>Competition</span><strong>{activeCompetition.name}</strong></div>
            <div><span>Starting capital</span><strong>{formatUsd(activeCompetition.startingCash)}</strong></div>
            <div><span>Start date</span><strong>{formatDateTime(activeCompetition.startAt)}</strong></div>
            <div><span>End date</span><strong>{formatDateTime(activeCompetition.endAt)}</strong></div>
            <div><span>Ranking</span><strong>{activeCompetition.runtimeStatus === "closed" ? "Final" : "Live"}</strong></div>
          </div>
        ) : null}
      </section>

      <section className="investment-summary-section" id="team-portfolio">
        <article className="panel stack-md portfolio-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Portfolio summary</p>
              <h2>{account ? account.account.teamName : "Team access required"}</h2>
            </div>
            <span className="pill">Protected student area</span>
          </div>

          {!account ? (
            <div className="investment-empty-state">
              <strong>Open the join page to create or enter a team portfolio.</strong>
              <p>
                Team portfolios are stored in Supabase and unlocked with competition code, team name, and team password.
              </p>
              <Link className="button primary" href="/investment-challenge/join">
                Join Competition
              </Link>
            </div>
          ) : null}

          <div className="portfolio-kpi-stack">
            <div className="portfolio-metric-grid investment-stat-grid portfolio-primary-kpis">
              {primaryMetrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} emphasis="primary" />
              ))}
            </div>
            <div className="portfolio-metric-grid investment-stat-grid portfolio-secondary-kpis">
              {secondaryMetrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </div>
          </div>
          {status ? <p className="form-status investment-status">{status}</p> : null}
        </article>
      </section>

      <section className="investment-workspace-grid">
        <aside className="panel stack-md investment-search-sidebar investment-asset-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Asset Search</p>
              <h2>Asset Search</h2>
              <p className="muted small">Search stocks and ETFs for your team portfolio.</p>
            </div>
          </div>

          <div className="asset-picker">
            <label className="form-field">
              <span>Search asset</span>
              <input
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
                placeholder="Search ticker or company name"
                autoComplete="off"
              />
            </label>

            {!hasAssetSearchQuery ? (
              <div className="asset-search-empty">
                <p>Search by company name or ticker, or start from the competition watchlist.</p>
                <div className="asset-quick-picks asset-watchlist" aria-label="Quick pick assets">
                  {quickPickQuotes.map((quote) => (
                    <button
                      key={quote.symbol}
                      type="button"
                      onClick={() => selectAsset(quote)}
                      className={hasSelectedAsset && quote.symbol === symbol ? "selected" : ""}
                    >
                      <span className="asset-row-symbol">
                        <strong>{quote.symbol}</strong>
                      </span>
                      <span className="asset-row-copy">
                        <span>{quote.name}</span>
                        <small>{quote.theme}</small>
                      </span>
                      <span className="asset-type-badge">{quote.type}</span>
                      <b>{quote.priceAvailable ? formatUsd(quote.latestClose) : "Select"}</b>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showAssetResults ? (
              <div className="asset-results" role="listbox" aria-label="Asset search results">
                {assetResults.map((asset) => (
                  <button key={asset.symbol} type="button" onClick={() => selectAsset(asset)}>
                    <strong>{asset.symbol}</strong>
                    <span>{asset.name}</span>
                    <small>
                      {asset.type} · {asset.region ?? "United States"} · {asset.currency ?? "USD"}
                      {asset.priceAvailable && asset.latestClose ? ` · ${formatUsd(asset.latestClose)}` : ""}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}
            {hasAssetSearchQuery && canTryTypedTicker ? (
              <button
                className="asset-direct-pick"
                type="button"
                onClick={() =>
                  selectAsset({
                    symbol: typedTickerCandidate,
                    name: typedTickerCandidate,
                    type: "Stock",
                    theme: "US-listed asset",
                    referencePrice: 0,
                    region: "United States",
                    currency: "USD",
                    exchange: null,
                    featured: false
                  })
                }
              >
                Use ticker {typedTickerCandidate} and check price
              </button>
            ) : null}
            {hasAssetSearchQuery && assetSearchStatus ? <p className="asset-search-status">{assetSearchStatus}</p> : null}
          </div>

          {hasSelectedAsset ? (
            <div className="selected-asset-actions">
              <button className="button secondary compact-button" type="button" onClick={() => fetchSelectedSymbolPrice("Fetching")} disabled={priceLoading}>
                Fetch price
              </button>
              <button className="button secondary compact-button" type="button" onClick={refreshSelectedSymbol} disabled={priceLoading}>
                Refresh this symbol
              </button>
            </div>
          ) : null}
        </aside>

        <form className="panel stack-md trade-ticket-v2 investment-trade-dashboard investment-trade-panel" onSubmit={submitTrade}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Selected asset / trade panel</p>
              <h2>{hasSelectedAsset ? "Review and trade" : "Select an asset to begin"}</h2>
            </div>
          </div>

          {!hasSelectedAsset ? (
            <div className="trade-empty-state">
              <strong>Select an asset to begin.</strong>
              <p>Choose a stock or ETF from the watchlist to review its price and place your first simulated trade.</p>
              <div className="trade-step-guide" aria-label="Trade steps">
                <span><b>1</b>Search asset</span>
                <span><b>2</b>Review price</span>
                <span><b>3</b>Confirm trade</span>
              </div>
              <div className="asset-suggestion-row" aria-label="Example tickers">
                {centerSuggestionQuotes.map((quote) => (
                  <button key={quote.symbol} type="button" onClick={() => selectAsset(quote)}>
                    {quote.symbol}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="selected-asset-card asset-preview-card">
                <div>
                  <span>Selected asset</span>
                  <strong>{selectedQuote.symbol}</strong>
                  <p>{selectedQuote.name}</p>
                </div>
                <div className="asset-preview-meta">
                  <span>Details</span>
                  <p>{selectedQuote.type}</p>
                  <p>{selectedQuote.region ?? "United States"} · {selectedQuote.currency ?? "USD"}</p>
                </div>
              </div>

              <div className="asset-price-status">
                <div>
                  <span>Latest price</span>
                  <strong>{selectedPriceText}</strong>
                  <p>
                    {selectedQuote.priceAvailable
                      ? `Price date: ${selectedQuote.priceDate ?? "latest saved"} · Source: ${sourceLabel(selectedQuote)} · Status: ${selectedQuote.cacheStatus ?? "cached"}${
                          selectedQuote.fetchedAt ? ` · Updated: ${new Date(selectedQuote.fetchedAt).toLocaleString("en-US")}` : ""
                        }`
                      : selectedQuote.priceMessage ?? "No saved price yet. Select the asset to fetch the latest price."}
                  </p>
                </div>
                <span className={selectedQuote.priceAvailable ? "positive-text" : "negative-text"}>{priceStatusLabel}</span>
              </div>

              <div className="trade-side-toggle" aria-label="Trade side">
                <button type="button" className={side === "buy" ? "selected" : ""} onClick={() => setSide("buy")}>
                  Buy
                </button>
                <button type="button" className={side === "sell" ? "selected" : ""} onClick={() => setSide("sell")}>
                  Sell
                </button>
              </div>

              <label className="form-field">
                <span>Quantity</span>
                <input
                  min={1}
                  step={1}
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                />
              </label>

              <div className="trade-readiness-grid">
                <div><span>Price status</span><strong>{priceStatusLabel}</strong></div>
                <div><span>Quantity selected</span><strong>{quantity}</strong></div>
                <div><span>Estimated trade value</span><strong>{formatUsd(estimatedGross)}</strong></div>
                <div><span>Estimated commission</span><strong>{formatUsd(estimatedFee)}</strong></div>
                <div><span>{totalCostLabel}</span><strong>{formatUsd(estimatedNet)}</strong></div>
              </div>

              <div className="position-ticket-sim">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Long / short / leverage</p>
                    <h3>Open a virtual position</h3>
                  </div>
                  <span className="pill">Max x3</span>
                </div>
                <div className="trade-side-toggle" aria-label="Position direction">
                  <button type="button" className={positionSide === "long" ? "selected" : ""} onClick={() => setPositionSide("long")}>
                    Long
                  </button>
                  <button type="button" className={positionSide === "short" ? "selected" : ""} onClick={() => setPositionSide("short")}>
                    Short
                  </button>
                </div>
                <div className="trade-side-toggle" aria-label="Position leverage">
                  {[1, 2, 3].map((level) => (
                    <button key={level} type="button" className={positionLeverage === level ? "selected" : ""} onClick={() => setPositionLeverage(level)}>
                      x{level}
                    </button>
                  ))}
                </div>
                <div className="trade-readiness-grid">
                  <div><span>Estimated margin</span><strong>{formatUsd(estimatedPositionMargin)}</strong></div>
                  <div><span>Exposure</span><strong>{formatUsd(estimatedGross)}</strong></div>
                  <div><span>Commission</span><strong>{formatUsd(estimatedFee)}</strong></div>
                  <div><span>Required cash</span><strong>{formatUsd(estimatedPositionRequired)}</strong></div>
                </div>
                <p className="trade-research-note">
                  Long, short, and leverage features are part of an educational simulation. No real money is used. This is not financial advice.
                  Leverage increases both simulated gains and simulated losses. Losses are limited to the margin used in this educational simulation.
                </p>
                {positionWarning ? <p className="market-closed-note">{positionWarning}</p> : null}
                <button className="button primary" type="button" disabled={!canOpenPosition} onClick={submitPosition}>
                  Open {positionSide === "short" ? "Short" : "Long"} x{positionLeverage}
                </button>
              </div>

              <p className="trade-research-note">
                Research the business, risks, valuation, and portfolio fit before buying. The simulation rewards the reasoning behind the trade as well as the return.
              </p>

              {clientTradeWarning ? <p className="market-closed-note">{clientTradeWarning}</p> : null}
              {!selectedQuote.priceAvailable ? (
                <button className="button secondary" type="button" onClick={() => fetchSelectedSymbolPrice("Fetching")} disabled={priceLoading}>
                  Try refresh price
                </button>
              ) : null}
              <button className="button primary" type="submit" disabled={!canTrade}>
                {priceLoading ? "Checking latest price..." : "Submit server-validated trade"}
              </button>
            </>
          )}

          {account?.holdings.length ? (
            <section className="portfolio-center-summary" aria-label="Portfolio summary">
              <div><span>Cash balance</span><strong>{formatUsd(cashBalance)}</strong></div>
              <div><span>Holdings count</span><strong>{holdingsCount}</strong></div>
              <div><span>Holdings value</span><strong>{formatUsd(portfolio?.holdingsValue ?? 0)}</strong></div>
              <div><span>Portfolio status</span><strong>{latestPortfolioStatus}</strong></div>
            </section>
          ) : null}
          {account?.holdings.length ? (
            <Link className="button secondary" href="/investment/thesis">
              Write Investment Thesis
            </Link>
          ) : null}
        </form>

        <aside className="investment-side-stack portfolio-sidebar-v2">
          <section className="panel stack-md holdings-panel-v2 position-panel-v2">
            <div className="section-header">
              <div>
                <h2>Open Positions</h2>
                <p className="muted small">Long, short, leverage, margin, and P/L</p>
              </div>
              <span className="pill">Educational simulation</span>
            </div>

            {!openPositions.length ? (
              <div className="investment-empty-state">
                <strong>No open leveraged positions.</strong>
                <p>Use the long/short panel after selecting an asset to open a virtual position with x1, x2, or x3 leverage.</p>
              </div>
            ) : (
              <div className="position-card-list">
                {openPositions.map((position) => (
                  <article className="position-card" key={position.id}>
                    <div className="position-card-head">
                      <div>
                        <strong>{position.symbol}</strong>
                        <span>{position.assetName}</span>
                      </div>
                      <span className={`pill ${position.side === "long" ? "positive-text" : "negative-text"}`}>
                        {position.side.toUpperCase()} x{position.leverage}
                      </span>
                    </div>
                    <dl>
                      <div><dt>Quantity</dt><dd>{position.quantity}</dd></div>
                      <div><dt>Entry</dt><dd>{formatUsd(position.entryPrice)}</dd></div>
                      <div><dt>Current</dt><dd>{formatUsd(position.currentPrice)}</dd></div>
                      <div><dt>Margin</dt><dd>{formatUsd(position.marginLocked)}</dd></div>
                      <div><dt>Exposure</dt><dd>{formatUsd(position.exposureValue)}</dd></div>
                      <div><dt>Position equity</dt><dd>{formatUsd(position.marginLocked + position.unrealizedPnl)}</dd></div>
                      <div>
                        <dt>Unrealized P/L</dt>
                        <dd className={position.unrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(position.unrealizedPnl)}</dd>
                      </div>
                    </dl>
                    <button className="button secondary compact-button" type="button" disabled={busy || !marketStatus.isOpen} onClick={() => closePosition(position)}>
                      Close position
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel stack-md holdings-panel-v2">
            <div className="section-header">
              <div>
                <h2>Holdings</h2>
                <p className="muted small">Positions, value, gains, and weights</p>
              </div>
              <span className="pill">Legacy long-only holdings</span>
            </div>

            {!account?.holdings.length ? (
              <div className="investment-empty-state">
                <strong>Your portfolio is empty.</strong>
                <p>
                  Search for an asset, review the latest cached stock price, and place your first simulated trade when the market is open.
                </p>
              </div>
            ) : (
              <>
                <div className="table-wrap desktop-holdings">
                  <table className="record-table investment-table-v2">
                    <thead>
                      <tr>
                        <th>Ticker</th>
                        <th>Asset</th>
                        <th>Quantity</th>
                        <th>Average buy</th>
                        <th>Latest price</th>
                        <th>Current value</th>
                        <th>Unrealized gain/loss</th>
                        <th>Unrealized return</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.holdings.map((holding) => (
                        <tr key={holding.symbol}>
                          <td>{holding.symbol}</td>
                          <td>{holding.assetName}</td>
                          <td>{holding.quantity}</td>
                          <td>{formatUsd(holding.averageBuyPrice)}</td>
                          <td>{formatUsd(holding.latestClose)}</td>
                          <td>{formatUsd(holding.marketValue)}</td>
                          <td className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>
                            {formatUsd(holding.unrealizedGainLoss)}
                          </td>
                          <td className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>
                            {holding.averageBuyPrice > 0 ? formatPercent(((holding.latestClose - holding.averageBuyPrice) / holding.averageBuyPrice) * 100) : "n/a"}
                          </td>
                          <td>{holding.weight.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-holding-cards">
                  {account.holdings.map((holding) => (
                    <article className="mobile-holding-card" key={holding.symbol}>
                      <div>
                        <strong>{holding.symbol}</strong>
                        <span>{holding.assetName}</span>
                      </div>
                      <dl>
                        <div><dt>Qty</dt><dd>{holding.quantity}</dd></div>
                        <div><dt>Current</dt><dd>{formatUsd(holding.latestClose)}</dd></div>
                        <div><dt>Value</dt><dd>{formatUsd(holding.marketValue)}</dd></div>
                        <div><dt>Gain/Loss</dt><dd className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(holding.unrealizedGainLoss)}</dd></div>
                        <div><dt>Return</dt><dd className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>{holding.averageBuyPrice > 0 ? formatPercent(((holding.latestClose - holding.averageBuyPrice) / holding.averageBuyPrice) * 100) : "n/a"}</dd></div>
                        <div><dt>Weight</dt><dd>{holding.weight.toFixed(1)}%</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="panel stack-md portfolio-activity-panel investment-order-feed">
            <div className="section-header">
              <div>
                <h2>Portfolio Activity</h2>
                <p className="muted small">Latest simulated orders</p>
              </div>
            </div>
            <div className="activity-list">
              {recentTrades.length ? (
                recentTrades.map((trade) => (
                  <article className="activity-row" key={trade.id}>
                    <span>
                      {formatTradeTimestamp(trade.executedAt ?? trade.createdAt)} · {(trade.action ?? trade.side).replaceAll("_", " ").toUpperCase()} {trade.symbol}
                    </span>
                    <strong>
                      {trade.rejected
                        ? "Rejected"
                        : `${trade.quantity} ${trade.quantity === 1 ? "share" : "shares"} · ${formatUsd(trade.price)}${
                            trade.leverage ? ` · x${trade.leverage}` : ""
                          }`}
                    </strong>
                    <small>
                      {trade.rejected
                        ? trade.rejectReason ?? "Rejected"
                        : `${trade.assetName} · Trade ${formatUsd(trade.grossValue)} · Fee ${formatUsd(trade.feeAmount)} · ${
                            trade.action?.startsWith("open") || trade.side === "buy" ? "Total" : "Net"
                          } ${formatUsd(trade.netValue)}${
                            trade.marginUsed ? ` · Margin ${formatUsd(trade.marginUsed)}` : ""
                          }${
                            trade.realizedPnl ? ` · Realized P/L ${formatUsd(trade.realizedPnl)}` : ""
                          }`}
                    </small>
                  </article>
                ))
              ) : (
                <p className="muted">Your trades will appear here after your first simulated order.</p>
              )}
            </div>
          </section>

        </aside>
      </section>

      <section className="panel stack-md investment-risk-panel rules-risk-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Rules and risk</p>
            <h2>Market closed means orders pause, not prices.</h2>
          </div>
        </div>
        <p className="muted">
          Latest saved prices remain visible from the Supabase cache. MarketData.app is called only through approved
          endpoints to save API credits.
        </p>
        <div className="score-formula-note">
          40% return · 20% risk-adjusted · 15% diversification · 15% thesis · 10% drawdown control
        </div>
      </section>
      <details className="panel finance-card-drawer">
        <summary>
          <div>
            <p className="eyebrow">Finance cards</p>
            <h2>Finance cards</h2>
            <p className="muted small">Short explanations while you invest.</p>
          </div>
          <span className="finance-card-toggle">View all finance cards</span>
        </summary>
        <div className="investment-education-grid-v2">
          {educationCards.map((card) => (
            <article className="lesson-card stack-sm" key={card.title}>
              <span className="mini-status open">{card.concept}</span>
              <h3>{card.title}</h3>
              <p className="muted">{card.body}</p>
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
