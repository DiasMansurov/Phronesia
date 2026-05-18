import { NextResponse } from "next/server";

import { savePriceToCache } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type MarketDataQuotePayload = {
  s?: string;
  symbol?: unknown[];
  ask?: unknown[];
  bid?: unknown[];
  mid?: unknown[];
  last?: unknown[];
  updated?: unknown[];
  errmsg?: string;
  error?: string;
  message?: string;
};

function safePreview(text: string) {
  const key = process.env.MARKET_DATA_API_KEY?.trim();
  return (key ? text.replaceAll(key, "[redacted]") : text).slice(0, 800);
}

function numberAt(values: unknown[] | undefined) {
  const parsed = Number(values?.[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function tradingDayFromUpdated(updated: unknown) {
  const parsed = Number(updated);
  if (!Number.isFinite(parsed) || parsed <= 0) return new Date().toISOString().slice(0, 10);
  const milliseconds = parsed > 10_000_000_000 ? parsed : parsed * 1000;
  return new Date(milliseconds).toISOString().slice(0, 10);
}

function parseJson(text: string): MarketDataQuotePayload | null {
  try {
    return JSON.parse(text) as MarketDataQuotePayload;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const hasMarketDataApiKey = Boolean(process.env.MARKET_DATA_API_KEY?.trim());
  const requestUrlWithoutToken = `https://api.marketdata.app/v1/stocks/quotes/${symbol}/?token=[redacted]`;

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required." }, { status: 400 });
  }

  if (!hasMarketDataApiKey) {
    return NextResponse.json({
      symbol,
      provider: "marketdata_app",
      hasMarketDataApiKey,
      requestUrlWithoutToken,
      calledMarketDataApp: false,
      httpStatus: null,
      responseOk: null,
      responseTextPreview: null,
      marketDataAppStatus: "missing_api_key",
      parsedPrice: null,
      finalPrice: null,
      source: null,
      error: "MARKET_DATA_API_KEY is not configured."
    });
  }

  const url = `https://api.marketdata.app/v1/stocks/quotes/${symbol}/?token=${process.env.MARKET_DATA_API_KEY}`;
  const calledMarketDataApp = true;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Phronesia/1.0"
      }
    });
    const responseText = await response.text();
    const responseTextPreview = safePreview(responseText);
    const data = parseJson(responseText);

    if (!data) {
      return NextResponse.json({
        symbol,
        provider: "marketdata_app",
        hasMarketDataApiKey,
        requestUrlWithoutToken,
        calledMarketDataApp,
        httpStatus: response.status,
        responseOk: response.ok,
        responseTextPreview,
        marketDataAppStatus: "non_json_response",
        parsedPrice: null,
        finalPrice: null,
        source: null,
        error: "MarketData.app returned a non-JSON response."
      });
    }

    const parsedSymbol = String(data.symbol?.[0] ?? symbol).toUpperCase();
    const parsedPrice = numberAt(data.last) ?? numberAt(data.mid) ?? numberAt(data.bid) ?? numberAt(data.ask);
    const updated = data.updated?.[0] ?? null;
    const marketDataAppStatus = String(data.s ?? "");
    const providerError = data.errmsg ?? data.error ?? data.message ?? null;
    const success = response.ok && marketDataAppStatus === "ok" && parsedPrice !== null;

    if (success) {
      const tradingDay = tradingDayFromUpdated(updated);
      await savePriceToCache(parsedSymbol, parsedPrice, tradingDay, null, {
        ok: true,
        symbol: parsedSymbol,
        priceDate: tradingDay,
        closePrice: parsedPrice,
        adjustedClosePrice: parsedPrice,
        volume: 0,
        provider: "marketdata_app",
        source: "marketdata_app",
        message: `Latest MarketData.app quote for ${parsedSymbol}.`,
        raw: { endpoint: "stocks/quotes", payload: data }
      });
    }

    return NextResponse.json({
      symbol: parsedSymbol,
      provider: "marketdata_app",
      hasMarketDataApiKey,
      requestUrlWithoutToken,
      calledMarketDataApp,
      httpStatus: response.status,
      responseOk: response.ok,
      responseTextPreview,
      marketDataAppStatus,
      parsedPrice,
      finalPrice: success ? parsedPrice : null,
      source: success ? "marketdata_app" : null,
      error: success ? null : providerError ?? "MarketData.app did not return a usable price."
    });
  } catch (error) {
    return NextResponse.json({
      symbol,
      provider: "marketdata_app",
      hasMarketDataApiKey,
      requestUrlWithoutToken,
      calledMarketDataApp,
      httpStatus: null,
      responseOk: null,
      responseTextPreview: null,
      marketDataAppStatus: "fetch_failed",
      parsedPrice: null,
      finalPrice: null,
      source: null,
      error: error instanceof Error ? error.message : "fetch failed"
    });
  }
}
