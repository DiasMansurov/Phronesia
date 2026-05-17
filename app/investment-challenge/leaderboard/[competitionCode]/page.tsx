import type { Metadata } from "next";
import Link from "next/link";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { listInvestmentLeaderboard } from "@/lib/server-investments";

type PageProps = {
  params: Promise<{ competitionCode: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitionCode } = await params;
  const decoded = decodeURIComponent(competitionCode);
  return {
    title: `${decoded} Investment Leaderboard`,
    description: "Competition-specific virtual portfolio leaderboard for Phronesia Investment Challenge.",
    alternates: {
      canonical: `https://phronesia.org/investment-challenge/leaderboard/${competitionCode}`
    }
  };
}

export default async function InvestmentCompetitionLeaderboardPage({ params }: PageProps) {
  const { competitionCode } = await params;
  const leaderboard = await listInvestmentLeaderboard(decodeURIComponent(competitionCode));

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Competition leaderboard</p>
          <h1 className="display compact">{leaderboard.competition?.name ?? "Investment competition ranking"}</h1>
          <p className="lede compact-lede">
            {leaderboard.competition?.runtimeStatus === "closed"
              ? "The competition has ended. Rankings are now final."
              : "Live ranking by portfolio value, profit/loss, total return, trades, diversification, and risk score."}
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge">
              Open Challenge
            </Link>
            <Link className="button secondary" href={`/investment-challenge/results/${competitionCode}`}>
              Final Results
            </Link>
          </div>
        </div>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">{leaderboard.competition?.code ?? competitionCode}</p>
            <h2>{leaderboard.competition?.runtimeStatus === "closed" ? "Final ranking" : "Live ranking"}</h2>
          </div>
          <span className="pill">{leaderboard.rows.length} teams</span>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Final/Current value</th>
                <th>Profit/Loss</th>
                <th>Return</th>
                <th>Trades</th>
                <th>Diversification</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.rows.length ? (
                leaderboard.rows.map((row) => (
                  <tr key={row.accountId}>
                    <td>#{row.rank}</td>
                    <td>{row.teamName}</td>
                    <td>{formatUsd(row.totalValue)}</td>
                    <td className={row.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(row.profitLoss)}</td>
                    <td className={row.totalReturn >= 0 ? "positive-text" : "negative-text"}>{formatPercent(row.totalReturn)}</td>
                    <td>{row.tradeCount}</td>
                    <td>{row.diversificationScore}/100</td>
                    <td>{row.riskScore}/100</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>No teams are ranked in this competition yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
