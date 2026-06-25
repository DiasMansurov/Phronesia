import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const { detail, errorMessage } = await loadTeamDetailSafely(teamId);
  if (!detail.overview) {
    return (
      <section className="shell section stack-xl investment-admin-results-page">
        <div className="investment-admin-hero">
          <div className="investment-admin-hero-copy">
            <p className="eyebrow">Team Detail</p>
            <h1>Team details unavailable</h1>
            <p>{errorMessage ? `Failed to load team details: ${errorMessage}` : "Team was not found in the Teenvestor.school competition."}</p>
            <div className="investment-admin-actions">
              <Link className="button secondary" href="/investment-challenge/admin/results">
                Back to all results
              </Link>
            </div>
          </div>
        </div>
        <section className="panel stack-sm investment-admin-error-state">
          <p className="eyebrow">Error state</p>
          <h2>{errorMessage ? "Failed to load team details." : "Team was not found."}</h2>
          <p className="muted">{errorMessage ?? "This team does not belong to the Teenvestor.school competition or no longer exists."}</p>
        </section>
        <AdminDebugPanel
          debug={{
            currentRoute: `/investment-challenge/admin/results/${teamId}`,
            adminEmail: organizer.userEmail ?? "n/a",
            isInvestmentAdmin: organizer.ok,
            envEmailsLoaded: Boolean(process.env.INVESTMENT_ADMIN_EMAILS?.trim()),
            competitionFound: Boolean(detail.competition),
            competitionId: detail.competition?.id ?? "n/a",
            teamFound: Boolean(detail.overview),
            tradesLoadedCount: detail.trades.length,
            holdingsLoadedCount: detail.holdings.length,
            positionsLoadedCount: detail.positions.length,
            errorMessage
          }}
        />
      </section>
    );
  }

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
        <Metric label="Locked margin" value={formatUsd(overview.lockedMargin)} />
        <Metric label="Open exposure" value={formatUsd(overview.totalExposure)} />
        <Metric label="Unrealized P/L" value={formatUsd(overview.totalUnrealizedPnl)} tone={overview.totalUnrealizedPnl >= 0 ? "positive" : "negative"} />
        <Metric label="Open positions" value={overview.openPositionsCount.toString()} />
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
            <div><dt>Locked margin</dt><dd>{formatUsd(overview.lockedMargin)}</dd></div>
            <div><dt>Total exposure</dt><dd>{formatUsd(overview.totalExposure)}</dd></div>
            <div><dt>Holdings unrealized P/L</dt><dd className={overview.holdingsUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.holdingsUnrealizedPnl)}</dd></div>
            <div><dt>Positions unrealized P/L</dt><dd className={overview.positionsUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.positionsUnrealizedPnl)}</dd></div>
            <div><dt>Total unrealized P/L</dt><dd className={overview.totalUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.totalUnrealizedPnl)}</dd></div>
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
            <span>Open positions: <strong>{overview.openPositionsCount}</strong></span>
            <span>Competition: <strong>{detail.competition?.runtimeStatus ?? "n/a"}</strong></span>
          </div>
        </article>
      </section>

      <section className="panel stack-md investment-admin-results-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Portfolio formula</p>
            <h2>Canonical snapshot breakdown.</h2>
            <p className="muted small">
              These numbers come from the same server-side rows used in the holdings and open positions tables.
            </p>
          </div>
        </div>
        <dl className="investment-admin-detail-list">
          <div><dt>Cash</dt><dd>{formatUsd(overview.formulaBreakdown.cash)}</dd></div>
          <div><dt>Normal holdings value</dt><dd>{formatUsd(overview.formulaBreakdown.normalHoldingsValue)}</dd></div>
          <div><dt>Locked margin</dt><dd>{formatUsd(overview.formulaBreakdown.lockedMargin)}</dd></div>
          <div><dt>Open exposure</dt><dd>{formatUsd(overview.formulaBreakdown.openExposure)}</dd></div>
          <div><dt>Positions unrealized P/L</dt><dd className={overview.formulaBreakdown.positionsUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.formulaBreakdown.positionsUnrealizedPnl)}</dd></div>
          <div><dt>Total portfolio value</dt><dd>{formatUsd(overview.formulaBreakdown.totalPortfolioValue)}</dd></div>
          <div><dt>Holdings unrealized P/L</dt><dd className={overview.formulaBreakdown.holdingsUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.formulaBreakdown.holdingsUnrealizedPnl)}</dd></div>
          <div><dt>Total unrealized P/L</dt><dd className={overview.formulaBreakdown.totalUnrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(overview.formulaBreakdown.totalUnrealizedPnl)}</dd></div>
        </dl>
        <p className="muted small">
          Total portfolio value = cash + normal holdings value + locked margin + positions unrealized P/L =
          {" "}
          {formatUsd(overview.formulaBreakdown.cash)} + {formatUsd(overview.formulaBreakdown.normalHoldingsValue)} + {formatUsd(overview.formulaBreakdown.lockedMargin)} + {formatUsd(overview.formulaBreakdown.positionsUnrealizedPnl)}
          {" "}
          = {formatUsd(overview.formulaBreakdown.totalPortfolioValue)}.
        </p>
      </section>

      <section className="panel stack-md investment-admin-results-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Open positions</p>
            <h2>Long, short, leverage, margin, and P/L.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table investment-table investment-admin-results-table">
            <thead>
              <tr>
                <th>Side</th>
                <th>Ticker</th>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Entry price</th>
                <th>Current price</th>
                <th>Leverage</th>
                <th>Margin locked</th>
                <th>Exposure</th>
                <th>Unrealized P/L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.positions.map((position) => (
                <tr key={position.id}>
                  <td><span className={`pill ${position.side === "long" ? "positive" : "negative"}`}>{position.side.toUpperCase()}</span></td>
                  <td>{position.symbol}</td>
                  <td>{position.assetName}</td>
                  <td>{position.quantity}</td>
                  <td>{formatUsd(position.entryPrice)}</td>
                  <td>
                    <div>{formatUsd(position.currentPrice)}</div>
                    {position.priceWarning ? <small className="muted">{position.priceWarning}</small> : null}
                  </td>
                  <td>x{position.leverage}</td>
                  <td>{formatUsd(position.marginLocked)}</td>
                  <td>{formatUsd(position.exposureValue)}</td>
                  <td className={position.unrealizedPnl >= 0 ? "positive-text" : "negative-text"}>{formatUsd(position.unrealizedPnl)}</td>
                  <td>{position.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!detail.positions.length ? (
          <div className="investment-empty-state">
            <strong>No long/short positions yet.</strong>
            <p className="muted small">Leveraged long and short positions will appear here after this team opens one.</p>
          </div>
        ) : null}
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
                  <td>
                    <div>{holding.latestPrice ? `${formatUsd(holding.latestPrice)} · ${holding.priceDate ?? "saved"}` : "Price unavailable"}</div>
                    {holding.priceWarning ? <small className="muted">{holding.priceWarning}</small> : null}
                  </td>
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
                <th>Action</th>
                <th>Side</th>
                <th>Symbol</th>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Leverage</th>
                <th>Execution price</th>
                <th>Gross value</th>
                <th>Margin</th>
                <th>Commission</th>
                <th>Net / total</th>
                <th>Realized P/L</th>
                <th>Price source</th>
                <th>Price timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{formatDateTime(trade.createdAt)}</td>
                  <td>{(trade.action ?? trade.side).replaceAll("_", " ").toUpperCase()}</td>
                  <td><span className={`pill ${trade.side === "buy" || trade.side === "long" ? "positive" : "negative"}`}>{trade.side.toUpperCase()}</span></td>
                  <td>{trade.symbol}</td>
                  <td>{trade.assetName}</td>
                  <td>{trade.quantity}</td>
                  <td>{trade.leverage ? `x${trade.leverage}` : "n/a"}</td>
                  <td>{trade.price ? formatUsd(trade.price) : "n/a"}</td>
                  <td>{trade.grossValue ? formatUsd(trade.grossValue) : "n/a"}</td>
                  <td>{trade.marginUsed ? formatUsd(trade.marginUsed) : "n/a"}</td>
                  <td>{trade.feeAmount ? formatUsd(trade.feeAmount) : "n/a"}</td>
                  <td>{trade.netValue ? formatUsd(trade.netValue) : "n/a"}</td>
                  <td className={(trade.realizedPnl ?? 0) >= 0 ? "positive-text" : "negative-text"}>{trade.realizedPnl === null ? "n/a" : formatUsd(trade.realizedPnl)}</td>
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
      <AdminDebugPanel
        debug={{
          currentRoute: `/investment-challenge/admin/results/${teamId}`,
          adminEmail: organizer.userEmail ?? "n/a",
          isInvestmentAdmin: organizer.ok,
          envEmailsLoaded: Boolean(process.env.INVESTMENT_ADMIN_EMAILS?.trim()),
          competitionFound: Boolean(detail.competition),
          competitionId: detail.competition?.id ?? "n/a",
          teamFound: Boolean(detail.overview),
          tradesLoadedCount: detail.trades.length,
          holdingsLoadedCount: detail.holdings.length,
          positionsLoadedCount: detail.positions.length,
          errorMessage
        }}
      />
    </section>
  );
}

async function loadTeamDetailSafely(teamId: string) {
  try {
    return {
      detail: await getInvestmentAdminTeamDetail(teamId, "Teenvestor.school"),
      errorMessage: null
    };
  } catch (error) {
    return {
      detail: { persisted: true, competition: null, overview: null, holdings: [], positions: [], trades: [] },
      errorMessage: error instanceof Error ? error.message : String(error ?? "Unknown error")
    };
  }
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

function AdminDebugPanel({
  debug
}: {
  debug: {
    currentRoute: string;
    adminEmail: string;
    isInvestmentAdmin: boolean;
    envEmailsLoaded: boolean;
    competitionFound: boolean;
    competitionId: string;
    teamFound: boolean;
    tradesLoadedCount: number;
    holdingsLoadedCount: number;
    positionsLoadedCount: number;
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
        <div><dt>Competition found</dt><dd>{String(debug.competitionFound)}</dd></div>
        <div><dt>Competition id</dt><dd>{debug.competitionId}</dd></div>
        <div><dt>Team found</dt><dd>{String(debug.teamFound)}</dd></div>
        <div><dt>Trades loaded count</dt><dd>{debug.tradesLoadedCount}</dd></div>
        <div><dt>Holdings loaded count</dt><dd>{debug.holdingsLoadedCount}</dd></div>
        <div><dt>Positions loaded count</dt><dd>{debug.positionsLoadedCount}</dd></div>
        <div className="full-span"><dt>Error message</dt><dd>{debug.errorMessage ?? "none"}</dd></div>
      </dl>
    </section>
  );
}
