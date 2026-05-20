import type { Metadata } from "next";
import Link from "next/link";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { getInvestmentAccess } from "@/lib/investment-access";
import { listInvestmentFinalResults } from "@/lib/server-investments";

type PageProps = {
  params: Promise<{ competitionCode: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitionCode } = await params;
  return {
    title: `${decodeURIComponent(competitionCode)} Investment Results`,
    description: "Final virtual portfolio competition results with rankings, portfolio values, returns, and trade counts.",
    alternates: {
      canonical: `https://phronesia.org/investment-challenge/results/${competitionCode}`
    },
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function InvestmentCompetitionResultsPage({ params }: PageProps) {
  const { competitionCode } = await params;
  const access = await getInvestmentAccess();
  if (!access.allowed) {
    return (
      <section className="shell section stack-xl">
        <div className="hero-band compact">
          <div className="stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1 className="display compact">Competition results are protected.</h1>
            <p className="lede compact-lede">
              Final rankings use portfolio values and market data, so they are shown only after team access is verified.
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

  const decodedCode = decodeURIComponent(competitionCode);
  if (decodedCode !== access.competitionCode && decodedCode !== access.competition.slug) {
    return (
      <section className="shell section stack-xl">
        <div className="hero-band compact">
          <div className="stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1 className="display compact">These results belong to another competition.</h1>
            <p className="lede compact-lede">Use the team access flow for that competition before viewing final results.</p>
            <Link className="button primary" href="/investment-challenge/join">
              Join Competition
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const results = await listInvestmentFinalResults(access.competitionCode);
  const winner = results.rows[0];

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Final competition results</p>
          <h1 className="display compact">{results.competition?.name ?? "Investment Challenge Results"}</h1>
          <p className="lede compact-lede">
            {results.competition?.runtimeStatus === "closed"
              ? "The competition has ended. Rankings are now final."
              : "This competition is still active. Results update from the current leaderboard until the organizer closes it."}
          </p>
          <div className="cta-row">
            <Link className="button primary" href={`/investment-challenge/leaderboard/${competitionCode}`}>
              Open Leaderboard
            </Link>
            <Link className="button secondary" href="/investment-challenge">
              Competition Access
            </Link>
            <Link className="button secondary" href="/investment-challenge/app">
              Student Area
            </Link>
          </div>
        </div>
      </div>

      {winner ? (
        <section className="grid three">
          <div className="stat-card"><span>Winner</span><strong>{winner.teamName}</strong></div>
          <div className="stat-card"><span>Final value</span><strong>{formatUsd(winner.totalValue)}</strong></div>
          <div className="stat-card"><span>Profit</span><strong className={winner.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(winner.profitLoss)}</strong></div>
        </section>
      ) : null}

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Final ranking</p>
            <h2>Portfolio values, returns, trades, and thesis status.</h2>
          </div>
          <span className="pill">{results.rows.length} teams</span>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Starting cash</th>
                <th>Final value</th>
                <th>Profit/Loss</th>
                <th>Return</th>
                <th>Trades</th>
                <th>Diversification</th>
                <th>Thesis</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.length ? (
                results.rows.map((row) => (
                  <tr key={row.accountId}>
                    <td>#{row.rank}</td>
                    <td>{row.teamName}</td>
                    <td>{formatUsd(row.startingCash)}</td>
                    <td>{formatUsd(row.totalValue)}</td>
                    <td className={row.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(row.profitLoss)}</td>
                    <td className={row.totalReturn >= 0 ? "positive-text" : "negative-text"}>{formatPercent(row.totalReturn)}</td>
                    <td>{row.tradeCount}</td>
                    <td>{row.diversificationScore}/100</td>
                    <td>{row.thesisScore > 0 ? `${row.thesisScore}/100` : "Not submitted"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>No final results are available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
