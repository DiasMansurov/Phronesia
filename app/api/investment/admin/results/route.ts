import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults, type InvestmentAdminTeamResult } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return noStoreJson({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  try {
    const bundle = await listInvestmentAdminResults(competitionCode);
    return noStoreJson({
      ok: true,
      persisted: bundle.persisted,
      competition: bundle.competition,
      summary: bundle.stats,
      stats: bundle.stats,
      teams: bundle.teams.map(adminTeamApiRow)
    });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error ?? "Failed to load admin results.")
      },
      { status: 500 }
    );
  }
}

function adminTeamApiRow(team: InvestmentAdminTeamResult) {
  return {
    ...team,
    team_id: team.teamId,
    team_name: team.teamName,
    competition_id: team.competitionId,
    competition_code: team.competitionCode,
    starting_cash: team.startingCash,
    cash_balance: team.cashBalance,
    holdings_value: team.holdingsValue,
    locked_margin: team.lockedMargin,
    open_exposure: team.totalExposure,
    unrealized_pnl: team.unrealizedPnl,
    holdings_unrealized_pnl: team.holdingsUnrealizedPnl,
    positions_unrealized_pnl: team.positionsUnrealizedPnl,
    total_unrealized_pnl: team.totalUnrealizedPnl,
    open_position_value: team.openPositionValue,
    total_portfolio_value: team.totalPortfolioValue,
    formula_breakdown: team.formulaBreakdown,
    profit_loss: team.profitLoss,
    return_percent: team.returnPercent,
    realized_pnl: team.realizedPnl,
    total_commissions: team.totalCommissions,
    ignored_trades_count: team.ignoredTradesCount,
    suspicious_trades_count: team.suspiciousTradesCount,
    liquidated_positions_count: team.liquidatedPositionsCount,
    warnings: team.warnings,
    trades_count: team.tradesCount,
    holdings_count: team.holdingsCount,
    open_positions_count: team.openPositionsCount,
    last_activity: team.lastActivity,
    portfolio_debug: team.portfolioDebug
  };
}
