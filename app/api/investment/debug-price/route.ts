import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { getBestAvailableInvestmentPrice } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const { searchParams } = new URL(request.url);
  const rawSymbol = (searchParams.get("symbol") ?? "").trim();
  const symbol = rawSymbol.toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9.-]{0,9}$/.test(symbol)) {
    return NextResponse.json(
      { ok: false, error: "Invalid ticker format. Use one ticker only, for example AAPL." },
      { status: 400 }
    );
  }

  const result = await getBestAvailableInvestmentPrice(symbol, undefined, { refresh: true });
  const fallbackSource =
    result.source === "saved_market_price" ||
    result.source === "latest_trade_fallback" ||
    result.source === "team_average_buy_fallback" ||
    result.source === "admin_manual_override"
      ? result.source
      : null;
  return NextResponse.json({
    symbol: result.symbol,
    provider: "marketdata_app",
    marketDataStatus: result.marketDataStatus,
    providerError: result.providerError,
    calledMarketDataApp: result.calledMarketDataApp,
    httpStatus: result.httpStatus,
    fallbackPrice: fallbackSource ? result.price : null,
    fallbackSource,
    finalPrice: result.price,
    source: result.source,
    canTrade: result.canTrade,
    warning: result.warning,
    error: result.ok ? null : result.providerError ?? "Price is temporarily unavailable for this asset. Please try again later."
  });
}
