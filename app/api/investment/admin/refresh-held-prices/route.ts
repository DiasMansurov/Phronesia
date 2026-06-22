import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { recalculatePortfolios, refreshUsedAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST() {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const results = await refreshUsedAssetPrices();
  const portfolios = await recalculatePortfolios();
  const leaderboard = await updateInvestmentLeaderboard("Teenvestor.school");
  const providerCallsMade = results.filter((result) => result.providerCalled).length;
  const symbolsRefreshed = results.filter((result) => result.providerCalled && result.ok).map((result) => result.symbol);
  const symbolsFromCache = results.filter((result) => !result.providerCalled && result.ok).map((result) => result.symbol);
  const nextRefreshAt =
    results
      .map((result) => result.nextAllowedRefreshAt)
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null;

  return NextResponse.json({
    ok: true,
    providerCallsMade,
    symbolsFromCache,
    symbolsRefreshed,
    nextRefreshAt,
    results,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
