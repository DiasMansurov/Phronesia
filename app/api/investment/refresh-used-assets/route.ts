import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { listInvestmentAssetQuotes, recalculatePortfolios, refreshUsedAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export async function POST() {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  try {
    const results = await refreshUsedAssetPrices();
    const portfolios = await recalculatePortfolios();
    const leaderboard = await updateInvestmentLeaderboard(access.access.allowed ? access.access.competitionCode : undefined);
    const quotes = await listInvestmentAssetQuotes();

    return NextResponse.json({
      ok: true,
      results,
      quotes,
      portfolios,
      leaderboardRows: leaderboard.rows.length
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to refresh used assets." },
      { status: 500 }
    );
  }
}
