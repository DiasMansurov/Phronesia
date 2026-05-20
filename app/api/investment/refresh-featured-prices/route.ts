import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import {
  listInvestmentAssetQuotes,
  recalculatePortfolios,
  refreshFeaturedAssetPrices,
  updateInvestmentLeaderboard
} from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST() {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  try {
    const results = await refreshFeaturedAssetPrices();
    const portfolios = await recalculatePortfolios();
    const leaderboard = await updateInvestmentLeaderboard(access.access.allowed ? access.access.competitionCode : undefined);
    const quotes = await listInvestmentAssetQuotes();
    const apiLimitReached = results.some((result) => result.apiLimitReached);

    return NextResponse.json({
      ok: true,
      apiLimitReached,
      results,
      quotes,
      portfolios,
      leaderboardRows: leaderboard.rows.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to refresh featured prices."
      },
      { status: 500 }
    );
  }
}
