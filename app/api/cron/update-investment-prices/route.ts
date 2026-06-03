import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import {
  getMarketStatus,
  recalculatePortfolios,
  refreshUsedAssetPrices,
  updateInvestmentLeaderboard
} from "@/lib/server-investments";

// Vercel Hobby supports scheduled cron jobs only once per day.
// Keep this route callable manually for now; 15-minute market refreshes require Vercel Pro or an external scheduler.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authorization = request.headers.get("authorization") ?? "";
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }
  } else {
    const organizer = await requireInvestmentAdmin();
    if (organizer.errorResponse) return organizer.errorResponse;
  }

  const marketStatus = getMarketStatus();
  if (!marketStatus.isMarketDay || !marketStatus.isOpen) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: marketStatus.holidayName
        ? `US market holiday: ${marketStatus.holidayName}`
        : marketStatus.isMarketDay
          ? "Outside US regular market hours."
          : "Not a US market day.",
      marketStatus
    });
  }

  const prices = await refreshUsedAssetPrices();
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
