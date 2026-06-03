import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatPercent, formatUsd } from "@/lib/investment-challenge";
import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { getInvestmentAdminTeamDetail } from "@/lib/server-investments";

export const metadata: Metadata = {
  title: "Investment Team Details Admin",
  description: "Private admin team detail view for Phronesia Investment Challenge results.",
  robots: {
    index: false,
    follow: false
  }
};

type TeamDetailPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function InvestmentAdminTeamDetailPage({ params }: TeamDetailPageProps) {
  const organizer = await requireInvestmentAdmin();
  if (!organizer.ok && organizer.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/investment-challenge/admin/results");
  }
  if (organizer.errorResponse) {
    return <AdminBlocked />;
  }

  const { teamId } = await params;
  const detail = await getInvestmentAdminTeamDetail(teamId, "Teenvestor.school");
  if (!detail.overview) notFound();

  const overview = detail.overview;

  return (
    <section className="shell section stack-xl investment-admin-results-page">
      <div className="investment-admin-hero">
        <div className="investment-admin-hero-copy">
          <p className="eyebrow">Team Detail</p>
          <h1>{overview.teamName}</h1>
          <p>
            Full admin view for team balances, holdings, rank, and server-validated transaction history.
          </p>
          <div className="investment-admin-actions">
            <Link className="button secondary" href="/investment-challenge/admin/results">
              Back to all results
            </Link>
            <Link className="button primary" href="/api/investment/admin/export?type=trades&competitionCode=Teenvestor.school">
              Export trades CSV
            </Link>
          </div>
        </div>
      </div>

      <section className="grid four investment-admin-summary">
        <Metric label="Leaderboard rank" value={`#${overview.rank}`} />
        <Metric label="Total portfolio value" value={formatUsd(overview.totalPortfolioValue)} />
        <Metric label="Profit / loss" value={formatUsd(overview.profitLoss)} tone={overview.profitLoss >= 0 ? "positive" : "negative"} />
        <Metric label="Return" value={formatPercent(overview.returnPercent)} tone={overview.returnPercent >= 0 ? "positive" : "negative"} />
      </section>

      <section className="grid two investment-admin-detail-grid">
        <article className="panel stack-md investment-admin-detail-card">
          <p className="eyebrow">Team overview</p>
          <h2>{detail.competition?.name ?? "Teenvestor.school Investment Competition"}</h2>
          <dl className="investment-admin-detail-list">
            <div><dt>Team name</dt><dd>{overview.teamName}</dd></div>
            <div><dt>Starting cash</dt><dd>{formatUsd(overview.startingCash)}</dd></div>
            <div><dt>Current cash</dt><dd>{formatUsd(overview.cashBalance)}</dd></div>
            <div><dt>Holdings value</dt><dd>{formatUsd(overview.holdingsValue)}</dd></div>
            <div><dt>Total portfolio value</dt><dd>{formatUsd(overview.totalPortfolioValue)}</dd></div>
            <div><dt>Profit / loss</dt><dd className={overview.profitLoss >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.profitLoss)}</dd></div>
            <div><dt>Return</dt><dd className={overview.returnPercent >= 0 ? "positive-text" : "negative-text"}>{formatPercent(overview.returnPercent)}</dd></div>
            <div><dt>Status</dt><dd>{overview.status}</dd></div>
            <div><dt>Created</dt><dd>{formatDateTime(overview.createdAt)}</dd></div>
            <div><dt>Last login</dt><dd>{formatDateTime(overview.lastLoginAt)}</dd></div>
            <div><dt>Last activity</dt><dd>{formatDateTime(overview.lastActivity)}</dd></div>
          </dl>
        </article>

        <article className="panel stack-md investment-admin-detail-card">
          <p className="eyebrow">Admin note</p>
          <h2>Protected team record.</h2>
          <p className="muted">
            This page is visible only to admin accounts. Students can see their own portfolio, but not this full
            transaction view for every team.
          </p>
          <div className="investment-admin-note-grid">
            <span>Trades: <strong>{overview.tradesCount}</strong></span>
            <span>Holdings: <strong>{overview.holdingsCount}</strong></span>
            <span>Competition: <strong>{detail.competition?.runtimeStatus ?? "n/a"}</strong></span>
          </div>
        </article>
      </section>

      <section className="panel stack-md investment-admin-results-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Current holdings</p>
            <h2>Positions and unrealized P/L.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table investment-admin-results-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company / ETF</th>
                <th>Quantity</th>
                <th>Average buy</th>
                <th>Latest price</th>
                <th>Market value</th>
                <th>Unrealized P/L</th>
                <th>Allocation</th>
              </tr>
            </thead>
            <tbody>
              {detail.holdings.map((holding) => (
                <tr key={holding.symbol}>
                  <td>{holding.symbol}</td>
                  <td>{holding.assetName}</td>
                  <td>{holding.quantity}</td>
                  <td>{formatUsd(holding.averageBuyPrice)}</td>
                  <td>{holding.latestPrice ? `${formatUsd(holding.latestPrice)} · ${holding.priceDate ?? "saved"}` : "Price unavailable"}</td>
                  <td>{holding.marketValue === null ? "Price unavailable" : formatUsd(holding.marketValue)}</td>
                  <td className={(holding.unrealizedProfitLoss ?? 0) >= 0 ? "positive-text" : "negative-text"}>
                    {holding.unrealizedProfitLoss === null ? "n/a" : formatUsd(holding.unrealizedProfitLoss)}
                  </td>
                  <td>{holding.allocationPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!detail.holdings.length ? (
          <div className="investment-empty-state">
            <strong>No holdings yet.</strong>
            <p className="muted small">This team has not opened an active position.</p>
          </div>
        ) : null}
      </section>

      <section className="panel stack-md investment-admin-results-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Transaction history</p>
            <h2>Every simulated order.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table investment-admin-results-table">
            <thead>
              <tr>
                <th>Date/time</th>
                <th>Side</th>
                <th>Symbol</th>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Execution price</th>
                <th>Gross value</th>
                <th>Commission</th>
                <th>Net / total</th>
                <th>Price source</th>
                <th>Price timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{formatDateTime(trade.createdAt)}</td>
                  <td><span className={`pill ${trade.side === "buy" ? "positive" : "negative"}`}>{trade.side.toUpperCase()}</span></td>
                  <td>{trade.symbol}</td>
                  <td>{trade.assetName}</td>
                  <td>{trade.quantity}</td>
                  <td>{trade.price ? formatUsd(trade.price) : "n/a"}</td>
                  <td>{trade.grossValue ? formatUsd(trade.grossValue) : "n/a"}</td>
                  <td>{trade.feeAmount ? formatUsd(trade.feeAmount) : "n/a"}</td>
                  <td>{trade.netValue ? formatUsd(trade.netValue) : "n/a"}</td>
                  <td>{trade.priceSource ?? "n/a"}</td>
                  <td>{formatDateTime(trade.priceTimestamp)}</td>
                  <td>{trade.rejected ? trade.rejectReason ?? "Rejected" : "Executed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!detail.trades.length ? (
          <div className="investment-empty-state">
            <strong>No transactions yet.</strong>
            <p className="muted small">Buy and sell orders will appear here after this team starts trading.</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <article className="stat-card investment-admin-result-stat">
      <span>{label}</span>
      <strong className={tone === "positive" ? "positive-text" : tone === "negative" ? "negative-text" : undefined}>{value}</strong>
    </article>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function AdminBlocked() {
  return (
    <section className="shell section auth-page">
      <div className="panel stack-md">
        <p className="eyebrow">Investment Results</p>
        <h1>Admin access required.</h1>
        <p className="muted">Only emails listed in INVESTMENT_ADMIN_EMAILS can view team balances, holdings, and transaction history.</p>
        <Link className="button primary" href="/investment-challenge">
          Back to Investment Challenge
        </Link>
      </div>
    </section>
  );
}
