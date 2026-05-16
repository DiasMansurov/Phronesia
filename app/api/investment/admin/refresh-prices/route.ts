import { NextResponse } from "next/server";

import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { recalculatePortfolios, refreshFeaturedAssetPrices, refreshHeldAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export async function POST() {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

  const featured = await refreshFeaturedAssetPrices();
  const held = await refreshHeldAssetPrices();
  const portfolios = await recalculatePortfolios();
  const leaderboard = await updateInvestmentLeaderboard();

  return NextResponse.json({
    ok: true,
    featured,
    held,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
