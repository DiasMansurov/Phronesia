"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  INVESTMENT_ASSETS,
  INVESTMENT_EDUCATIONAL_CARDS,
  INVESTMENT_STARTING_CASH,
  INVESTMENT_TRANSACTION_FEE_RATE,
  formatPercent,
  formatUsd,
  type InvestmentAssetQuote,
  type InvestmentAssetSearchResult,
  type InvestmentEducationalCard,
  type InvestmentMarketStatus,
  type TradeSide
} from "@/lib/investment-challenge";
import type { InvestmentAccountView, InvestmentLeaderboardRow } from "@/lib/server-investments";

type MarketPayload = {
  marketStatus: InvestmentMarketStatus;
  quotes: InvestmentAssetQuote[];
  educationalCards: InvestmentEducationalCard[];
};

type LeaderboardPayload = {
  rows: InvestmentLeaderboardRow[];
  persisted: boolean;
};

const accountStorageKey = "phronesia.investmentChallenge.accountId";
const closedMessage =
  "US market is closed. Latest closing prices are still shown. Trading reopens at 9:30 AM ET.";

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
    priceMessage: "No saved price yet. Use Refresh featured prices or wait for the next daily market update."
  }));
}

function mergeQuote(quotes: InvestmentAssetQuote[], next: InvestmentAssetQuote) {
  const filtered = quotes.filter((quote) => quote.symbol !== next.symbol);
  return [next, ...filtered];
}

export function InvestmentChallengeDashboard() {
  const [market, setMarket] = useState<MarketPayload>({
    marketStatus: defaultMarketStatus(),
    quotes: featuredQuotes(),
    educationalCards: INVESTMENT_EDUCATIONAL_CARDS
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload>({ rows: [], persisted: false });
  const [account, setAccount] = useState<InvestmentAccountView | null>(null);
  const [teamName, setTeamName] = useState("");
  const [participantLogin, setParticipantLogin] = useState("");
  const [symbol, setSymbol] = useState("SPY");
  const [selectedQuote, setSelectedQuote] = useState<InvestmentAssetQuote>(featuredQuotes()[0]);
  const [assetQuery, setAssetQuery] = useState("SPY");
  const [assetResults, setAssetResults] = useState<InvestmentAssetSearchResult[]>([]);
  const [assetSearchStatus, setAssetSearchStatus] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [side, setSide] = useState<TradeSide>("buy");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [thesis, setThesis] = useState({
    thesis: "",
    risks: "",
    diversificationLogic: "",
    macroView: ""
  });

  useEffect(() => {
    void loadMarket();
    void loadLeaderboard();
    void selectAsset(featuredQuotes()[0]);
    const storedAccountId = window.localStorage.getItem(accountStorageKey);
    if (storedAccountId) void loadAccount(storedAccountId);
  }, []);

  useEffect(() => {
    if (!account?.thesis) return;
    setThesis({
      thesis: account.thesis.thesis,
      risks: account.thesis.risks,
      diversificationLogic: account.thesis.diversificationLogic,
      macroView: account.thesis.macroView
    });
  }, [account]);

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
  const portfolio = account?.portfolio;
  const holdingsCount = account?.holdings.length ?? 0;
  const estimatedGross = selectedQuote.priceAvailable ? selectedQuote.latestClose * Math.max(0, quantity) : 0;
  const estimatedFee = estimatedGross * INVESTMENT_TRANSACTION_FEE_RATE;
  const estimatedNet = side === "buy" ? estimatedGross + estimatedFee : Math.max(0, estimatedGross - estimatedFee);
  const canTrade = Boolean(account && marketStatus.isOpen && !busy && !priceLoading && selectedQuote.priceAvailable);
  const compactMarketMessage = marketStatus.isOpen ? marketStatus.message : closedMessage;
  const selectedHasDisplayPrice = selectedQuote.priceAvailable && Number.isFinite(selectedQuote.latestClose) && selectedQuote.latestClose > 0;
  const selectedPriceText = priceLoading
    ? "Checking..."
    : selectedHasDisplayPrice
      ? formatUsd(selectedQuote.latestClose)
      : "Latest close not saved";

  async function loadMarket() {
    const response = await fetch("/api/investment/market", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as MarketPayload;
    setMarket(data);
    const current = data.quotes.find((quote) => quote.symbol === symbol) ?? data.quotes[0];
    if (current) setSelectedQuote(current);
  }

  async function loadLeaderboard() {
    const response = await fetch("/api/investment/leaderboard", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as LeaderboardPayload;
    setLeaderboard(data);
  }

  async function loadAccount(accountId: string) {
    const response = await fetch(`/api/investment/accounts?accountId=${encodeURIComponent(accountId)}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      window.localStorage.removeItem(accountStorageKey);
      return;
    }
    const data = (await response.json()) as { account: InvestmentAccountView | null };
    if (data.account) {
      setAccount(data.account);
      const current = data.account.quotes.find((quote) => quote.symbol === symbol) ?? data.account.quotes[0];
      if (current) setSelectedQuote(current);
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
        body: JSON.stringify({ teamName, participantLogin })
      });
      const data = (await response.json()) as { account?: InvestmentAccountView | null; reason?: string; error?: string };
      if (!response.ok || !data.account) {
        setStatus(data.error ?? data.reason ?? "Portfolio storage is not configured yet.");
        return;
      }
      window.localStorage.setItem(accountStorageKey, data.account.account.id);
      setAccount(data.account);
      setStatus(`Portfolio ready for ${data.account.account.teamName}.`);
      void loadLeaderboard();
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
      priceMessage: hasOptimisticPrice ? "Checking Alpha Vantage for the latest close price..." : "Checking latest close price..."
    };
    setSymbol(asset.symbol);
    setAssetQuery(asset.symbol);
    setSelectedQuote(optimistic);
    setAssetResults([]);
    setAssetSearchStatus("Checking latest close price...");
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
        const reason = data.reason ?? "Daily close price unavailable.";
        setSelectedQuote({
          ...optimistic,
          latestClose: 0,
          priceAvailable: false,
          provider: "unavailable",
          priceSource: "unavailable",
          priceMessage: reason
        });
        setAssetSearchStatus(data.reason ?? "Price unavailable for this asset.");
      }
    } catch {
      const reason = "No saved market price yet. Try refreshing featured prices or selecting another asset.";
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

  async function submitTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setBusy(true);
    setStatus("Validating trade on the server...");
    try {
      const response = await fetch("/api/investment/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.account.id, symbol, side, quantity })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        account?: InvestmentAccountView | null;
        price?: number;
        fee?: number;
        reason?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.account) {
        setStatus(data.reason ?? data.error ?? "Trade was rejected.");
        return;
      }
      setAccount(data.account);
      setStatus(
        `${side === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol} at ${formatUsd(data.price ?? 0)}. Fee: ${formatUsd(data.fee ?? 0)}.`
      );
      void loadLeaderboard();
    } finally {
      setBusy(false);
    }
  }

  async function submitThesis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setBusy(true);
    setStatus("Saving investment thesis...");
    try {
      const response = await fetch("/api/investment/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.account.id, ...thesis })
      });
      const data = (await response.json()) as { account?: InvestmentAccountView | null; error?: string };
      if (!response.ok || !data.account) {
        setStatus(data.error ?? "Thesis could not be saved.");
        return;
      }
      setAccount(data.account);
      setStatus(`Investment thesis saved. Thesis score: ${data.account.thesis?.thesisScore ?? 0}/100.`);
      void loadLeaderboard();
    } finally {
      setBusy(false);
    }
  }

  const topLeaderboard = useMemo(() => leaderboard.rows.slice(0, 5), [leaderboard.rows]);
  const featuredPriceQuotes = useMemo(() => quotes.filter((quote) => quote.featured).slice(0, 25), [quotes]);
  const recentTrades = account?.trades.slice(0, 5) ?? [];
  const educationCards = market.educationalCards.filter((card) =>
    ["Stocks", "ETFs", "Diversification", "Market Hours", "Closing Price", "Risk vs Return"].includes(card.title)
  );
  const typedTickerCandidate = assetQuery.trim().toUpperCase();
  const canTryTypedTicker =
    /^[A-Z][A-Z0-9.-]{0,11}$/.test(typedTickerCandidate) &&
    !assetResults.some((asset) => asset.symbol === typedTickerCandidate) &&
    !quotes.some((asset) => asset.symbol === typedTickerCandidate);

  return (
    <div className="investment-app stack-xl">
      <section className="investment-hero-v2">
        <div className="investment-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia Investment Challenge</p>
            <h1>Build a $100,000 virtual portfolio</h1>
            <p>
              Search US stocks and ETFs, use daily closing prices, write an investment thesis, and learn how return,
              risk, diversification, and market discipline work together.
            </p>
          </div>
          <div className="cta-row">
            <a className="button primary" href="#team-portfolio">
              Start Portfolio
            </a>
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
            <div><span>Fee</span><strong>0.1%</strong></div>
            <div><span>Prices</span><strong>Daily close</strong></div>
            <div><span>ET time</span><strong>{marketStatus.etTime || "Review"}</strong></div>
          </div>
        </aside>
      </section>

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
            <MetricCard label="Holdings" value={String(holdingsCount)} />
            <MetricCard label="Diversification" value={`${portfolio?.diversificationScore ?? 0}/100`} />
            <MetricCard label="Risk score" value={`${portfolio?.riskScore ?? 0}/100`} />
          </div>
          {status ? <p className="form-status investment-status">{status}</p> : null}
        </article>
      </section>

      <section className="investment-workspace-grid">
        <form className="panel stack-md trade-ticket-v2" onSubmit={submitTrade}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Trade ticket</p>
              <h2>Submit a server-validated trade</h2>
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
            {assetResults.length ? (
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
            {canTryTypedTicker ? (
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
            {assetSearchStatus ? <p className="asset-search-status">{assetSearchStatus}</p> : null}
          </div>

          <div className="selected-asset-card">
            <div>
              <span>Selected asset</span>
              <strong>{selectedQuote.symbol}</strong>
              <p>{selectedQuote.name}</p>
            </div>
            <div>
              <span>Latest close</span>
              <strong>{selectedPriceText}</strong>
              <p>
                {selectedQuote.priceMessage ??
                  (selectedQuote.priceDate ? `Close date: ${selectedQuote.priceDate}` : selectedQuote.provider)}
              </p>
            </div>
          </div>

          <div className="featured-asset-row" aria-label="Featured assets">
            {quotes.slice(0, 25).map((quote) => (
              <button key={quote.symbol} type="button" onClick={() => selectAsset(quote)} className={quote.symbol === symbol ? "selected" : ""}>
                {quote.symbol}
              </button>
            ))}
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

          <div className="trade-estimate-grid">
            <div><span>Trade value</span><strong>{formatUsd(estimatedGross)}</strong></div>
            <div><span>Fee</span><strong>{formatUsd(estimatedFee)}</strong></div>
            <div><span>{side === "buy" ? "Total cost" : "Net proceeds"}</span><strong>{formatUsd(estimatedNet)}</strong></div>
          </div>

          {!marketStatus.isOpen ? <p className="market-closed-note">{closedMessage}</p> : null}
          {!selectedQuote.priceAvailable ? (
            <p className="market-closed-note">{selectedQuote.priceMessage ?? "Daily close price unavailable."}</p>
          ) : null}
          {!selectedQuote.priceAvailable ? (
            <button className="button secondary" type="button" onClick={() => selectAsset(selectedQuote)} disabled={priceLoading}>
              Try refresh price
            </button>
          ) : null}
          <button className="button primary" type="submit" disabled={!canTrade}>
            {priceLoading ? "Checking latest close..." : "Submit server-validated trade"}
          </button>
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
                Search for an asset, review the latest close price, and place your first simulated trade when the market is open.
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
                      <th>Latest close</th>
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

          <section className="panel stack-md featured-prices-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Featured assets</p>
                <h2>Latest close watchlist</h2>
              </div>
              <span className="pill">Cache first</span>
            </div>
            <div className="featured-price-grid">
              {featuredPriceQuotes.map((quote) => (
                <button
                  className="featured-price-card"
                  key={quote.symbol}
                  type="button"
                  onClick={() => selectAsset(quote)}
                >
                  <span>{quote.symbol}</span>
                  <strong>{quote.priceAvailable ? formatUsd(quote.latestClose) : "Not saved"}</strong>
                  <small>
                    {quote.priceDate ? `${quote.priceDate} · ${quote.priceSource === "cache" ? "cached" : "Alpha Vantage"}` : "Refresh needed"}
                  </small>
                </button>
              ))}
            </div>
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
                    <small>{trade.rejected ? trade.rejectReason ?? "Rejected" : trade.createdAt.slice(0, 16)}</small>
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
        <form className="panel stack-md investment-thesis-panel" onSubmit={submitThesis}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Investment thesis</p>
              <h2>Explain the thinking behind your portfolio</h2>
            </div>
            <span className="pill">{account?.thesis ? `${account.thesis.thesisScore}/100` : "15% of score"}</span>
          </div>
          <label className="form-field">
            <span>Why did you choose these assets?</span>
            <textarea value={thesis.thesis} onChange={(event) => setThesis({ ...thesis, thesis: event.target.value })} />
          </label>
          <label className="form-field">
            <span>Expected risks</span>
            <textarea value={thesis.risks} onChange={(event) => setThesis({ ...thesis, risks: event.target.value })} />
          </label>
          <label className="form-field">
            <span>Diversification logic</span>
            <textarea
              value={thesis.diversificationLogic}
              onChange={(event) => setThesis({ ...thesis, diversificationLogic: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>How rates, inflation, or news could affect the portfolio</span>
            <textarea value={thesis.macroView} onChange={(event) => setThesis({ ...thesis, macroView: event.target.value })} />
          </label>
          <button className="button primary" type="submit" disabled={!account || busy}>
            Save Thesis
          </button>
        </form>

        <aside className="panel stack-md investment-risk-panel">
          <p className="eyebrow">Rules and risk</p>
          <h2>Market closed means orders pause, not prices.</h2>
          <p className="muted">
            Latest closing prices remain visible whenever they are saved or available from Alpha Vantage. Buy and sell
            orders are disabled outside regular US market hours so every team competes under the same rules.
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
