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
import type { InvestmentAccountView, InvestmentCompetitionView, InvestmentLeaderboardRow } from "@/lib/server-investments";

type MarketPayload = {
  marketStatus: InvestmentMarketStatus;
  quotes: InvestmentAssetQuote[];
  educationalCards: InvestmentEducationalCard[];
};

type LeaderboardPayload = {
  rows: InvestmentLeaderboardRow[];
  persisted: boolean;
  competition?: InvestmentCompetitionView | null;
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

type DebugPricePayload = {
  symbol: string;
  provider: string;
  hasMarketDataApiKey: boolean;
  cacheFound: boolean;
  cachedPrice: number | null;
  cachedFetchedAt: string | null;
  cacheFresh: boolean;
  calledMarketDataApp: boolean;
  endpointUsed?: string | null;
  marketDataAppStatus: string;
  finalPrice: number | null;
  tradingDay: string | null;
  source: string | null;
  error: string | null;
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

export function InvestmentChallengeDashboard() {
  const router = useRouter();
  const [market, setMarket] = useState<MarketPayload>({
    marketStatus: defaultMarketStatus(),
    quotes: featuredQuotes(),
    educationalCards: INVESTMENT_EDUCATIONAL_CARDS
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload>({ rows: [], persisted: false });
  const [account, setAccount] = useState<InvestmentAccountView | null>(null);
  const [teamName, setTeamName] = useState("");
  const [participantLogin, setParticipantLogin] = useState("");
  const [competitionCode, setCompetitionCode] = useState("");
  const [resolvedCompetition, setResolvedCompetition] = useState<InvestmentCompetitionView | null>(null);
  const [symbol, setSymbol] = useState("SPY");
  const [selectedQuote, setSelectedQuote] = useState<InvestmentAssetQuote>(featuredQuotes()[0]);
  const [hasSelectedAsset, setHasSelectedAsset] = useState(false);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetResults, setAssetResults] = useState<InvestmentAssetSearchResult[]>([]);
  const [assetSearchStatus, setAssetSearchStatus] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [priceRefreshDetails, setPriceRefreshDetails] = useState("");
  const [debugPriceDetails, setDebugPriceDetails] = useState("");
  const [side, setSide] = useState<TradeSide>("buy");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadMarket();
    void loadLeaderboard();
    const storedAccountId = window.localStorage.getItem(INVESTMENT_ACCOUNT_STORAGE_KEY);
    if (storedAccountId) void loadAccount(storedAccountId);
  }, []);

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
  const activeCompetition = account?.competition ?? resolvedCompetition ?? leaderboard.competition ?? null;
  const portfolio = account?.portfolio;
  const holdingsCount = account?.holdings.length ?? 0;
  const estimatedGross = hasSelectedAsset && selectedQuote.priceAvailable ? selectedQuote.latestClose * Math.max(0, quantity) : 0;
  const estimatedFee = estimatedGross * INVESTMENT_TRANSACTION_FEE_RATE;
  const estimatedNet = side === "buy" ? estimatedGross + estimatedFee : Math.max(0, estimatedGross - estimatedFee);
  const ownedQuantity = hasSelectedAsset ? (account?.holdings.find((holding) => holding.symbol === symbol)?.quantity ?? 0) : 0;
  const cashBalance = portfolio?.cash ?? INVESTMENT_STARTING_CASH;
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

  async function loadLeaderboard(code = competitionCode) {
    const suffix = code.trim() ? `?competitionCode=${encodeURIComponent(code.trim())}` : "";
    const response = await fetch(`/api/investment/leaderboard${suffix}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as LeaderboardPayload;
    setLeaderboard(data);
    if (data.competition) setResolvedCompetition(data.competition);
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
      void loadLeaderboard(data.account.competition.code);
    }
  }

  async function resolveCompetitionCode() {
    const code = competitionCode.trim();
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
      void loadLeaderboard(data.competition.code);
    } catch {
      setStatus("Competition code lookup is temporarily unavailable.");
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Creating team portfolio...");
    try {
      const response = await fetch("/api/investment/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, participantLogin, competitionCode: competitionCode.trim() || undefined })
      });
      const data = (await response.json()) as { account?: InvestmentAccountView | null; reason?: string; error?: string };
      if (!response.ok || !data.account) {
        setStatus(data.error ?? data.reason ?? "Portfolio storage is not configured yet.");
        return;
      }
      window.localStorage.setItem(INVESTMENT_ACCOUNT_STORAGE_KEY, data.account.account.id);
      setAccount(data.account);
      setResolvedCompetition(data.account.competition);
      setCompetitionCode(data.account.competition.code);
      setStatus(`Portfolio ready for ${data.account.account.teamName}.`);
      void loadLeaderboard(data.account.competition.code);
    } finally {
      setBusy(false);
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

  async function refreshFeaturedPrices() {
    setRefreshingPrices(true);
    setStatus("Refreshing featured prices server-side through /stocks/prices...");
    setPriceRefreshDetails("");
    try {
      const response = await fetch("/api/investment/refresh-featured-prices", {
        method: "POST",
        cache: "no-store"
      });
      const data = (await response.json()) as RefreshPricesPayload;
      if (!response.ok || !data.ok) {
        const message = data.error ?? "Featured prices could not be refreshed.";
        setStatus(message);
        setPriceRefreshDetails(message);
        return;
      }

      if (data.quotes?.length) {
        setMarket((current) => ({ ...current, quotes: data.quotes as InvestmentAssetQuote[] }));
        const refreshedSelected = data.quotes.find((quote) => quote.symbol === symbol);
        if (refreshedSelected) setSelectedQuote(refreshedSelected);
      } else {
        await loadMarket();
      }

      const successes = data.results?.filter((result) => result.success ?? result.ok).length ?? 0;
      const failures = data.results?.filter((result) => !(result.success ?? result.ok)).length ?? 0;
      const apiLimit = data.apiLimitReached ? " API credit limit reached for some tickers; saved prices are still used when available." : "";
      const detail = `Featured price refresh complete: ${successes} updated or cached, ${failures} failed.${apiLimit}`;
      setStatus(detail);
      setPriceRefreshDetails(detail);
      void loadLeaderboard(account?.competition.code ?? competitionCode);
      if (account) void loadAccount(account.account.id);
    } finally {
      setRefreshingPrices(false);
    }
  }

  async function refreshSelectedSymbol() {
    if (!symbol) return;
    setPriceLoading(true);
    setStatus(`Refreshing ${symbol} server-side through /stocks/prices...`);
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
      void loadLeaderboard(account?.competition.code ?? competitionCode);
    } catch {
      const message = `Could not refresh ${symbol}.`;
      setStatus(message);
      setAssetSearchStatus(message);
    } finally {
      setPriceLoading(false);
    }
  }

  async function testSpyPrice() {
    setDebugPriceDetails("Testing SPY through cache and /stocks/prices...");
    try {
      const response = await fetch("/api/investment/debug-price?symbol=SPY", { cache: "no-store" });
      const data = (await response.json()) as DebugPricePayload;
      setDebugPriceDetails(JSON.stringify(data, null, 2));
      if (data.finalPrice) {
        setStatus(`SPY debug succeeded: ${formatUsd(data.finalPrice)} from ${data.source ?? "market data"}.`);
        await selectAsset({
          symbol: "SPY",
          name: "SPDR S&P 500 ETF",
          type: "ETF",
          theme: "Broad US stocks",
          referencePrice: data.finalPrice,
          region: "United States",
          currency: "USD",
          exchange: "NYSE Arca",
          featured: true
        });
      } else {
        setStatus(data.error ?? "SPY debug did not return a final price.");
      }
    } catch {
      const message = "SPY debug endpoint is temporarily unavailable.";
      setDebugPriceDetails(message);
      setStatus(message);
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
      void loadLeaderboard(account.competition.code);
    } finally {
      setBusy(false);
    }
  }

  const topLeaderboard = useMemo(() => leaderboard.rows.slice(0, 5), [leaderboard.rows]);
  const profitLoss = (portfolio?.totalValue ?? INVESTMENT_STARTING_CASH) - (portfolio?.startingCash ?? INVESTMENT_STARTING_CASH);
  const currentRankText = account?.currentRank?.rank ? `#${account.currentRank.rank}` : "Not ranked yet";
  const quickPickQuotes = useMemo(() => quotes.filter((quote) => quote.featured).slice(0, 6), [quotes]);
  const centerSuggestionQuotes = quickPickQuotes.slice(0, 4);
  const recentTrades = account?.trades.slice(0, 5) ?? [];
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

  return (
    <div className="investment-app stack-xl">
      <section className="investment-hero-v2">
        <div className="investment-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia Investment Challenge</p>
            <h1>Build a $100,000 virtual portfolio</h1>
            <p>
              Search US stocks and ETFs, use cached educational stock prices, write an investment thesis, and learn how return,
              risk, diversification, and market discipline work together.
            </p>
          </div>
          <div className="cta-row">
            <a className="button primary" href="#team-portfolio">
              Start Portfolio
            </a>
            <button className="button secondary" type="button" onClick={refreshFeaturedPrices} disabled={refreshingPrices}>
              {refreshingPrices ? "Refreshing prices..." : "Refresh featured prices"}
            </button>
            <button className="button secondary" type="button" onClick={testSpyPrice}>
              Test SPY price
            </button>
            <Link className="button secondary" href="/investment-challenge/leaderboard">
              View Leaderboard
            </Link>
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Rules
            </Link>
            <Link className="button secondary" href="/investment-challenge/options">
              Options Simulator
            </Link>
          </div>
        </div>
        <aside className="market-status-card-v2">
          <div className="market-status-head">
            <span>US market</span>
            <strong className={marketStatus.isOpen ? "positive-text" : "negative-text"}>
              {marketStatus.isOpen ? "Open" : "Closed"}
            </strong>
          </div>
          <p>{compactMarketMessage}</p>
          <div className="market-status-grid">
            <div><span>Starting cash</span><strong>{formatUsd(INVESTMENT_STARTING_CASH)}</strong></div>
            <div><span>Commission</span><strong>{feeRateLabel}</strong></div>
            <div><span>Prices</span><strong>Daily close</strong></div>
            <div><span>ET time</span><strong>{marketStatus.etTime || "Review"}</strong></div>
          </div>
        </aside>
      </section>

      {activeCompetition ? (
        <section className={`panel stack-md competition-banner ${activeCompetition.isTeenvestor ? "teenvestor" : ""}`}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Competition code: {activeCompetition.code}</p>
              <h2>{activeCompetition.welcomeMessage ?? activeCompetition.name}</h2>
              <p className="muted">{activeCompetition.description ?? "Educational portfolio competition with virtual cash only."}</p>
            </div>
            <span className={`pill ${activeCompetition.runtimeStatus === "active" ? "positive-text" : "negative-text"}`}>
              {activeCompetition.runtimeStatus === "not_started"
                ? "Not started"
                : activeCompetition.runtimeStatus === "closed"
                  ? "Competition closed"
                  : "Competition active"}
            </span>
          </div>
          <div className="competition-facts-grid">
            <div><span>Starting capital</span><strong>{formatUsd(activeCompetition.startingCash)}</strong></div>
            <div><span>Start date</span><strong>{formatDateTime(activeCompetition.startAt)}</strong></div>
            <div><span>End date</span><strong>{formatDateTime(activeCompetition.endAt)}</strong></div>
            <div><span>Ranking</span><strong>{activeCompetition.runtimeStatus === "closed" ? "Final" : "Live"}</strong></div>
          </div>
        </section>
      ) : null}

      <section className="investment-summary-section" id="team-portfolio">
        <article className="panel stack-md portfolio-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Portfolio dashboard</p>
              <h2>{account ? account.account.teamName : "Create your team account"}</h2>
            </div>
            <span className="pill">Virtual cash only</span>
          </div>

          {!account ? (
            <form className="team-setup-form" onSubmit={createAccount}>
              <label className="form-field">
                <span>Team name</span>
                <input value={teamName} onChange={(event) => setTeamName(event.target.value)} required />
              </label>
              <label className="form-field">
                <span>Competition login or class code</span>
                <input value={participantLogin} onChange={(event) => setParticipantLogin(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Investment competition code</span>
                <input
                  value={competitionCode}
                  onChange={(event) => setCompetitionCode(event.target.value)}
                  onBlur={resolveCompetitionCode}
                  placeholder="Teenvestor.school"
                />
              </label>
              <button className="button secondary" type="button" onClick={resolveCompetitionCode}>
                Check Competition Code
              </button>
              <button className="button primary" type="submit" disabled={busy}>
                Create $100,000 Portfolio
              </button>
            </form>
          ) : null}

          <div className="portfolio-metric-grid">
            <MetricCard label="Starting balance" value={formatUsd(portfolio?.startingCash ?? INVESTMENT_STARTING_CASH)} />
            <MetricCard label="Current cash" value={formatUsd(portfolio?.cash ?? INVESTMENT_STARTING_CASH)} />
            <MetricCard label="Portfolio value" value={formatUsd(portfolio?.totalValue ?? INVESTMENT_STARTING_CASH)} />
            <MetricCard label="Daily change" value={formatPercent(portfolio?.dailyChange ?? 0)} tone={(portfolio?.dailyChange ?? 0) >= 0 ? "positive" : "negative"} />
            <MetricCard label="Total return" value={formatPercent(portfolio?.totalReturn ?? 0)} tone={(portfolio?.totalReturn ?? 0) >= 0 ? "positive" : "negative"} />
            <MetricCard label="Profit / loss" value={formatUsd(profitLoss)} tone={profitLoss >= 0 ? "positive" : "negative"} />
            <MetricCard label="Current rank" value={currentRankText} />
            <MetricCard label="Holdings" value={String(holdingsCount)} />
            <MetricCard label="Diversification" value={`${portfolio?.diversificationScore ?? 0}/100`} />
            <MetricCard label="Risk score" value={`${portfolio?.riskScore ?? 0}/100`} />
          </div>
          {status ? <p className="form-status investment-status">{status}</p> : null}
        </article>
      </section>

      <section className="investment-workspace-grid">
        <aside className="panel stack-md investment-search-sidebar">
          <div className="section-header">
            <div>
              <p className="eyebrow">Asset search</p>
              <h2>Find a stock or ETF</h2>
            </div>
          </div>

          <div className="asset-picker">
            <label className="form-field">
              <span>Search asset</span>
              <input
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
                placeholder="Type AAPL, Apple, Microsoft, SPY..."
                autoComplete="off"
              />
            </label>

            {!hasAssetSearchQuery ? (
              <div className="asset-search-empty">
                <p>Search by company name or ticker, or start with one of these common picks.</p>
                <div className="asset-quick-picks" aria-label="Quick pick assets">
                  {quickPickQuotes.map((quote) => (
                    <button
                      key={quote.symbol}
                      type="button"
                      onClick={() => selectAsset(quote)}
                      className={hasSelectedAsset && quote.symbol === symbol ? "selected" : ""}
                    >
                      <strong>{quote.symbol}</strong>
                      <span>{quote.type}</span>
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
            {priceRefreshDetails ? <p className="asset-search-status">{priceRefreshDetails}</p> : null}
            {debugPriceDetails ? <pre className="investment-debug-output">{debugPriceDetails}</pre> : null}
          </div>

          <button className="button secondary compact-button" type="button" onClick={refreshFeaturedPrices} disabled={refreshingPrices}>
            {refreshingPrices ? "Refreshing prices..." : "Refresh saved prices"}
          </button>
          {hasSelectedAsset ? (
            <div className="selected-asset-actions">
              <button className="button secondary compact-button" type="button" onClick={() => selectAsset(selectedQuote)} disabled={priceLoading}>
                Fetch price
              </button>
              <button className="button secondary compact-button" type="button" onClick={refreshSelectedSymbol} disabled={priceLoading}>
                Refresh this symbol
              </button>
            </div>
          ) : null}
        </aside>

        <form className="panel stack-md trade-ticket-v2 investment-trade-dashboard" onSubmit={submitTrade}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Investment dashboard</p>
              <h2>{hasSelectedAsset ? "Review and trade" : "Choose an asset to begin"}</h2>
            </div>
          </div>

          {!hasSelectedAsset ? (
            <div className="trade-empty-state">
              <strong>Search for an asset on the left to place your first simulated trade.</strong>
              <div className="trade-step-guide" aria-label="Trade steps">
                <span>Search asset</span>
                <span>Refresh price</span>
                <span>Confirm trade</span>
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

              <p className="trade-research-note">
                Research the business, risks, valuation, and portfolio fit before buying. The simulation rewards the reasoning behind the trade as well as the return.
              </p>

              {clientTradeWarning ? <p className="market-closed-note">{clientTradeWarning}</p> : null}
              {!selectedQuote.priceAvailable ? (
                <button className="button secondary" type="button" onClick={() => selectAsset(selectedQuote)} disabled={priceLoading}>
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
              <div><span>Total invested</span><strong>{formatUsd(portfolio?.holdingsValue ?? 0)}</strong></div>
              <div><span>Portfolio status</span><strong>{latestPortfolioStatus}</strong></div>
            </section>
          ) : null}
          {account?.holdings.length ? (
            <Link className="button secondary" href="/investment/thesis">
              Write Investment Thesis
            </Link>
          ) : null}
        </form>

        <aside className="investment-side-stack">
        <section className="panel stack-md holdings-panel-v2">
          <div className="section-header">
            <div>
              <p className="eyebrow">Holdings</p>
              <h2>Positions, value, gains, and weights</h2>
            </div>
            <span className="pill">No short selling · No margin</span>
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
                      <div><dt>Value</dt><dd>{formatUsd(holding.marketValue)}</dd></div>
                      <div><dt>Gain/Loss</dt><dd className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(holding.unrealizedGainLoss)}</dd></div>
                      <div><dt>Weight</dt><dd>{holding.weight.toFixed(1)}%</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

          <section className="panel stack-md portfolio-activity-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Portfolio activity</p>
                <h2>Latest simulated orders</h2>
              </div>
            </div>
            <div className="activity-list">
              {recentTrades.length ? (
                recentTrades.map((trade) => (
                  <article className="activity-row" key={trade.id}>
                    <span>{trade.side.toUpperCase()} {trade.quantity} {trade.symbol}</span>
                    <strong>{trade.price ? formatUsd(trade.price) : "Rejected"}</strong>
                    <small>
                      {trade.rejected
                        ? trade.rejectReason ?? "Rejected"
                        : `${trade.executedAt?.slice(0, 16) ?? trade.createdAt.slice(0, 16)} · commission ${formatUsd(trade.feeAmount)}`}
                    </small>
                  </article>
                ))
              ) : (
                <p className="muted">Your trades will appear here after your first simulated order.</p>
              )}
            </div>
          </section>

          <aside className="panel stack-md leaderboard-preview-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Leaderboard preview</p>
                <h2>Balanced score ranking</h2>
              </div>
              <Link className="text-link" href="/investment-challenge/leaderboard">
                Full leaderboard
              </Link>
            </div>
            <div className="leaderboard-preview-list">
              {topLeaderboard.length ? (
                topLeaderboard.map((row) => (
                  <article key={row.accountId} className="leaderboard-preview-row">
                    <span>#{row.rank}</span>
                    <div>
                      <strong>{row.teamName}</strong>
                      <small>{formatUsd(row.totalValue)} · {formatPercent(row.totalReturn)}</small>
                    </div>
                    <b>{row.diversificationScore}</b>
                  </article>
                ))
              ) : (
                <p className="muted">No ranked portfolios yet. Create the first team portfolio to start the board.</p>
              )}
            </div>
          </aside>
        </aside>
      </section>

      <section className="investment-dashboard-grid">
        <aside className="panel stack-md investment-risk-panel">
          <p className="eyebrow">Rules and risk</p>
          <h2>Market closed means orders pause, not prices.</h2>
          <p className="muted">
            Latest saved prices remain visible from the Supabase cache. MarketData.app is called only through the approved
            /stocks/prices endpoint by server actions, admin refreshes, selected tickers, held assets, or cron jobs so the challenge saves API credits.
          </p>
          <div className="score-formula-note">
            40% return · 20% risk-adjusted · 15% diversification · 15% thesis · 10% drawdown control
          </div>
        </aside>
      </section>
      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Educational cards</p>
            <h2>Short finance explanations while you invest</h2>
          </div>
        </div>
        <div className="investment-education-grid-v2">
          {educationCards.map((card) => (
            <article className="lesson-card stack-sm" key={card.title}>
              <span className="mini-status open">{card.concept}</span>
              <h3>{card.title}</h3>
              <p className="muted">{card.body}</p>
            </article>
          ))}
        </div>
      </section>
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

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="metric-card-v2">
      <span>{label}</span>
      <strong className={tone === "positive" ? "positive-text" : tone === "negative" ? "negative-text" : undefined}>
        {value}
      </strong>
    </div>
  );
}
