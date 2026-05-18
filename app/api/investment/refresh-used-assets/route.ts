import { NextResponse } from "next/server";

import { listInvestmentAssetQuotes, recalculatePortfolios, refreshUsedAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export async function POST() {
  try {
    const results = await refreshUsedAssetPrices();
    const portfolios = await recalculatePortfolios();
    const leaderboard = await updateInvestmentLeaderboard();
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
