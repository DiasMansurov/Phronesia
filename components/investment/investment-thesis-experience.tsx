"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  INVESTMENT_ACCOUNT_STORAGE_KEY,
  INVESTMENT_RECENT_BUY_TRADE_STORAGE_KEY,
  formatUsd,
  type InvestmentRecentBuyTradeContext
} from "@/lib/investment-challenge";
import type { InvestmentAccountView } from "@/lib/server-investments";

type ThesisDraft = {
  thesis: string;
  risks: string;
  diversificationLogic: string;
  macroView: string;
};

const emptyThesis: ThesisDraft = {
  thesis: "",
  risks: "",
  diversificationLogic: "",
  macroView: ""
};

export function InvestmentThesisExperience() {
  const [account, setAccount] = useState<InvestmentAccountView | null>(null);
  const [tradeContext, setTradeContext] = useState<InvestmentRecentBuyTradeContext | null>(null);
  const [thesis, setThesis] = useState<ThesisDraft>(emptyThesis);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const thesisScore = account?.thesis?.thesisScore ?? 0;

  useEffect(() => {
    const accountId = window.localStorage.getItem(INVESTMENT_ACCOUNT_STORAGE_KEY);
    setTradeContext(readRecentBuyTrade(accountId));

    if (!accountId) {
      setStatus("No investment portfolio was found on this device.");
      setLoading(false);
      return;
    }

    const storedAccountId = accountId;
    async function loadAccount() {
      try {
        const response = await fetch(`/api/investment/accounts?accountId=${encodeURIComponent(storedAccountId)}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as { account?: InvestmentAccountView | null; error?: string };
        if (!response.ok || !data.account) {
          setStatus(data.error ?? "Investment portfolio was not found.");
          return;
        }

        setAccount(data.account);
        if (data.account.thesis) {
          setThesis({
            thesis: data.account.thesis.thesis,
            risks: data.account.thesis.risks,
            diversificationLogic: data.account.thesis.diversificationLogic,
            macroView: data.account.thesis.macroView
          });
        }
      } catch {
        setStatus("Investment thesis is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    void loadAccount();
  }, []);

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
    <div className="investment-app investment-thesis-page stack-xl">
      <section className="investment-thesis-hero panel stack-sm">
        <div className="section-header">
          <div>
            <p className="eyebrow">Investment Challenge</p>
            <h1>Investment Thesis</h1>
          </div>
          <span className="thesis-score-badge">{account?.thesis ? `${thesisScore}/100 thesis` : "15% of score"}</span>
        </div>
        <p>Explain the thinking behind your portfolio decision.</p>
      </section>

      {!loading && !account ? (
        <section className="panel stack-md thesis-empty-context-panel">
          <p className="eyebrow">No active portfolio</p>
          <h2>Return to the Investment Challenge to create or load your portfolio.</h2>
          <p className="muted">
            This page saves the thesis to the portfolio stored on this device. No recent trade context is available yet.
          </p>
          <Link className="button primary" href="/investment-challenge/app">
            Back to Investment Challenge
          </Link>
        </section>
      ) : (
        <section className="investment-thesis-flow stack-md">
          <article className="panel stack-md thesis-trade-summary-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Trade summary</p>
                <h2>{tradeContext ? "Asset just bought" : "No recent buy trade found"}</h2>
              </div>
              <Link className="button secondary" href="/investment-challenge/app#team-portfolio">
                Return to portfolio
              </Link>
            </div>

            {tradeContext ? (
              <dl className="thesis-trade-context-grid">
                <div><dt>Ticker</dt><dd>{tradeContext.symbol}</dd></div>
                <div><dt>Company</dt><dd>{tradeContext.companyName}</dd></div>
                <div><dt>Quantity</dt><dd>{tradeContext.quantity}</dd></div>
                <div><dt>Trade value</dt><dd>{formatUsd(tradeContext.tradeValue)}</dd></div>
                <div><dt>Commission</dt><dd>{formatUsd(tradeContext.commission)}</dd></div>
                <div><dt>Total cost</dt><dd>{formatUsd(tradeContext.totalCost)}</dd></div>
                <div><dt>Date/time</dt><dd>{formatTradeDateTime(tradeContext.executedAt)}</dd></div>
              </dl>
            ) : (
              <div className="thesis-empty-context-note">
                <p>No recent buy trade context exists in this browser session.</p>
                <Link className="button secondary" href="/investment-challenge/app">
                  Back to Investment Challenge
                </Link>
              </div>
            )}

          </article>

          <section className="investment-thesis-work-grid">
            <form className="panel stack-md investment-thesis-panel thesis-step-form" onSubmit={submitThesis}>
              <div className="section-header thesis-form-header">
                <div>
                  <p className="eyebrow">Investment thesis</p>
                  <h2>Document the reasoning behind the buy</h2>
                </div>
                <span className="thesis-score-badge compact">
                  {account?.thesis ? `${thesisScore}/100 saved` : "Scored thesis"}
                </span>
              </div>

              <label className="form-field thesis-question-field">
                <span>Why did you choose these assets?</span>
                <small>Connect the buy to the business, valuation, trend, or portfolio role you are trying to capture.</small>
                <textarea
                  rows={5}
                  value={thesis.thesis}
                  onChange={(event) => setThesis({ ...thesis, thesis: event.target.value })}
                />
              </label>
              <label className="form-field thesis-question-field">
                <span>Expected risks</span>
                <small>Name what could make the trade lose money, including company, sector, valuation, or timing risks.</small>
                <textarea rows={5} value={thesis.risks} onChange={(event) => setThesis({ ...thesis, risks: event.target.value })} />
              </label>
              <label className="form-field thesis-question-field">
                <span>Diversification logic</span>
                <small>Explain how this position fits with the rest of the portfolio and whether it adds concentration.</small>
                <textarea
                  rows={5}
                  value={thesis.diversificationLogic}
                  onChange={(event) => setThesis({ ...thesis, diversificationLogic: event.target.value })}
                />
              </label>
              <label className="form-field thesis-question-field">
                <span>How rates, inflation, or news could affect the portfolio</span>
                <small>Describe the macro or news events that could help or hurt the position after the trade.</small>
                <textarea
                  rows={5}
                  value={thesis.macroView}
                  onChange={(event) => setThesis({ ...thesis, macroView: event.target.value })}
                />
              </label>

              <div className="thesis-action-bar">
                <div>
                  <strong>Ready to submit your reasoning?</strong>
                  <p className="muted">Saving updates the same thesis record used for challenge scoring.</p>
                </div>
                <div className="cta-row">
                  <button className="button primary thesis-save-button" type="submit" disabled={!account || busy || loading}>
                    {busy ? "Saving..." : "Save Thesis"}
                  </button>
                  <Link className="button secondary" href="/investment-challenge/app#team-portfolio">
                    Return to portfolio
                  </Link>
                </div>
              </div>
              {status ? <p className="form-status investment-status">{status}</p> : null}
            </form>

            <aside className="panel stack-md investment-risk-panel thesis-score-panel">
              <p className="eyebrow">Scoring context</p>
              <h2>Reasoning counts toward the challenge score.</h2>
              <div className="thesis-score-meter" aria-label="Thesis scoring weight">
                <span>Thesis weight</span>
                <strong>15%</strong>
              </div>
              <p className="muted">
                A strong thesis explains why the asset belongs in the portfolio, what could go wrong, how the portfolio is
                diversified, and which macro factors could matter.
              </p>
              <div className="score-formula-note">
                40% return · 20% risk-adjusted · 15% diversification · 15% thesis · 10% drawdown control
              </div>
            </aside>
          </section>
        </section>
      )}
    </div>
  );
}

function readRecentBuyTrade(accountId: string | null) {
  const raw = window.sessionStorage.getItem(INVESTMENT_RECENT_BUY_TRADE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<InvestmentRecentBuyTradeContext>;
    if (!accountId || parsed.accountId !== accountId) return null;
    if (!parsed.symbol || !parsed.companyName || typeof parsed.quantity !== "number") return null;
    return {
      accountId,
      symbol: parsed.symbol,
      companyName: parsed.companyName,
      quantity: parsed.quantity,
      tradeValue: Number(parsed.tradeValue) || 0,
      commission: Number(parsed.commission) || 0,
      totalCost: Number(parsed.totalCost) || 0,
      executedAt: parsed.executedAt ?? null
    };
  } catch {
    return null;
  }
}

function formatTradeDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
