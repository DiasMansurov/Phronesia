import { NextResponse } from "next/server";

import {
  getMarketStatus,
  isValidUsMarketDay,
  recalculatePortfolios,
  updateDailyPrices,
  updateInvestmentLeaderboard
} from "@/lib/server-investments";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authorization = request.headers.get("authorization") ?? "";
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }
  }

  const marketStatus = getMarketStatus();
  if (!isValidUsMarketDay()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: marketStatus.holidayName ? `US market holiday: ${marketStatus.holidayName}` : "Not a US market day.",
      marketStatus
    });
  }

  const prices = await updateDailyPrices();
  const portfolios = await recalculatePortfolios();
  const leaderboard = await updateInvestmentLeaderboard();

  return NextResponse.json({
    ok: true,
    skipped: false,
    marketStatus,
    prices,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
