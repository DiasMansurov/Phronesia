import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults, type InvestmentAdminTeamResult } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  try {
    const bundle = await listInvestmentAdminResults(competitionCode);
    return NextResponse.json({
      ok: true,
      persisted: bundle.persisted,
      competition: bundle.competition,
      summary: bundle.stats,
      stats: bundle.stats,
      teams: bundle.teams.map(adminTeamApiRow)
    });
  } catch (error) {
    return NextResponse.json(
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
    total_portfolio_value: team.totalPortfolioValue,
    profit_loss: team.profitLoss,
    return_percent: team.returnPercent,
    trades_count: team.tradesCount,
    holdings_count: team.holdingsCount,
    open_positions_count: team.openPositionsCount,
    last_activity: team.lastActivity,
    portfolio_debug: team.portfolioDebug
  };
}
