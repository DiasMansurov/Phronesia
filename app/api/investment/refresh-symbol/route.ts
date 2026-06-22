import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { getCachedPrice, getMarketStatus, listInvestmentAssetQuotes, recalculatePortfolios, refreshPriceForSymbol, updateInvestmentLeaderboard } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const body = (await request.json().catch(() => ({}))) as { symbol?: string };
  const symbol = body.symbol?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ ok: false, error: "symbol is required." }, { status: 400 });
  }

  try {
    // Rate-limit: if the cached price is still fresh (< 15 min when market open,
    // or any stored price when market closed), skip the MarketData API call.
    const cached = await getCachedPrice(symbol);
    const marketStatus = getMarketStatus();
    const isFresh = cached && (cached.cacheStatus === "fresh" || (!marketStatus.isOpen && cached.cacheStatus === "cached"));
    if (isFresh) {
      const ageMin = cached.fetchedAt
        ? Math.round((Date.now() - Date.parse(cached.fetchedAt)) / 60000)
        : null;
      const ageLabel = ageMin !== null ? ` (fetched ${ageMin} min ago)` : "";
      const quotes = await listInvestmentAssetQuotes();
      return NextResponse.json({
        ok: true,
        result: {
          symbol,
          ok: true,
          success: true,
          price: cached.latestClose,
          priceDate: cached.priceDate,
          source: "cache",
          message: `${symbol} price is up to date${ageLabel}. No API call needed.`
        },
        quotes
      });
    }

    const result = await refreshPriceForSymbol(symbol);
    const portfolios = await recalculatePortfolios();
    await updateInvestmentLeaderboard(access.access.allowed ? access.access.competitionCode : undefined);
    const quotes = await listInvestmentAssetQuotes();

    return NextResponse.json({
      ok: Boolean(result?.ok),
      result,
      quotes,
      portfolios
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to refresh this symbol." },
      { status: 500 }
    );
  }
}
