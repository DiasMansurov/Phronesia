import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { listInvestmentAssetQuotes, recalculatePortfolios, refreshPriceForSymbol, updateInvestmentLeaderboard } from "@/lib/server-investments";

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
