import type { Metadata } from "next";
import Link from "next/link";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { getInvestmentAccess } from "@/lib/investment-access";
import { listInvestmentLeaderboard } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Investment Challenge Leaderboard",
  description:
    "Protected student leaderboard for the Phronesia Investment Challenge, ranked by return, risk, diversification, thesis, and drawdown control.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge/leaderboard"
  },
  openGraph: {
    title: "Phronesia Investment Challenge Leaderboard",
    description: "Compare virtual portfolio performance across student teams.",
    url: "https://phronesia.org/investment-challenge/leaderboard",
    siteName: "Phronesia",
    type: "website"
  },
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function InvestmentChallengeLeaderboardPage() {
  const access = await getInvestmentAccess();
  if (!access.allowed) {
    return <ProtectedLeaderboardGate title="Investment leaderboard" />;
  }

  const leaderboard = await listInvestmentLeaderboard(access.competitionCode);

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Investment Leaderboard</p>
          <h1 className="display compact">Rankings based on return, risk, thesis, and discipline.</h1>
          <p className="lede compact-lede">
            Teams are primarily ranked by portfolio value and total return. Phronesia also shows diversification, risk,
            thesis quality, and trade count so the ranking teaches more than profit chasing.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge">
              Competition Access
            </Link>
            <Link className="button primary" href="/investment-challenge/app">
              Open Student Area
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
            <p className="eyebrow">{leaderboard.competition?.name ?? "Public ranking"}</p>
            <h2>Teams by portfolio value and profit.</h2>
          </div>
          <span className="pill">{leaderboard.competition?.runtimeStatus === "closed" ? "Final ranking" : `${leaderboard.rows.length} teams`}</span>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Starting cash</th>
                <th>Total value</th>
                <th>Profit/Loss</th>
                <th>Total return</th>
                <th>Trades</th>
                <th>Diversification</th>
                <th>Risk</th>
                <th>Final score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.rows.length ? (
                leaderboard.rows.map((row) => (
                  <tr key={row.accountId}>
                    <td>#{row.rank}</td>
                    <td>{row.teamName}</td>
                    <td>{formatUsd(row.startingCash)}</td>
                    <td>{formatUsd(row.totalValue)}</td>
                    <td className={row.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(row.profitLoss)}</td>
                    <td className={row.totalReturn >= 0 ? "positive-text" : "negative-text"}>{formatPercent(row.totalReturn)}</td>
                    <td>{row.tradeCount}</td>
                    <td>{row.diversificationScore}/100</td>
                    <td>{row.riskScore}/100</td>
                    <td>{row.overallScore}/100</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10}>No teams have submitted investment portfolios yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function ProtectedLeaderboardGate({ title }: { title: string }) {
  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Protected student area</p>
          <h1 className="display compact">{title} is available after competition access.</h1>
          <p className="lede compact-lede">
            Portfolio values and rankings use market data, so they are shown only inside the password-protected student
            competition area.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge/join">
              Join Competition
            </Link>
            <Link className="button secondary" href="/investment-challenge">
              Overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
