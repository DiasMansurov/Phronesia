import { NextResponse } from "next/server";

import { requireResultsOrganizer } from "@/lib/server-results-auth";
import {
  recalculatePortfolios,
  refreshFeaturedAssetPrices,
  refreshHeldAssetPrices,
  refreshPriceForSymbol,
  refreshUsedAssetPrices,
  updateInvestmentLeaderboard
} from "@/lib/server-investments";

export async function POST(request: Request) {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

  const contentType = request.headers.get("content-type") ?? "";
  let mode = "featured_and_held";
  let symbol = "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { mode?: string; symbol?: string };
    mode = body.mode ?? mode;
    symbol = body.symbol ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    mode = String(form?.get("mode") ?? mode);
    symbol = String(form?.get("symbol") ?? "");
  }

  const selected = symbol.trim() ? await refreshPriceForSymbol(symbol.trim()) : null;
  const featured = mode === "featured" || mode === "featured_and_held" ? await refreshFeaturedAssetPrices() : [];
  const held = mode === "held" || mode === "featured_and_held" ? await refreshHeldAssetPrices() : [];
  const used = mode === "used" ? await refreshUsedAssetPrices() : [];
  const portfolios = await recalculatePortfolios();
  const leaderboard = await updateInvestmentLeaderboard();

  return NextResponse.json({
    ok: true,
    mode,
    selected,
    featured,
    held,
    used,
    portfolios,
    leaderboardRows: leaderboard.rows.length
  });
}
