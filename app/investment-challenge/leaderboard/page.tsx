import type { Metadata } from "next";
import Link from "next/link";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { listInvestmentLeaderboard } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Investment Challenge Leaderboard",
  description:
    "Public leaderboard for the Phronesia Investment Challenge, ranked by return, risk-adjusted performance, diversification, thesis, and drawdown control.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge/leaderboard"
  },
  openGraph: {
    title: "Phronesia Investment Challenge Leaderboard",
    description: "Compare virtual portfolio performance across student teams.",
    url: "https://phronesia.org/investment-challenge/leaderboard",
    siteName: "Phronesia",
    type: "website"
  }
};

export const dynamic = "force-dynamic";

export default async function InvestmentChallengeLeaderboardPage() {
  const leaderboard = await listInvestmentLeaderboard();

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Investment Leaderboard</p>
          <h1 className="display compact">Rankings based on return, risk, thesis, and discipline.</h1>
          <p className="lede compact-lede">
            Phronesia ranks teams by more than profit: the score also rewards diversification, risk control, thesis quality,
            and drawdown management.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge">
              Open Challenge
            </Link>
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Rules
            </Link>
          </div>
        </div>
      </div>

      {!leaderboard.persisted ? (
        <div className="panel stack-sm">
          <p className="eyebrow">Leaderboard storage</p>
          <h2>Supabase is not configured yet.</h2>
          <p className="muted">Once the investment migration and environment variables are active, rankings will appear here.</p>
        </div>
      ) : null}

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Public ranking</p>
            <h2>Teams by overall investment score.</h2>
          </div>
          <span className="pill">{leaderboard.rows.length} teams</span>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Total value</th>
                <th>Total return</th>
                <th>Overall</th>
                <th>Risk-adjusted</th>
                <th>Diversification</th>
                <th>Thesis</th>
                <th>Drawdown</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.rows.length ? (
                leaderboard.rows.map((row) => (
                  <tr key={row.accountId}>
                    <td>#{row.rank}</td>
                    <td>{row.teamName}</td>
                    <td>{formatUsd(row.totalValue)}</td>
                    <td className={row.totalReturn >= 0 ? "positive-text" : "negative-text"}>{formatPercent(row.totalReturn)}</td>
                    <td>{row.overallScore}/100</td>
                    <td>{row.riskAdjustedScore}/100</td>
                    <td>{row.diversificationScore}/100</td>
                    <td>{row.thesisScore}/100</td>
                    <td>{row.drawdownScore}/100</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>No teams have submitted investment portfolios yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
