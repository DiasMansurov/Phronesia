import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminBundle } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Investment Challenge Admin",
  description: "Organizer admin view for Phronesia Investment Challenge accounts, holdings, trades, theses, exports, and private results.",
  alternates: {
    canonical: "/investment-challenge/admin"
  }
};

function value(row: Record<string, unknown>, key: string) {
  return String(row[key] ?? "");
}

export default async function InvestmentChallengeAdminPage() {
  const organizer = await requireInvestmentAdmin();
  if (!organizer.ok && organizer.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/investment-challenge/admin");
  }

  if (organizer.errorResponse) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Investment Admin</p>
          <h1>Admin access only</h1>
          <p className="muted">Sign in with an email listed in INVESTMENT_ADMIN_EMAILS to manage investment results.</p>
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
            Organizer tools for competition setup, price refreshes, exports, and private Results access.
          </p>
          <p className="muted small">
            Prices are fetched only through MarketData.app /stocks/quotes for selected, held, traded, or manually refreshed assets to save API credits.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/investment-challenge/admin/results">
              Results
            </Link>
            <Link className="button primary" href="/api/investment/admin?format=csv">
              Export leaderboard CSV
            </Link>
            <Link className="button secondary" href="/api/investment/admin?format=trades">
              Export trades CSV
            </Link>
            <form action="/api/investment/admin/refresh-prices" method="post">
              <input type="hidden" name="mode" value="featured" />
              <button className="button secondary" type="submit">
                Refresh featured stock prices
              </button>
            </form>
            <form action="/api/investment/admin/refresh-prices" method="post">
              <input type="hidden" name="mode" value="held" />
              <button className="button secondary" type="submit">
                Refresh held assets
              </button>
            </form>
          </div>
          <form className="cta-row" action="/api/investment/admin/refresh-prices" method="post">
            <input type="hidden" name="mode" value="selected" />
            <label className="form-field compact-field">
              <span>Refresh selected stock price</span>
              <input name="symbol" placeholder="SPY" />
            </label>
            <button className="button secondary" type="submit">
              Refresh selected stock price
            </button>
          </form>
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
        <div className="stat-card"><span>Total teams</span><strong>{bundle.stats?.totalTeams ?? bundle.accounts.length}</strong></div>
        <div className="stat-card"><span>Active teams</span><strong>{bundle.stats?.activeTeams ?? 0}</strong></div>
        <div className="stat-card"><span>Total trades</span><strong>{bundle.stats?.totalTrades ?? bundle.trades.length}</strong></div>
        <div className="stat-card"><span>Best team</span><strong>{bundle.stats?.bestTeam ?? "n/a"}</strong></div>
      </section>

      <section className="grid two">
        <article className="panel stack-md">
          <p className="eyebrow">Create or edit competition</p>
          <h2>Competition code, dates, and starting cash.</h2>
          <form className="stack-sm" action="/api/investment/admin/competitions" method="post">
            <label className="form-field"><span>Code</span><input name="code" placeholder="Competition code" required /></label>
            <label className="form-field"><span>Name</span><input name="name" placeholder="Competition name" /></label>
            <label className="form-field"><span>Description</span><input name="description" placeholder="Private educational portfolio competition" /></label>
            <label className="form-field"><span>Starting cash</span><input name="startingCash" type="number" defaultValue={100000} min={1} /></label>
            <label className="form-field"><span>Allowed assets</span><input name="allowedAssets" placeholder="Blank = all searchable US stocks/ETFs" /></label>
            <label className="form-field"><span>Trading rules</span><input name="tradingRules" placeholder="No margin, no short selling, 0.1% fee" /></label>
            <label className="form-field"><span>Start date/time</span><input name="startAt" type="datetime-local" /></label>
            <label className="form-field"><span>End date/time</span><input name="endAt" type="datetime-local" /></label>
            <label className="form-field"><span>Ranking method</span><select name="rankingMethod" defaultValue="portfolio_value"><option value="portfolio_value">Portfolio value</option><option value="total_return">Total return</option><option value="balanced_score">Balanced score</option></select></label>
            <label className="form-field"><span>Status</span><select name="status" defaultValue="active"><option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option></select></label>
            <button className="button primary" type="submit">Save competition</button>
          </form>
        </article>

        <article className="panel stack-md">
          <p className="eyebrow">Competitions</p>
          <h2>Close and monitor competitions.</h2>
          <div className="investment-admin-list">
            {bundle.competitions.map((competition) => (
              <div className="goal-item" key={competition.id}>
                <strong>{competition.name}</strong>
                <p className="muted small">{competition.code} · {competition.runtimeStatus} · ends {competition.endAt ? competition.endAt.slice(0, 10) : "organizer controlled"}</p>
                <div className="cta-row">
                  {competition.isTeenvestor ? (
                    <Link className="text-link" href="/investment-challenge/admin/results">Admin results</Link>
                  ) : null}
                  <form action="/api/investment/admin/finalize" method="post">
                    <input type="hidden" name="code" value={competition.code} />
                    <button className="text-link" type="submit">Finalize</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </article>
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
