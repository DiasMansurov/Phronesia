import { NextResponse } from "next/server";

import { getMarketStatus, recalculatePortfolios, refreshUsedAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  const marketStatus = getMarketStatus();
  if (!marketStatus.isMarketDay || !marketStatus.isOpen) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      providerCallsMade: 0,
      reason: marketStatus.holidayName
        ? `US market holiday: ${marketStatus.holidayName}`
        : marketStatus.isMarketDay
          ? "Outside US regular market hours. Cached prices remain available."
          : "Not a US market day. Cached prices remain available.",
      marketStatus
    });
  }

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
    skipped: false,
    providerCallsMade,
    symbolsFromCache,
    symbolsRefreshed,
    nextRefreshAt,
    marketStatus,
    results,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
