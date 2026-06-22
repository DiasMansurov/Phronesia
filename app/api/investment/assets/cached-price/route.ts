import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { getCachedAssetQuote } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const PRICE_UNAVAILABLE = "Price is not available yet. Please wait for the next scheduled update.";

export async function GET(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ ok: false, reason: "symbol is required.", providerCalled: false }, { status: 400 });
  }

  const quote = await getCachedAssetQuote(symbol);
  if (!quote.priceAvailable || !quote.latestClose) {
    return NextResponse.json(
      {
        ok: false,
        symbol,
        finalPrice: null,
        source: "unavailable",
        providerCalled: false,
        fetchedAt: quote.fetchedAt ?? null,
        cacheAgeSeconds: quote.cacheAgeSeconds ?? null,
        reason: quote.priceMessage ?? PRICE_UNAVAILABLE
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    symbol,
    finalPrice: quote.latestClose,
    source: "cache",
    providerCalled: false,
    fetchedAt: quote.fetchedAt ?? null,
    cacheAgeSeconds: quote.cacheAgeSeconds ?? null,
    quote
  });
}
