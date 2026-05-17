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
      provider: process.env.MARKET_DATA_PROVIDER ?? "alpha_vantage",
      cacheFound: result.cachedPriceFound,
      apiStatus: result.alphaVantageStatus,
      finalPrice: result.finalPrice,
      source: result.source
    });
  } catch (error) {
    return NextResponse.json(
      {
        symbol,
        hasAlphaVantageKey: Boolean(process.env.MARKET_DATA_API_KEY),
        cachedPriceFound: false,
        cachedPrice: null,
        cachedTradingDay: null,
        alphaVantageStatus: "not_used",
        yahooFinanceStatus: "not_used",
        finalPrice: null,
        tradingDay: null,
        source: null,
        error: error instanceof Error ? error.message : "Market data temporarily unavailable."
      },
      { status: 500 }
    );
  }
}
