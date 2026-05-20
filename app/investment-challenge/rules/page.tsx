import type { Metadata } from "next";
import Link from "next/link";

import { INVESTMENT_ASSETS, INVESTMENT_TRANSACTION_FEE_RATE } from "@/lib/investment-challenge";

export const metadata: Metadata = {
  title: "Investment Challenge Rules",
  description:
    "Rules for the Phronesia Investment Challenge: virtual cash, allowed assets, market hours, diversification, scoring, and thesis requirements.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge/rules"
  },
  openGraph: {
    title: "Phronesia Investment Challenge Rules",
    description: "Learn the rules for the $100,000 virtual portfolio simulation.",
    url: "https://phronesia.org/investment-challenge/rules",
    siteName: "Phronesia",
    type: "article"
  }
};

const scoring = [
  ["40%", "Total return", "How much the portfolio grows or falls from the $100,000 starting balance."],
  ["20%", "Risk-adjusted performance", "Rewards return while penalizing unstable or highly risky results."],
  ["15%", "Diversification", "Full score requires no asset above 20% of total portfolio value."],
  ["15%", "Investment thesis", "Teams explain asset choices, risks, diversification logic, and macro factors."],
  ["10%", "Drawdown control", "Rewards teams that avoid large peak-to-trough portfolio losses."]
];

export default function InvestmentChallengeRulesPage() {
  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact investment-rules-hero">
        <div className="stack-sm">
          <p className="eyebrow">Investment Challenge Rules</p>
          <h1 className="display compact">Learn investing without real-money risk.</h1>
          <p className="lede compact-lede">
            Every team starts with $100,000 in virtual cash. Simulated orders are server validated, use cached stock
            prices only inside the protected student area, and are enabled only during regular US market hours.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge/join">
              Join Competition
            </Link>
            <Link className="button secondary" href="/investment-challenge/app">
              Student Area
            </Link>
            <Link className="button secondary" href="/investment-challenge/options">
              Learn Options
            </Link>
          </div>
        </div>
        <div className="panel compact-panel stack-sm">
          <p className="eyebrow">Core rule</p>
          <p>
            Phronesia is free. This is an educational simulation only. No real money is used, this is not financial
            advice, no brokerage execution happens, and market data is used only inside the student competition area.
          </p>
        </div>
      </div>

      <section className="grid two">
        <article className="panel stack-md">
          <p className="eyebrow">Trading rules</p>
          <h2>What teams can and cannot do.</h2>
          <div className="goal-list compact-list">
            <div className="goal-item">Starting balance: $100,000 virtual cash.</div>
            <div className="goal-item">No short selling and no margin borrowing.</div>
            <div className="goal-item">Teams cannot buy more than available cash.</div>
            <div className="goal-item">Teams cannot sell more shares than they own.</div>
            <div className="goal-item">Options mode is educational, buy-only, virtual-only, and capped at 10% portfolio exposure.</div>
            <div className="goal-item">Transaction fee: {(INVESTMENT_TRANSACTION_FEE_RATE * 100).toFixed(1)}% per trade.</div>
            <div className="goal-item">Buy/sell is enabled Monday-Friday, 9:30 AM-4:00 PM America/New_York.</div>
          </div>
        </article>

        <article className="panel stack-md">
          <p className="eyebrow">Allowed universe</p>
          <h2>US stocks and ETFs.</h2>
          <p className="muted">
            Featured tickers are shortcuts. Inside the protected student area, teams can search additional valid
            US-listed stocks and ETFs supported by the market data provider.
          </p>
          <div className="asset-symbol-cloud">
            {INVESTMENT_ASSETS.map((asset) => (
              <span className="pill" key={asset.symbol}>
                {asset.symbol} · {asset.type}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Scoring model</p>
            <h2>Ranking is not only about profit.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                <th>Weight</th>
                <th>Category</th>
                <th>What it measures</th>
              </tr>
            </thead>
            <tbody>
              {scoring.map(([weight, category, body]) => (
                <tr key={category}>
                  <td>{weight}</td>
                  <td>{category}</td>
                  <td>{body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-md">
        <p className="eyebrow">Investment thesis</p>
        <h2>Every team must explain the portfolio.</h2>
        <p className="muted">
          A strong thesis explains why the team chose the assets, what could go wrong, how the portfolio is diversified,
          and how interest rates, inflation, earnings, or news could affect returns.
        </p>
      </section>
    </section>
  );
}
