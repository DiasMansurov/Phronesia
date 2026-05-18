import { NextResponse } from "next/server";

import { debugMarketDataAppPrice } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required." }, { status: 400 });
  }

  try {
    const result = await debugMarketDataAppPrice(symbol);
    return NextResponse.json({
      ...result,
      provider: process.env.MARKET_DATA_PROVIDER ?? "marketdata_app",
      endpointUsed: result.endpointUsed ?? "/stocks/prices",
      cacheFound: result.cacheFound,
      cachedPriceFound: result.cacheFound,
      apiStatus: result.marketDataAppStatus,
      finalPrice: result.finalPrice,
      source: result.source
    });
  } catch (error) {
    return NextResponse.json(
      {
        symbol,
        provider: process.env.MARKET_DATA_PROVIDER ?? "marketdata_app",
        hasMarketDataApiKey: Boolean(process.env.MARKET_DATA_API_KEY),
        cacheFound: false,
        cachedPriceFound: false,
        cachedPrice: null,
        cachedFetchedAt: null,
        cacheFresh: false,
        calledMarketDataApp: false,
        endpointUsed: "/stocks/prices",
        requestUrlWithoutToken: `https://api.marketdata.app/v1/stocks/prices/${encodeURIComponent(symbol)}/?token=[redacted]`,
        httpStatus: null,
        responseOk: null,
        marketDataAppStatus: "not_used",
        parsedFields: null,
        finalPrice: null,
        tradingDay: null,
        source: null,
        responseTextPreview: null,
        errorName: error instanceof Error ? error.name : "DebugRouteError",
        errorMessage: error instanceof Error ? error.message : "Market data temporarily unavailable.",
        error: error instanceof Error ? error.message : "Market data temporarily unavailable."
      },
      { status: 500 }
    );
  }
}
