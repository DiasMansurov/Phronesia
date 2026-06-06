import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults, type InvestmentAdminResultsBundle, type InvestmentAdminTeamResult } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Competition Results Admin",
  description: "Private admin results dashboard for the Teenvestor.school Investment Competition.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
  }>;
};

export default async function InvestmentAdminResultsPage({ searchParams }: ResultsPageProps) {
  const organizer = await requireInvestmentAdmin();
  if (!organizer.ok && organizer.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/investment-challenge/admin/results");
  }
  if (organizer.errorResponse) {
    return <AdminBlocked />;
  }

  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();
  const sort = params.sort ?? "rank";
  const { bundle, errorMessage } = await loadAdminResultsSafely();
  const teams = sortTeams(
    bundle.teams.filter((team) => !query || team.teamName.toLowerCase().includes(query)),
    sort
  );
  const debug = {
    currentRoute: "/investment-challenge/admin/results",
    adminEmail: organizer.userEmail ?? "n/a",
    isInvestmentAdmin: organizer.ok,
    envEmailsLoaded: Boolean(process.env.INVESTMENT_ADMIN_EMAILS?.trim()),
    apiStatus: errorMessage ? "server-helper-error" : "server-helper-ok",
    competitionFound: Boolean(bundle.competition),
    competitionId: bundle.competition?.id ?? "n/a",
    teamsLoadedCount: bundle.teams.length,
    errorMessage
  };

  return (
    <section className="shell section stack-xl investment-admin-results-page">
      <div className="investment-admin-hero">
        <div className="investment-admin-hero-copy">
          <p className="eyebrow">Competition Results Admin</p>
          <h1>Teenvestor.school Investment Competition</h1>
          <p>
            Private admin dashboard for monitoring teams, balances, rankings, and transaction activity.
          </p>
          <div className="investment-admin-actions">
            <Link className="button secondary" href="/investment-challenge/admin">
              Admin Home
            </Link>
            <Link className="button primary" href="/api/investment/admin/export?type=leaderboard&competitionCode=Teenvestor.school">
              Export leaderboard CSV
            </Link>
            <Link className="button secondary" href="/api/investment/admin/export?type=trades&competitionCode=Teenvestor.school">
              Export trades CSV
            </Link>
          </div>
        </div>
      </div>

      {!bundle.persisted ? (
        <section className="panel stack-sm">
          <p className="eyebrow">Database</p>
          <h2>Supabase is not configured.</h2>
          <p className="muted">Investment results need Supabase service-role access.</p>
        </section>
      ) : null}

      {errorMessage || !bundle.competition ? (
        <section className="panel stack-sm investment-admin-error-state">
          <p className="eyebrow">Error state</p>
          <h2>{bundle.competition ? "Failed to load admin results." : "Teenvestor.school competition was not found in Supabase."}</h2>
          <p className="muted">
            {errorMessage ? `Failed to load admin results: ${errorMessage}` : "Teenvestor.school competition was not found in Supabase."}
          </p>
        </section>
      ) : null}

      <section className="grid six investment-admin-summary">
        <Metric label="Total teams" value={bundle.stats.totalTeams.toString()} />
        <Metric label="Total trades" value={bundle.stats.totalTrades.toString()} />
        <Metric label="Average return" value={formatPercent(bundle.stats.averageReturn)} tone={bundle.stats.averageReturn >= 0 ? "positive" : "negative"} />
        <Metric label="Best team" value={bundle.stats.bestTeam} />
        <Metric label="Total simulated value" value={formatUsd(bundle.stats.totalSimulatedPortfolioValue)} />
        <Metric label="Competition status" value={bundle.stats.competitionStatus} />
      </section>

      <section className="panel stack-md investment-admin-results-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Results</p>
            <h2>Private view of Teenvestor.school teams</h2>
            <p className="muted small">Search teams, scan balances, and open details for holdings and full transaction history.</p>
          </div>
          <form className="investment-results-filter" action="/investment-challenge/admin/results">
            <label className="form-field compact-field">
              <span>Search team</span>
              <input name="q" defaultValue={params.q ?? ""} placeholder="Team Alpha" />
            </label>
            <label className="form-field compact-field">
              <span>Sort</span>
              <select name="sort" defaultValue={sort}>
                <option value="rank">Portfolio value</option>
                <option value="return">Return %</option>
                <option value="trades">Trades count</option>
                <option value="activity">Last activity</option>
              </select>
            </label>
            <button className="button secondary" type="submit">
              Apply
            </button>
          </form>
        </div>

        <div className="table-wrap">
          <table className="record-table investment-table investment-admin-results-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Cash balance</th>
                <th>Holdings / positions</th>
                <th>Locked margin</th>
                <th>Unrealized P/L</th>
                <th>Total portfolio</th>
                <th>P/L</th>
                <th>Return</th>
                <th>Trades</th>
                <th>Holdings</th>
                <th>Open positions</th>
                <th>Last activity</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.teamId}>
                  <td>#{team.rank}</td>
                  <td>
                    <Link className="admin-team-link" href={`/investment-challenge/admin/results/${team.teamId}`}>
                      {team.teamName}
                    </Link>
                  </td>
                  <td>{formatUsd(team.cashBalance)}</td>
                  <td>{formatUsd(team.holdingsValue)}</td>
                  <td>{formatUsd(team.lockedMargin)}</td>
                  <td className={team.unrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(team.unrealizedPnl)}</td>
                  <td>{formatUsd(team.totalPortfolioValue)}</td>
                  <td className={team.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(team.profitLoss)}</td>
                  <td className={team.returnPercent >= 0 ? "positive-text" : "negative-text"}>{formatPercent(team.returnPercent)}</td>
                  <td>{team.tradesCount}</td>
                  <td>{team.holdingsCount}</td>
                  <td>{team.openPositionsCount}</td>
                  <td>{formatDateTime(team.lastActivity)}</td>
                  <td><span className="pill">{team.status}</span></td>
                  <td>
                    <Link className="button secondary investment-admin-row-action" href={`/investment-challenge/admin/results/${team.teamId}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!teams.length ? (
          <div className="investment-empty-state">
            <strong>No teams have joined this competition yet.</strong>
            <p className="muted small">Teams will appear here after they join the Teenvestor.school competition.</p>
          </div>
        ) : null}
      </section>

      <AdminDebugPanel debug={debug} />
    </section>
  );
}

async function loadAdminResultsSafely(): Promise<{ bundle: InvestmentAdminResultsBundle; errorMessage: string | null }> {
  try {
    return { bundle: await listInvestmentAdminResults("Teenvestor.school"), errorMessage: null };
  } catch (error) {
    return { bundle: emptyAdminResultsBundle(), errorMessage: errorMessageFromUnknown(error) };
  }
}

function emptyAdminResultsBundle(): InvestmentAdminResultsBundle {
  return {
    persisted: true,
    competition: null,
    teams: [],
    stats: {
      totalTeams: 0,
      totalTrades: 0,
      averageReturn: 0,
      bestTeam: "n/a",
      totalSimulatedPortfolioValue: 0,
      competitionStatus: "error"
    }
  };
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <article className="stat-card investment-admin-result-stat">
      <span>{label}</span>
      <strong className={tone === "positive" ? "positive-text" : tone === "negative" ? "negative-text" : undefined}>{value}</strong>
    </article>
  );
}

function sortTeams(teams: InvestmentAdminTeamResult[], sort: string) {
  const sorted = [...teams];
  if (sort === "return") return sorted.sort((a, b) => b.returnPercent - a.returnPercent || a.rank - b.rank);
  if (sort === "trades") return sorted.sort((a, b) => b.tradesCount - a.tradesCount || a.rank - b.rank);
  if (sort === "activity") {
    return sorted.sort((a, b) => Date.parse(b.lastActivity ?? "") - Date.parse(a.lastActivity ?? "") || a.rank - b.rank);
  }
  return sorted.sort((a, b) => a.rank - b.rank);
}

function formatDateTime(value: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function errorMessageFromUnknown(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
}

function AdminDebugPanel({
  debug
}: {
  debug: {
    currentRoute: string;
    adminEmail: string;
    isInvestmentAdmin: boolean;
    envEmailsLoaded: boolean;
    apiStatus: string;
    competitionFound: boolean;
    competitionId: string;
    teamsLoadedCount: number;
    errorMessage: string | null;
  };
}) {
  return (
    <section className="panel stack-sm investment-admin-debug-panel">
      <p className="eyebrow">Admin debug</p>
      <h2>Production diagnostics</h2>
      <dl className="investment-admin-debug-grid">
        <div><dt>Current route</dt><dd>{debug.currentRoute}</dd></div>
        <div><dt>Admin email</dt><dd>{debug.adminEmail}</dd></div>
        <div><dt>isInvestmentAdmin</dt><dd>{String(debug.isInvestmentAdmin)}</dd></div>
        <div><dt>Env emails loaded</dt><dd>{String(debug.envEmailsLoaded)}</dd></div>
        <div><dt>API status</dt><dd>{debug.apiStatus}</dd></div>
        <div><dt>Competition found</dt><dd>{String(debug.competitionFound)}</dd></div>
        <div><dt>Competition id</dt><dd>{debug.competitionId}</dd></div>
        <div><dt>Teams loaded count</dt><dd>{debug.teamsLoadedCount}</dd></div>
        <div className="full-span"><dt>Error message</dt><dd>{debug.errorMessage ?? "none"}</dd></div>
      </dl>
    </section>
  );
}

function AdminBlocked() {
  return (
    <section className="shell section auth-page">
      <div className="panel stack-md">
        <p className="eyebrow">Investment Results</p>
        <h1>Admin access required.</h1>
        <p className="muted">Only emails listed in INVESTMENT_ADMIN_EMAILS can view all team balances, rankings, and transactions.</p>
        <Link className="button primary" href="/investment-challenge">
          Back to Investment Challenge
        </Link>
      </div>
    </section>
  );
}
