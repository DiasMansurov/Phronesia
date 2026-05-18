import { NextResponse } from "next/server";

import { listInvestmentAssetQuotes, recalculatePortfolios, refreshPriceForSymbol, updateInvestmentLeaderboard } from "@/lib/server-investments";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { symbol?: string };
  const symbol = body.symbol?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ ok: false, error: "symbol is required." }, { status: 400 });
  }

  try {
    const result = await refreshPriceForSymbol(symbol);
    const portfolios = await recalculatePortfolios();
    const leaderboard = await updateInvestmentLeaderboard();
    const quotes = await listInvestmentAssetQuotes();

    return NextResponse.json({
      ok: Boolean(result?.ok),
      result,
      quotes,
      portfolios,
      leaderboardRows: leaderboard.rows.length
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to refresh this symbol." },
      { status: 500 }
    );
  }
}
