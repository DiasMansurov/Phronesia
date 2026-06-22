import { NextResponse } from "next/server";

import { getMarketStatus, recalculatePortfolios, refreshUsedAssetPrices, updateInvestmentLeaderboard } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = new Date().toISOString();
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  console.log(`CRON_PRICE_REFRESH_STARTED startedAt=${startedAt}`);

  const marketStatus = getMarketStatus();
  if (!marketStatus.isMarketDay || !marketStatus.isOpen) {
    const finishedAt = new Date().toISOString();
    console.log("CRON_PRICE_REFRESH_FINISHED providerCallsMade=0 skipped=true");
    return NextResponse.json({
      ok: true,
      triggeredBy: "cron",
      startedAt,
      finishedAt,
      skipped: true,
      marketOpen: false,
      symbolsRequested: [],
      symbolsRefreshed: [],
      symbolsSkippedFreshCache: [],
      providerCallsMade: 0,
      errors: [],
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
  const symbolsRequested = results.map((result) => result.symbol);
  const symbolsRefreshed = results.filter((result) => result.providerCalled && result.ok).map((result) => result.symbol);
  const symbolsSkippedFreshCache = results.filter((result) => !result.providerCalled && result.ok).map((result) => result.symbol);
  const errors = results
    .filter((result) => !result.ok || result.error)
    .map((result) => ({
      symbol: result.symbol,
      error: result.error ?? result.message ?? "Price refresh failed."
    }));
  const nextRefreshAt =
    results
      .map((result) => result.nextAllowedRefreshAt)
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null;
  const finishedAt = new Date().toISOString();

  console.log(`CRON_PRICE_REFRESH_FINISHED providerCallsMade=${providerCallsMade} symbolsRequested=${symbolsRequested.length}`);

  return NextResponse.json({
    ok: true,
    triggeredBy: "cron",
    startedAt,
    finishedAt,
    skipped: false,
    marketOpen: true,
    symbolsRequested,
    symbolsRefreshed,
    symbolsSkippedFreshCache,
    providerCallsMade,
    errors,
    nextRefreshAt,
    marketStatus,
    results,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
