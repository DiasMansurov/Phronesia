import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatUsd } from "@/lib/investment-challenge";
import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { listInvestmentAdminBundle } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Investment Challenge Admin",
  description: "Organizer admin view for Phronesia Investment Challenge accounts, holdings, trades, theses, and leaderboard.",
  alternates: {
    canonical: "/investment-challenge/admin"
  }
};

function value(row: Record<string, unknown>, key: string) {
  return String(row[key] ?? "");
}

function numberValue(row: Record<string, unknown>, key: string) {
  const parsed = Number(row[key] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function InvestmentChallengeAdminPage() {
  const organizer = await requireResultsOrganizer();
  if (!organizer.ok && organizer.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/investment-challenge/admin");
  }

  if (organizer.errorResponse) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Investment Admin</p>
          <h1>Organizer access only</h1>
          <p className="muted">Sign in with the organizer account to view investment challenge results.</p>
          <Link className="button primary" href="/sign-in?redirect_url=/investment-challenge/admin">
            Sign In
          </Link>
        </div>
      </section>
    );
  }

  const bundle = await listInvestmentAdminBundle();

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Investment Admin</p>
          <h1 className="display compact">Accounts, holdings, trades, theses, and scores.</h1>
          <p className="lede compact-lede">
            Organizer view for monitoring team portfolios and exporting the current leaderboard.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/api/investment/admin?format=csv">
              Export CSV
            </Link>
            <form action="/api/investment/admin/refresh-prices" method="post">
              <button className="button secondary" type="submit">
                Refresh featured prices
              </button>
            </form>
            <Link className="button secondary" href="/investment-challenge/leaderboard">
              Public Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {!bundle.persisted ? (
        <section className="panel stack-sm">
          <p className="eyebrow">Database</p>
          <h2>Supabase is not configured yet.</h2>
          <p className="muted">Apply the investment migration and configure Supabase environment variables.</p>
        </section>
      ) : null}

      <section className="grid four investment-admin-stats">
        <div className="stat-card"><span>Accounts</span><strong>{bundle.accounts.length}</strong></div>
        <div className="stat-card"><span>Trades</span><strong>{bundle.trades.length}</strong></div>
        <div className="stat-card"><span>Theses</span><strong>{bundle.theses.length}</strong></div>
        <div className="stat-card"><span>Snapshots</span><strong>{bundle.snapshots.length}</strong></div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h2>Current ranking.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Total value</th>
                <th>Overall</th>
                <th>Return</th>
                <th>Thesis</th>
              </tr>
            </thead>
            <tbody>
              {bundle.leaderboard.map((row) => (
                <tr key={value(row, "account_id")}>
                  <td>#{value(row, "rank_position")}</td>
                  <td>{value(row, "team_name")}</td>
                  <td>{formatUsd(numberValue(row, "total_value"))}</td>
                  <td>{value(row, "overall_score")}/100</td>
                  <td>{Number(numberValue(row, "total_return")).toFixed(2)}%</td>
                  <td>{value(row, "thesis_score")}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid two">
        <article className="panel stack-md">
          <p className="eyebrow">Recent trades</p>
          <h2>Server-validated orders.</h2>
          <div className="table-wrap">
            <table className="record-table investment-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bundle.trades.slice(0, 40).map((row) => (
                  <tr key={value(row, "id")}>
                    <td>{value(row, "created_at").slice(0, 16)}</td>
                    <td>{value(row, "symbol")}</td>
                    <td>{value(row, "side")}</td>
                    <td>{value(row, "quantity")}</td>
                    <td>{row.rejected ? value(row, "reject_reason") : "Executed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stack-md">
          <p className="eyebrow">Theses</p>
          <h2>Team reasoning.</h2>
          <div className="investment-admin-list">
            {bundle.theses.slice(0, 20).map((row) => (
              <div className="goal-item" key={value(row, "id")}>
                <strong>{value(row, "account_id").slice(0, 8)} · {value(row, "thesis_score")}/100</strong>
                <p className="muted small">{value(row, "thesis") || "No thesis text."}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
