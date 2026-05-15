"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  INVESTMENT_ASSETS,
  INVESTMENT_EDUCATIONAL_CARDS,
  INVESTMENT_STARTING_CASH,
  formatPercent,
  formatUsd,
  type InvestmentAssetQuote,
  type InvestmentEducationalCard,
  type InvestmentMarketStatus,
  type TradeSide
} from "@/lib/investment-challenge";
import type { InvestmentAccountView } from "@/lib/server-investments";

type MarketPayload = {
  marketStatus: InvestmentMarketStatus;
  quotes: InvestmentAssetQuote[];
  educationalCards: InvestmentEducationalCard[];
};

const accountStorageKey = "phronesia.investmentChallenge.accountId";

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
    message:
      "US market is currently closed. Trading will reopen at 9:30 AM ET. You can review your portfolio and thesis, but buy/sell orders are disabled."
  };
}

export function InvestmentChallengeDashboard() {
  const [market, setMarket] = useState<MarketPayload>({
    marketStatus: defaultMarketStatus(),
    quotes: INVESTMENT_ASSETS.map((asset) => ({
      ...asset,
      latestClose: asset.referencePrice,
      priceDate: null,
      provider: "educational_reference"
    })),
    educationalCards: INVESTMENT_EDUCATIONAL_CARDS
  });
  const [account, setAccount] = useState<InvestmentAccountView | null>(null);
  const [teamName, setTeamName] = useState("");
  const [participantLogin, setParticipantLogin] = useState("");
  const [symbol, setSymbol] = useState("SPY");
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

  const quotes = account?.quotes ?? market.quotes;
  const selectedQuote = useMemo(() => quotes.find((quote) => quote.symbol === symbol) ?? quotes[0], [quotes, symbol]);
  const marketStatus = account?.marketStatus ?? market.marketStatus;
  const portfolio = account?.portfolio;
  const canTrade = Boolean(account && marketStatus.isOpen && !busy);

  async function loadMarket() {
    const response = await fetch("/api/investment/market", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as MarketPayload;
    setMarket(data);
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
    if (data.account) setAccount(data.account);
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
    } finally {
      setBusy(false);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="investment-app stack-xl">
      <section className="investment-hero">
        <div className="stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia Investment Challenge</p>
            <h1 className="display investment-display">Build a $100,000 virtual portfolio.</h1>
            <p className="lede compact-lede">
              Use real daily closing prices to learn stocks, ETFs, risk, diversification, thesis writing, and market
              discipline. No real money is used. This is not financial advice.
            </p>
          </div>
          <div className="cta-row">
            <a className="button primary" href="#team-portfolio">
              Start Portfolio
            </a>
            <Link className="button secondary" href="/investment-challenge/leaderboard">
              View Leaderboard
            </Link>
            <Link className="text-link" href="/investment-challenge/rules">
              Read Rules
            </Link>
          </div>
        </div>
        <aside className="investment-market-card">
          <div className="terminal-topline">
            <span>US market</span>
            <strong className={marketStatus.isOpen ? "positive-text" : "negative-text"}>
              {marketStatus.isOpen ? "Open" : "Closed"}
            </strong>
          </div>
          <p>{marketStatus.message}</p>
          <div className="terminal-grid">
            <div>
              <span>Starting cash</span>
              <strong>{formatUsd(INVESTMENT_STARTING_CASH)}</strong>
            </div>
            <div>
              <span>Fee</span>
              <strong>0.1%</strong>
            </div>
            <div>
              <span>Data</span>
              <strong>Daily close</strong>
            </div>
            <div>
              <span>ET time</span>
              <strong>{marketStatus.etTime || "Review"}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="investment-grid" id="team-portfolio">
        <div className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Team setup</p>
              <h2>{account ? account.account.teamName : "Create your portfolio account."}</h2>
            </div>
            <span className="pill">Virtual cash only</span>
          </div>
          {!account ? (
            <form className="stack-sm" onSubmit={createAccount}>
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
          ) : (
            <div className="investment-kpi-grid">
              <div className="stat-card">
                <span>Starting balance</span>
                <strong>{formatUsd(portfolio?.startingCash ?? INVESTMENT_STARTING_CASH)}</strong>
              </div>
              <div className="stat-card">
                <span>Current cash</span>
                <strong>{formatUsd(portfolio?.cash ?? 0)}</strong>
              </div>
              <div className="stat-card">
                <span>Total value</span>
                <strong>{formatUsd(portfolio?.totalValue ?? 0)}</strong>
              </div>
              <div className="stat-card">
                <span>Total return</span>
                <strong className={(portfolio?.totalReturn ?? 0) >= 0 ? "positive-text" : "negative-text"}>
                  {formatPercent(portfolio?.totalReturn ?? 0)}
                </strong>
              </div>
              <div className="stat-card">
                <span>Daily change</span>
                <strong className={(portfolio?.dailyChange ?? 0) >= 0 ? "positive-text" : "negative-text"}>
                  {formatPercent(portfolio?.dailyChange ?? 0)}
                </strong>
              </div>
              <div className="stat-card">
                <span>Diversification</span>
                <strong>{portfolio?.diversificationScore ?? 0}/100</strong>
              </div>
            </div>
          )}
          {status ? <p className="form-status">{status}</p> : null}
        </div>

        <form className="panel stack-md trade-ticket" onSubmit={submitTrade}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Trade ticket</p>
              <h2>Buy or sell shares.</h2>
            </div>
          </div>
          <div className="grid two">
            <label className="form-field">
              <span>Asset</span>
              <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
                {quotes.map((quote) => (
                  <option key={quote.symbol} value={quote.symbol}>
                    {quote.symbol} - {quote.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Side</span>
              <select value={side} onChange={(event) => setSide(event.target.value as TradeSide)}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>
          </div>
          <div className="trade-price-box">
            <span>Latest close price</span>
            <strong>{formatUsd(selectedQuote?.latestClose ?? 0)}</strong>
            <small>{selectedQuote?.priceDate ? `Close date: ${selectedQuote.priceDate}` : "Reference price until market data is loaded"}</small>
          </div>
          <label className="form-field">
            <span>Shares</span>
            <input
              min={1}
              step={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              required
            />
          </label>
          {!marketStatus.isOpen ? <p className="market-closed-note">{marketStatus.message}</p> : null}
          <button className="button primary" type="submit" disabled={!canTrade}>
            Submit Server-Validated Trade
          </button>
        </form>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Holdings</p>
            <h2>Portfolio dashboard.</h2>
          </div>
          <span className="pill">No short selling · No margin</span>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Average buy</th>
                <th>Latest close</th>
                <th>Market value</th>
                <th>Unrealized gain/loss</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {account?.holdings.length ? (
                account.holdings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td>{holding.symbol}</td>
                    <td>{holding.quantity}</td>
                    <td>{formatUsd(holding.averageBuyPrice)}</td>
                    <td>{formatUsd(holding.latestClose)}</td>
                    <td>{formatUsd(holding.marketValue)}</td>
                    <td className={holding.unrealizedGainLoss >= 0 ? "positive-text" : "negative-text"}>
                      {formatUsd(holding.unrealizedGainLoss)}
                    </td>
                    <td>{holding.weight.toFixed(1)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>Create a team account and make your first trade to see holdings here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="investment-grid">
        <form className="panel stack-md" onSubmit={submitThesis}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Investment thesis</p>
              <h2>Explain your strategy.</h2>
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

        <div className="panel stack-md">
          <div>
            <p className="eyebrow">Allowed assets</p>
            <h2>Stocks and ETFs.</h2>
          </div>
          <div className="asset-quote-list">
            {quotes.map((quote) => (
              <article className="asset-quote-card" key={quote.symbol}>
                <div>
                  <strong>{quote.symbol}</strong>
                  <span>{quote.type} · {quote.theme}</span>
                </div>
                <b>{formatUsd(quote.latestClose)}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Educational cards</p>
            <h2>Learn the concepts while managing the portfolio.</h2>
          </div>
        </div>
        <div className="investment-education-grid">
          {market.educationalCards.map((card) => (
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
