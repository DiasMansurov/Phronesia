import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { getCachedAssetQuote, listInvestmentAssetQuotes } from "@/lib/server-investments";

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
    const cached = await getCachedAssetQuote(symbol);
    const quotes = await listInvestmentAssetQuotes();
    if (!cached.priceAvailable || !cached.latestClose) {
      return NextResponse.json(
        {
          ok: false,
          providerCalled: false,
          error: "Student price refresh is disabled. Price is not available yet. Please wait for the next scheduled update.",
          result: {
            symbol,
            ok: false,
            success: false,
            source: "unavailable",
            providerCalled: false
          },
          quotes
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      providerCalled: false,
      result: {
        symbol,
        ok: true,
        success: true,
        price: cached.latestClose,
        priceDate: cached.priceDate,
        source: "cache",
        providerCalled: false,
        cacheAgeSeconds: cached.cacheAgeSeconds ?? null,
        message: "Using saved server price. Student refresh does not call the market data provider."
      },
      quotes
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to refresh this symbol." },
      { status: 500 }
    );
  }
}
