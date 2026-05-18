import { NextResponse } from "next/server";

import { debugInvestmentPrice } from "@/lib/server-investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required." }, { status: 400 });
  }

  try {
    const result = await debugInvestmentPrice(symbol);
    return NextResponse.json({
      ...result,
      provider: process.env.MARKET_DATA_PROVIDER ?? "marketdata_app",
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
        marketDataAppStatus: "not_used",
        finalPrice: null,
        tradingDay: null,
        source: null,
        error: error instanceof Error ? error.message : "Market data temporarily unavailable."
      },
      { status: 500 }
    );
  }
}
