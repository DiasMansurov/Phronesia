import {
  DEFAULT_INVESTMENT_COMPETITION_SLUG,
  INVESTMENT_ASSETS,
  INVESTMENT_STARTING_CASH,
  INVESTMENT_TRANSACTION_FEE_RATE,
  clampScore,
  getInvestmentAsset,
  type InvestmentAsset,
  type InvestmentAssetQuote,
  type InvestmentAssetSearchResult,
  type InvestmentMarketStatus,
  type TradeSide
} from "@/lib/investment-challenge";
import { insertRow, selectRows, supabaseConfigured, updateRows, upsertRow } from "@/lib/supabase-rest";

type Payload = Record<string, unknown>;

export type InvestmentAccountView = {
  account: {
    id: string;
    competitionId: string;
    teamName: string;
    participantLogin: string | null;
    startingCash: number;
    cash: number;
  };
  holdings: InvestmentHoldingView[];
  trades: InvestmentTradeView[];
  thesis: InvestmentThesisView | null;
  quotes: InvestmentAssetQuote[];
  portfolio: InvestmentPortfolioSummary;
  marketStatus: InvestmentMarketStatus;
};

export type InvestmentHoldingView = {
  symbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  averageBuyPrice: number;
  latestClose: number;
  priceDate: string | null;
  marketValue: number;
  unrealizedGainLoss: number;
  weight: number;
};

export type InvestmentPortfolioSummary = {
  startingCash: number;
  cash: number;
  holdingsValue: number;
  totalValue: number;
  dailyChange: number;
  totalReturn: number;
  diversificationScore: number;
  riskScore: number;
};

export type InvestmentThesisView = {
  thesis: string;
  risks: string;
  diversificationLogic: string;
  macroView: string;
  thesisScore: number;
};

export type InvestmentLeaderboardRow = {
  rank: number;
  accountId: string;
  competitionId: string;
  teamName: string;
  totalValue: number;
  totalReturn: number;
  riskAdjustedScore: number;
  diversificationScore: number;
  thesisScore: number;
  drawdownScore: number;
  overallScore: number;
  updatedAt: string;
};

export type InvestmentTradeView = {
  id: string;
  createdAt: string;
  executedAt: string | null;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  grossValue: number;
  feeRate: number;
  feeAmount: number;
  netValue: number;
  priceDate: string | null;
  priceSource: string | null;
  rejected: boolean;
  rejectReason: string | null;
};

const MARKET_CLOSED_MESSAGE =
  "US market is closed. Latest closing prices are still shown. Trading reopens at 9:30 AM ET.";

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,11}$/;
type PriceSource = "live" | "cache" | "reference" | "unavailable";
type PriceFailureCode = "rate_limit" | "symbol_not_found" | "price_unavailable" | "temporary_unavailable";
type MarketPriceResult =
  | {
      ok: true;
      symbol: string;
      priceDate: string;
      closePrice: number;
      adjustedClosePrice: number;
      volume: number;
      provider: string;
      source: PriceSource;
      message: string;
      raw: unknown;
    }
  | {
      ok: false;
      symbol: string;
      provider: string;
      code: PriceFailureCode;
      message: string;
      raw?: unknown;
    };

function rowString(row: Payload, key: string) {
  return String(row[key] ?? "");
}

function rowNullableString(row: Payload, key: string) {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function rowNumber(row: Payload, key: string, fallback = 0) {
  const value = row[key];
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatTradeUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function isSupportedSymbol(symbol: string) {
  return SYMBOL_PATTERN.test(normalizeSymbol(symbol));
}

function alphaTypeToAssetType(type: unknown): "ETF" | "Stock" {
  const value = String(type ?? "").toLowerCase();
  return value.includes("etf") || value.includes("fund") ? "ETF" : "Stock";
}

function sanitizeAssetName(name: unknown, fallback: string) {
  const cleaned = String(name ?? "").trim();
  return cleaned ? cleaned.slice(0, 160) : fallback;
}

function parsePositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function classifyAlphaResponse(data: Payload): { code: PriceFailureCode; message: string } | null {
  if (typeof data["Error Message"] === "string") {
    return { code: "symbol_not_found", message: "Symbol not found." };
  }

  const note = typeof data.Note === "string" ? data.Note : "";
  const information = typeof data.Information === "string" ? data.Information : "";
  const providerMessage = `${note} ${information}`.trim();
  if (!providerMessage) return null;

  if (/rate|limit|premium|standard api call frequency/i.test(providerMessage)) {
    return { code: "rate_limit", message: "API rate limit reached. Saved prices will still be used if available." };
  }

  return { code: "temporary_unavailable", message: "No saved market price yet for this asset." };
}

function choosePriceFailure(failures: MarketPriceResult[]) {
  const failed = failures.filter((failure): failure is Extract<MarketPriceResult, { ok: false }> => !failure.ok);
  const fallback = {
      ok: false,
      symbol: "",
      provider: "alpha_vantage",
      code: "temporary_unavailable" as const,
      message: "No saved market price yet for this asset."
  };
  const rateLimit = failed.find((failure) => failure.code === "rate_limit");
  if (rateLimit) return rateLimit;
  const symbolNotFound = failed.find((failure) => failure.code === "symbol_not_found");
  if (symbolNotFound) return symbolNotFound;
  return failed.find((failure) => failure.code === "price_unavailable") ?? failed[0] ?? fallback;
}

function todayIsoInEt(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getEtDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const year = Number(part("year"));
  const month = Number(part("month"));
  const day = Number(part("day"));
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));

  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday: part("weekday"),
    isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  };
}

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function isoFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const date = utcDate(year, month, 1);
  const offset = (weekday - date.getUTCDay() + 7) % 7;
  return isoFromUtcDate(utcDate(year, month, 1 + offset + (nth - 1) * 7));
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number) {
  const last = utcDate(year, month + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return isoFromUtcDate(utcDate(year, month, last.getUTCDate() - offset));
}

function observedFixedHoliday(year: number, month: number, day: number) {
  const date = utcDate(year, month, day);
  const weekday = date.getUTCDay();
  if (weekday === 6) return isoFromUtcDate(utcDate(year, month, day - 1));
  if (weekday === 0) return isoFromUtcDate(utcDate(year, month, day + 1));
  return isoFromUtcDate(date);
}

function easterSundayIso(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoFromUtcDate(utcDate(year, month, day));
}

function goodFridayIso(year: number) {
  const easter = new Date(`${easterSundayIso(year)}T00:00:00.000Z`);
  easter.setUTCDate(easter.getUTCDate() - 2);
  return isoFromUtcDate(easter);
}

function marketHolidayMap(year: number) {
  const holidays = new Map<string, string>();
  holidays.set(observedFixedHoliday(year, 1, 1), "New Year's Day");
  holidays.set(nthWeekdayOfMonth(year, 1, 1, 3), "Martin Luther King Jr. Day");
  holidays.set(nthWeekdayOfMonth(year, 2, 1, 3), "Presidents' Day");
  holidays.set(goodFridayIso(year), "Good Friday");
  holidays.set(lastWeekdayOfMonth(year, 5, 1), "Memorial Day");
  holidays.set(observedFixedHoliday(year, 6, 19), "Juneteenth");
  holidays.set(observedFixedHoliday(year, 7, 4), "Independence Day");
  holidays.set(nthWeekdayOfMonth(year, 9, 1, 1), "Labor Day");
  holidays.set(nthWeekdayOfMonth(year, 11, 4, 4), "Thanksgiving Day");
  holidays.set(observedFixedHoliday(year, 12, 25), "Christmas Day");
  return holidays;
}

export function getMarketStatus(now = new Date()): InvestmentMarketStatus {
  const et = getEtDateParts(now);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(et.weekday);
  const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;
  const holidays = marketHolidayMap(et.year);
  const holidayName = holidays.get(et.isoDate) ?? null;
  const isMarketDay = !isWeekend && !holidayName;
  const minutes = et.hour * 60 + et.minute;
  const openMinutes = 9 * 60 + 30;
  const closeMinutes = 16 * 60;
  const isOpen = isMarketDay && minutes >= openMinutes && minutes < closeMinutes;

  return {
    isOpen,
    isMarketDay,
    isHoliday: Boolean(holidayName),
    holidayName,
    etDate: et.isoDate,
    etTime: et.time,
    opensAtEt: "9:30 AM ET",
    closesAtEt: "4:00 PM ET",
    message: isOpen
      ? "US market is open. Buy and sell orders use the latest available daily closing price."
      : holidayName
        ? `US market is closed for ${holidayName}. Latest closing prices are still shown, but buy/sell orders are disabled.`
        : MARKET_CLOSED_MESSAGE
  };
}

export function isValidUsMarketDay(date = new Date()) {
  const status = getMarketStatus(date);
  return status.isMarketDay;
}

export async function searchAssets(query: string): Promise<InvestmentAssetSearchResult[]> {
  const keyword = query.trim();
  if (keyword.length < 1) return featuredAssetSearchResults();

  const provider = process.env.MARKET_DATA_PROVIDER ?? "alpha_vantage";
  const apiKey = process.env.MARKET_DATA_API_KEY;

  if (provider === "alpha_vantage" && apiKey) {
    try {
      const params = new URLSearchParams({
        function: "SYMBOL_SEARCH",
        keywords: keyword,
        apikey: apiKey
      });
      const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as Payload;
        const matches = (data.bestMatches as Payload[] | undefined) ?? [];
        const normalized = matches
          .map(mapAlphaSearchMatch)
          .filter((asset): asset is InvestmentAssetSearchResult => Boolean(asset))
          .filter((asset) => asset.region === "United States" && asset.currency === "USD")
          .filter((asset) => asset.type === "Stock" || asset.type === "ETF")
          .slice(0, 12);
        if (normalized.length) return attachCachedPricesToSearchResults(normalized);
      }
    } catch {
      // Fall through to local featured search when the provider is rate-limited.
    }
  }

  const lower = keyword.toLowerCase();
  return attachCachedPricesToSearchResults(featuredAssetSearchResults().filter(
    (asset) => asset.symbol.toLowerCase().includes(lower) || asset.name.toLowerCase().includes(lower)
  ));
}

export async function getAssetQuote(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return { ok: false as const, reason: "Invalid ticker format." };
  }

  const existing = await resolveInvestmentAsset(normalized);
  const searchMatch = existing ? null : (await searchAssets(normalized)).find((asset) => asset.symbol === normalized) ?? null;
  const candidate = existing ?? searchMatch ?? getInvestmentAsset(normalized) ?? null;
  const latest = await getLatestClosePrice(normalized, candidate ?? undefined, { allowReferenceFallback: Boolean(candidate?.referencePrice) });

  if (!candidate && !latest.priceAvailable) {
    return { ok: false as const, reason: latest.priceMessage ?? "Symbol not found." };
  }

  const asset =
    candidate ??
    ({
      symbol: normalized,
      name: normalized,
      type: "Stock",
      theme: "US-listed asset",
      referencePrice: latest.latestClose,
      region: "United States",
      currency: "USD",
      exchange: null,
      featured: false
    } satisfies InvestmentAsset);

  if (latest.priceAvailable || asset.referencePrice > 0) {
    await upsertInvestmentAsset({ ...asset, referencePrice: latest.latestClose || asset.referencePrice });
  }

  return { ok: true as const, asset, price: latest };
}

export async function validateAsset(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return { ok: false as const, reason: "Invalid ticker format." };
  }

  const existing = await resolveInvestmentAsset(normalized);
  const searchMatch = existing ? null : (await searchAssets(normalized)).find((asset) => asset.symbol === normalized) ?? null;
  const candidate = existing ?? searchMatch ?? undefined;
  const latest = await getLatestClosePrice(normalized, candidate, { allowReferenceFallback: false });
  if (!latest.priceAvailable) {
    return { ok: false as const, reason: latest.priceMessage ?? "Daily close price unavailable." };
  }

  const asset =
    candidate ??
    ({
      symbol: normalized,
      name: normalized,
      type: "Stock",
      theme: "US-listed asset",
      referencePrice: latest.latestClose,
      region: "United States",
      currency: "USD",
      exchange: null,
      featured: false
    } satisfies InvestmentAsset);
  await upsertInvestmentAsset({ ...asset, referencePrice: latest.latestClose });
  return { ok: true as const, asset, price: latest };
}

export async function getGlobalQuotePrice(symbol: string): Promise<MarketPriceResult> {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "symbol_not_found",
      message: "Symbol not found."
    };
  }

  const provider = process.env.MARKET_DATA_PROVIDER ?? "alpha_vantage";
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (provider !== "alpha_vantage" || !apiKey) {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "temporary_unavailable",
      message: "No saved market price yet for this asset."
    };
  }

  const params = new URLSearchParams({
    function: "GLOBAL_QUOTE",
    symbol: normalized,
    apikey: apiKey
  });

  try {
    const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return {
        ok: false,
        symbol: normalized,
        provider: "alpha_vantage",
        code: "temporary_unavailable",
        message: "No saved market price yet for this asset."
      };
    }

    const data = (await response.json()) as Payload;
    const classified = classifyAlphaResponse(data);
    if (classified) {
      return { ok: false, symbol: normalized, provider: "alpha_vantage", ...classified, raw: data };
    }

    const quote = data["Global Quote"] as Payload | undefined;
    const price = parsePositiveNumber(quote?.["05. price"]);
    const tradingDay = String(quote?.["07. latest trading day"] ?? "").trim();
    if (!price || !tradingDay) {
      return {
        ok: false,
        symbol: normalized,
        provider: "alpha_vantage",
        code: "price_unavailable",
        message: "Daily close price unavailable.",
        raw: data
      };
    }

    return {
      ok: true,
      symbol: normalized,
      priceDate: tradingDay,
      closePrice: price,
      adjustedClosePrice: price,
      volume: Number(quote?.["06. volume"] ?? 0),
      provider: "alpha_vantage",
      source: "live",
      message: `Latest saved Alpha Vantage close from ${tradingDay}.`,
      raw: quote
    };
  } catch {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "temporary_unavailable",
      message: "No saved market price yet for this asset."
    };
  }
}

export async function fetchGlobalQuote(symbol: string) {
  return getGlobalQuotePrice(symbol);
}

export async function getDailyClosePrice(symbol: string): Promise<MarketPriceResult> {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "symbol_not_found",
      message: "Symbol not found."
    };
  }

  const provider = process.env.MARKET_DATA_PROVIDER ?? "alpha_vantage";
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (provider !== "alpha_vantage" || !apiKey) {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "temporary_unavailable",
      message: "No saved market price yet for this asset."
    };
  }

  const params = new URLSearchParams({
    function: "TIME_SERIES_DAILY",
    symbol: normalized,
    outputsize: "compact",
    apikey: apiKey
  });

  try {
    const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return {
        ok: false,
        symbol: normalized,
        provider: "alpha_vantage",
        code: "temporary_unavailable",
        message: "No saved market price yet for this asset."
      };
    }

    const data = (await response.json()) as Payload;
    const classified = classifyAlphaResponse(data);
    if (classified) {
      return { ok: false, symbol: normalized, provider: "alpha_vantage", ...classified, raw: data };
    }

    const series = data["Time Series (Daily)"] as Record<string, Payload> | undefined;
    if (!series || !Object.keys(series).length) {
      return {
        ok: false,
        symbol: normalized,
        provider: "alpha_vantage",
        code: "price_unavailable",
        message: "Daily close price unavailable.",
        raw: data
      };
    }

    const [priceDate, latest] = Object.entries(series).sort(([a], [b]) => (a < b ? 1 : -1))[0] ?? [];
    const closePrice = parsePositiveNumber(latest?.["4. close"]);
    if (!priceDate || !latest || !closePrice) {
      return {
        ok: false,
        symbol: normalized,
        provider: "alpha_vantage",
        code: "price_unavailable",
        message: "Daily close price unavailable.",
        raw: data
      };
    }

    return {
      ok: true,
      symbol: normalized,
      priceDate,
      closePrice,
      adjustedClosePrice: closePrice,
      volume: Number(latest["5. volume"] ?? 0),
      provider: "alpha_vantage",
      source: "live",
      message: `Latest Alpha Vantage daily close from ${priceDate}.`,
      raw: latest
    };
  } catch {
    return {
      ok: false,
      symbol: normalized,
      provider: "alpha_vantage",
      code: "temporary_unavailable",
      message: "No saved market price yet for this asset."
    };
  }
}

export async function fetchDailyClose(symbol: string) {
  return getDailyClosePrice(symbol);
}

export async function getDailyMarketPrice(symbol: string) {
  const price = await getDailyClosePrice(symbol);
  return price.ok ? price : null;
}

export async function getLatestClosePrice(
  symbol: string,
  assetInput?: InvestmentAsset,
  options: { allowReferenceFallback?: boolean; refresh?: boolean } = {}
) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) throw new Error("Unsupported investment asset.");
  const allowReferenceFallback = options.allowReferenceFallback ?? true;
  const refresh = options.refresh ?? false;
  const asset = assetInput ?? (await resolveInvestmentAsset(normalized));
  const failures: MarketPriceResult[] = [];

  const stored = await getCachedPrice(normalized);
  if (stored && !refresh) {
    return stored;
  }

  const globalQuote = await getGlobalQuotePrice(normalized);
  if (globalQuote.ok) {
    await savePriceToCache(normalized, globalQuote.closePrice, globalQuote.priceDate, asset, globalQuote);
    return {
      latestClose: globalQuote.closePrice,
      priceDate: globalQuote.priceDate,
      provider: globalQuote.provider,
      priceAvailable: true,
      priceSource: "live" as const,
      priceMessage: globalQuote.message
    };
  }
  failures.push(globalQuote);

  const dailyClose = await getDailyClosePrice(normalized);
  if (dailyClose.ok) {
    await savePriceToCache(normalized, dailyClose.closePrice, dailyClose.priceDate, asset, dailyClose);
    return {
      latestClose: dailyClose.closePrice,
      priceDate: dailyClose.priceDate,
      provider: dailyClose.provider,
      priceAvailable: true,
      priceSource: "live" as const,
      priceMessage: dailyClose.message
    };
  }
  failures.push(dailyClose);

  if (stored) {
    const failure = choosePriceFailure(failures);
    const prefix =
      failure.code === "rate_limit"
        ? "API rate limit reached."
        : failure.code === "temporary_unavailable"
          ? "Market data refresh failed."
          : failure.message;
    return {
      ...stored,
      priceMessage: `${prefix} Using latest saved close from ${stored.priceDate}.`
    };
  }

  if (!allowReferenceFallback) {
    const failure = choosePriceFailure(failures);
    return {
      latestClose: 0,
      priceDate: null,
      provider: failure.provider,
      priceAvailable: false,
      priceSource: "unavailable" as const,
      priceMessage:
        failure.code === "symbol_not_found"
          ? "Symbol not found."
          : failure.code === "price_unavailable"
            ? "Daily close price unavailable for this asset."
            : failure.code === "rate_limit"
              ? "API rate limit reached. Saved prices will still be used if available."
              : "No saved market price yet for this asset."
    };
  }

  return {
    latestClose: asset?.referencePrice ?? 0,
    priceDate: null,
    provider: "educational_reference",
    priceAvailable: false,
    priceSource: asset?.referencePrice ? ("reference" as const) : ("unavailable" as const),
    priceMessage: asset?.referencePrice
      ? "Latest close not saved yet. Click Refresh featured prices."
      : "No saved market price yet for this asset."
  };
}

export async function getCachedPrice(symbol: string) {
  const stored = await getStoredLatestPrice(normalizeSymbol(symbol));
  if (!stored) return null;
  return {
    ...stored,
    provider: stored.provider || "alpha_vantage",
    priceSource: "cache" as const,
    priceMessage: `Using latest saved close from ${stored.priceDate}.`
  };
}

export async function savePriceToCache(
  symbol: string,
  price: number,
  tradingDay: string,
  assetInput?: InvestmentAsset | null,
  marketPrice?: Extract<MarketPriceResult, { ok: true }>
) {
  const normalized = normalizeSymbol(symbol);
  if (!supabaseConfigured() || !price || !tradingDay) return null;

  const asset = assetInput ?? (await resolveInvestmentAsset(normalized));
  await upsertInvestmentAsset({
    symbol: normalized,
    name: asset?.name ?? normalized,
    type: asset?.type ?? "Stock",
    theme: asset?.theme ?? "US-listed asset",
    referencePrice: price,
    region: asset?.region ?? "United States",
    currency: asset?.currency ?? "USD",
    exchange: asset?.exchange ?? null,
    featured: Boolean(asset?.featured)
  });

  return upsertInvestmentDailyPrice({
    symbol: normalized,
    priceDate: tradingDay,
    closePrice: price,
    adjustedClosePrice: marketPrice?.adjustedClosePrice ?? price,
    volume: marketPrice?.volume ?? 0,
    provider: marketPrice?.provider ?? "alpha_vantage",
    raw: marketPrice?.raw ?? { cached: true }
  });
}

export async function updateDailyPrices() {
  await ensureInvestmentSeedData();
  const featured = await refreshFeaturedAssetPrices();
  const held = await refreshHeldAssetPrices();
  return [...featured, ...held];
}

export type InvestmentPriceRefreshResult = {
  symbol: string;
  ok: boolean;
  price?: number;
  priceDate?: string | null;
  source?: string;
  apiLimitReached?: boolean;
  message?: string;
};

export async function refreshFeaturedAssetPrices() {
  await ensureInvestmentSeedData();
  const results: InvestmentPriceRefreshResult[] = [];
  const assets = (await listInvestmentAssets()).filter((asset) => asset.featured);
  const today = todayIsoInEt();

  for (const asset of assets) {
    try {
      const cached = await getCachedPrice(asset.symbol);
      if (cached?.priceDate === today) {
        results.push({
          symbol: asset.symbol,
          ok: true,
          price: cached.latestClose,
          priceDate: cached.priceDate,
          source: "cache",
          message: `Already updated for ${today}.`
        });
        continue;
      }
      const price = await getLatestClosePrice(asset.symbol, asset, { allowReferenceFallback: false, refresh: true });
      const apiLimitReached = Boolean(price.priceMessage?.toLowerCase().includes("api rate limit"));
      if (!price.priceAvailable) {
        results.push({
          symbol: asset.symbol,
          ok: false,
          apiLimitReached,
          message: price.priceMessage ?? "Latest close not saved yet. Click Refresh featured prices."
        });
        continue;
      }
      results.push({
        symbol: asset.symbol,
        ok: true,
        price: price.latestClose,
        priceDate: price.priceDate,
        source: price.priceSource,
        apiLimitReached,
        message: price.priceMessage
      });
    } catch (error) {
      results.push({
        symbol: asset.symbol,
        ok: false,
        message: error instanceof Error ? error.message : "Unknown market data error."
      });
    }
  }

  return results;
}

export async function refreshFeaturedPrices() {
  return refreshFeaturedAssetPrices();
}

export async function refreshHeldAssetPrices() {
  await ensureInvestmentSeedData();
  const results: Array<{ symbol: string; ok: boolean; message?: string }> = [];
  if (!supabaseConfigured()) return results;

  let symbols: string[] = [];
  try {
    const rows = await selectRows("investment_holdings", {
      select: "symbol,quantity",
      quantity: "gt.0",
      limit: "200"
    });
    if (Array.isArray(rows)) {
      symbols = Array.from(new Set(rows.map((row) => normalizeSymbol(rowString(row, "symbol"))).filter(Boolean)));
    }
  } catch {
    return results;
  }

  const featuredSymbols = new Set(INVESTMENT_ASSETS.map((asset) => asset.symbol));
  const today = todayIsoInEt();
  for (const symbol of symbols.filter((item) => !featuredSymbols.has(item))) {
    try {
      const cached = await getCachedPrice(symbol);
      if (cached?.priceDate === today) {
        results.push({ symbol, ok: true, message: `Already updated for ${today}.` });
        continue;
      }
      const asset = await resolveInvestmentAsset(symbol);
      const price = await getLatestClosePrice(symbol, asset ?? undefined, { allowReferenceFallback: false, refresh: true });
      results.push({
        symbol,
        ok: price.priceAvailable,
        message:
          price.priceMessage ??
          (price.priceAvailable ? "Updated." : "Latest close not saved yet. Click Refresh featured prices.")
      });
    } catch (error) {
      results.push({
        symbol,
        ok: false,
        message: error instanceof Error ? error.message : "Unknown market data error."
      });
    }
  }

  return results;
}

export async function searchOptionChain(symbol: string) {
  return getOptionChain(symbol);
}

export async function getOptionChain(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return { ok: false as const, reason: "Symbol not found.", contracts: [] as Payload[] };
  }

  const apiKey = process.env.MARKET_DATA_API_KEY;
  const provider = process.env.MARKET_DATA_PROVIDER ?? "alpha_vantage";
  if (provider !== "alpha_vantage" || !apiKey) {
    return {
      ok: false as const,
      reason: "Real options data is unavailable on the current market data plan. Educational mode is available.",
      contracts: [] as Payload[]
    };
  }

  try {
    const params = new URLSearchParams({
      function: "HISTORICAL_OPTIONS",
      symbol: normalized,
      apikey: apiKey
    });
    const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false as const, reason: "Market data temporarily unavailable.", contracts: [] as Payload[] };
    }
    const data = (await response.json()) as Payload;
    const classified = classifyAlphaResponse(data);
    if (classified) {
      return {
        ok: false as const,
        reason:
          classified.code === "rate_limit"
            ? "Real options data is unavailable on the current market data plan. Educational mode is available."
            : classified.message,
        contracts: [] as Payload[]
      };
    }
    const contracts = Array.isArray(data.data) ? (data.data as Payload[]) : [];
    return {
      ok: contracts.length > 0,
      reason: contracts.length ? null : "Real options data is unavailable on the current market data plan. Educational mode is available.",
      contracts
    };
  } catch {
    return { ok: false as const, reason: "Market data temporarily unavailable.", contracts: [] as Payload[] };
  }
}

export async function getOptionContractPrice(contract: Payload) {
  const premium = parsePositiveNumber(contract.mark) ?? parsePositiveNumber(contract.last) ?? parsePositiveNumber(contract.ask) ?? parsePositiveNumber(contract.bid);
  return premium
    ? { ok: true as const, premium, provider: "alpha_vantage" }
    : { ok: false as const, reason: "Real options quote unavailable." };
}

export async function cacheOptionChain(symbol: string, expiration?: string) {
  const chain = await getOptionChain(symbol);
  if (!chain.ok || !supabaseConfigured()) return chain;

  for (const contract of chain.contracts.slice(0, 80)) {
    const contractSymbol = rowString(contract, "contractID") || rowString(contract, "symbol");
    const premium = await getOptionContractPrice(contract);
    if (!contractSymbol || !premium.ok) continue;
    await upsertRow(
      "investment_option_price_cache",
      {
        contract_symbol: contractSymbol,
        underlying_symbol: normalizeSymbol(symbol),
        premium: premium.premium,
        provider: premium.provider,
        raw_source: contract,
        fetched_at: new Date().toISOString()
      },
      "contract_symbol"
    );
  }

  return { ...chain, expiration: expiration ?? null };
}

export async function recalculatePortfolios() {
  if (!supabaseConfigured()) return { updated: 0, persisted: false };
  await ensureInvestmentSeedData();

  const accounts = await selectRows("investment_accounts", {
    select: "*",
    order: "created_at.asc",
    limit: "1000"
  });
  if (!Array.isArray(accounts)) return { updated: 0, persisted: false };

  const quotes = await listInvestmentAssetQuotes();
  const priceMap = new Map(quotes.map((quote) => [quote.symbol, quote.latestClose]));
  let updated = 0;

  for (const account of accounts) {
    const view = await buildInvestmentAccountView(rowString(account, "id"), priceMap);
    if (!view) continue;
    await upsertPortfolioSnapshot(view);
    updated += 1;
  }

  await updateInvestmentLeaderboard();
  return { updated, persisted: true };
}

export async function updateInvestmentLeaderboard() {
  if (!supabaseConfigured()) return { rows: [], persisted: false };
  await ensureInvestmentSeedData();

  const competition = await ensureDefaultCompetition();
  if (!competition) return { rows: [], persisted: false };

  const accounts = await selectRows("investment_accounts", {
    select: "*",
    competition_id: `eq.${competition.id}`,
    order: "created_at.asc",
    limit: "1000"
  });
  if (!Array.isArray(accounts)) return { rows: [], persisted: false };

  const quotes = await listInvestmentAssetQuotes();
  const priceMap = new Map(quotes.map((quote) => [quote.symbol, quote.latestClose]));
  const scored: InvestmentLeaderboardRow[] = [];

  for (const account of accounts) {
    const view = await buildInvestmentAccountView(rowString(account, "id"), priceMap);
    if (!view) continue;
    const snapshots = await listSnapshots(view.account.id);
    const drawdown = calculateMaxDrawdown(snapshots, view.portfolio.totalValue);
    const thesisScore = view.thesis?.thesisScore ?? 0;
    const returnScore = clampScore(50 + view.portfolio.totalReturn);
    const riskAdjustedScore = clampScore(50 + view.portfolio.totalReturn - Math.abs(drawdown) * 0.65);
    const drawdownScore = clampScore(100 - Math.abs(drawdown) * 2);
    const overallScore = Math.round(
      returnScore * 0.4 +
        riskAdjustedScore * 0.2 +
        view.portfolio.diversificationScore * 0.15 +
        thesisScore * 0.15 +
        drawdownScore * 0.1
    );

    scored.push({
      rank: 0,
      accountId: view.account.id,
      competitionId: competition.id,
      teamName: view.account.teamName,
      totalValue: view.portfolio.totalValue,
      totalReturn: view.portfolio.totalReturn,
      riskAdjustedScore,
      diversificationScore: view.portfolio.diversificationScore,
      thesisScore,
      drawdownScore,
      overallScore,
      updatedAt: new Date().toISOString()
    });
  }

  scored.sort((a, b) => b.overallScore - a.overallScore || b.totalValue - a.totalValue);
  scored.forEach((row, index) => {
    row.rank = index + 1;
  });

  for (const row of scored) {
    await upsertRow(
      "investment_leaderboard",
      {
        competition_id: row.competitionId,
        account_id: row.accountId,
        team_name: row.teamName,
        total_value: row.totalValue,
        total_return: row.totalReturn,
        risk_adjusted_score: row.riskAdjustedScore,
        diversification_score: row.diversificationScore,
        thesis_score: row.thesisScore,
        drawdown_score: row.drawdownScore,
        overall_score: row.overallScore,
        rank_position: row.rank,
        updated_at: row.updatedAt
      },
      "competition_id,account_id"
    );
  }

  return { rows: scored, persisted: true };
}

export async function ensureInvestmentSeedData() {
  if (!supabaseConfigured()) return null;
  const competition = await ensureDefaultCompetition();
  for (const [index, asset] of INVESTMENT_ASSETS.entries()) {
    await upsertRow(
      "investment_assets",
      {
        symbol: asset.symbol,
        name: asset.name,
        asset_type: asset.type,
        theme: asset.theme,
        region: asset.region ?? "United States",
        currency: asset.currency ?? "USD",
        exchange: asset.exchange ?? null,
        reference_price: asset.referencePrice,
        featured: Boolean(asset.featured),
        enabled: true,
        sort_order: index + 1
      },
      "symbol"
    );
  }
  return competition;
}

export async function createOrGetInvestmentAccount(input: {
  teamName: string;
  participantLogin?: string;
  competitionSlug?: string;
}) {
  if (!supabaseConfigured()) return null;
  const competition = await ensureDefaultCompetition(input.competitionSlug);
  if (!competition) return null;

  const teamName = input.teamName.trim().slice(0, 96);
  if (!teamName) throw new Error("Team name is required.");

  const existing = await selectRows("investment_accounts", {
    select: "*",
    competition_id: `eq.${competition.id}`,
    team_name: `eq.${teamName}`,
    limit: "1"
  });
  if (Array.isArray(existing) && existing[0]) {
    return buildInvestmentAccountView(rowString(existing[0], "id"));
  }

  const rows = await upsertRow(
    "investment_accounts",
    {
      competition_id: competition.id,
      team_name: teamName,
      participant_login: input.participantLogin?.trim().slice(0, 96) || null,
      starting_cash: INVESTMENT_STARTING_CASH,
      cash: INVESTMENT_STARTING_CASH,
      updated_at: new Date().toISOString()
    },
    "competition_id,team_name"
  );
  if (!Array.isArray(rows) || !rows[0]) return null;
  const accountId = rowString(rows[0], "id");
  await recalculatePortfolios();
  return buildInvestmentAccountView(accountId);
}

export async function getInvestmentAccountView(accountId: string) {
  if (!supabaseConfigured()) return null;
  return buildInvestmentAccountView(accountId);
}

export async function executeInvestmentTrade(input: {
  accountId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
}) {
  if (!supabaseConfigured()) {
    return { ok: false as const, reason: "Supabase is not configured for trading yet." };
  }

  const status = getMarketStatus();
  const account = await getAccountRow(input.accountId);
  if (!account) return { ok: false as const, reason: "Investment account was not found." };

  const quantity = Number(input.quantity);
  const normalizedSymbol = normalizeSymbol(input.symbol);
  if (input.side !== "buy" && input.side !== "sell") return rejectTrade(account, normalizedSymbol, input.side, quantity, "Invalid trade side.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return rejectTrade(account, normalizedSymbol, input.side, quantity, "Quantity must be a positive whole number of shares.");
  }
  if (!status.isOpen) {
    return rejectTrade(account, normalizedSymbol, input.side, quantity, status.message);
  }

  const validation = await validateAsset(normalizedSymbol);
  if (!validation.ok) return rejectTrade(account, normalizedSymbol, input.side, quantity, validation.reason);
  const asset = validation.asset;

  const latest = validation.price;
  const price = latest.latestClose;
  if (!price || !Number.isFinite(price) || price <= 0) {
    return rejectTrade(account, asset.symbol, input.side, quantity, "Latest close price is unavailable.");
  }

  const cash = rowNumber(account, "cash");
  const gross = price * quantity;
  const fee = gross * INVESTMENT_TRANSACTION_FEE_RATE;
  const holding = await getHoldingRow(rowString(account, "id"), asset.symbol);
  const currentQuantity = holding ? rowNumber(holding, "quantity") : 0;

  if (input.side === "buy") {
    const totalCost = gross + fee;
    if (totalCost > cash + 0.00001) {
      return rejectTrade(
        account,
        asset.symbol,
        "buy",
        quantity,
        `Insufficient virtual cash. Total cost including commission is ${formatTradeUsd(totalCost)}.`
      );
    }

    const previousAvg = holding ? rowNumber(holding, "average_buy_price") : 0;
    const newQuantity = currentQuantity + quantity;
    const newAverage = newQuantity > 0 ? (previousAvg * currentQuantity + totalCost) / newQuantity : 0;
    await saveTrade(account, asset.symbol, "buy", quantity, price, gross, fee, totalCost, latest.priceDate, latest.priceSource);
    await upsertHolding(rowString(account, "id"), asset.symbol, newQuantity, newAverage, holding ? rowNumber(holding, "realized_gain_loss") : 0);
    await updateRows("investment_accounts", { id: `eq.${rowString(account, "id")}` }, { cash: cash - totalCost, updated_at: new Date().toISOString() });
  } else {
    if (currentQuantity < quantity) {
      return rejectTrade(account, asset.symbol, "sell", quantity, "You cannot sell more shares than you own.");
    }

    const avg = holding ? rowNumber(holding, "average_buy_price") : 0;
    const proceeds = gross - fee;
    const previousRealized = holding ? rowNumber(holding, "realized_gain_loss") : 0;
    const realized = previousRealized + (price - avg) * quantity - fee;
    const newQuantity = currentQuantity - quantity;
    await saveTrade(account, asset.symbol, "sell", quantity, price, gross, fee, proceeds, latest.priceDate, latest.priceSource);
    await upsertHolding(rowString(account, "id"), asset.symbol, newQuantity, newQuantity > 0 ? avg : 0, realized);
    await updateRows("investment_accounts", { id: `eq.${rowString(account, "id")}` }, { cash: cash + proceeds, updated_at: new Date().toISOString() });
  }

  await recalculatePortfolios();
  const view = await buildInvestmentAccountView(rowString(account, "id"));
  return { ok: true as const, account: view, price, fee, gross, net: input.side === "buy" ? gross + fee : gross - fee };
}

export async function saveInvestmentThesis(input: {
  accountId: string;
  thesis: string;
  risks: string;
  diversificationLogic: string;
  macroView: string;
}) {
  if (!supabaseConfigured()) return null;
  const account = await getAccountRow(input.accountId);
  if (!account) throw new Error("Investment account was not found.");
  const thesisScore = scoreThesis(input);
  await upsertRow(
    "investment_theses",
    {
      account_id: input.accountId,
      competition_id: rowString(account, "competition_id"),
      thesis: input.thesis.trim().slice(0, 2000),
      risks: input.risks.trim().slice(0, 1600),
      diversification_logic: input.diversificationLogic.trim().slice(0, 1600),
      macro_view: input.macroView.trim().slice(0, 1600),
      thesis_score: thesisScore,
      updated_at: new Date().toISOString()
    },
    "account_id"
  );
  await updateInvestmentLeaderboard();
  return buildInvestmentAccountView(input.accountId);
}

export async function listInvestmentLeaderboard() {
  if (!supabaseConfigured()) return { rows: [], persisted: false };
  await updateInvestmentLeaderboard();
  const rows = await selectRows("investment_leaderboard", {
    select: "*",
    order: "rank_position.asc,overall_score.desc",
    limit: "100"
  });
  if (!Array.isArray(rows)) return { rows: [], persisted: false };
  return { rows: rows.map(mapLeaderboardRow), persisted: true };
}

export async function listInvestmentAdminBundle() {
  if (!supabaseConfigured()) {
    return { accounts: [], holdings: [], trades: [], theses: [], snapshots: [], leaderboard: [], persisted: false };
  }
  const [accounts, holdings, trades, theses, snapshots, leaderboard] = await Promise.all([
    selectRows("investment_accounts", { select: "*", order: "created_at.desc", limit: "500" }),
    selectRows("investment_holdings", { select: "*", order: "updated_at.desc", limit: "1000" }),
    selectRows("investment_trades", { select: "*", order: "created_at.desc", limit: "1000" }),
    selectRows("investment_theses", { select: "*", order: "updated_at.desc", limit: "500" }),
    selectRows("investment_portfolio_snapshots", { select: "*", order: "snapshot_date.desc", limit: "1000" }),
    selectRows("investment_leaderboard", { select: "*", order: "rank_position.asc", limit: "500" })
  ]);

  return {
    accounts: Array.isArray(accounts) ? accounts : [],
    holdings: Array.isArray(holdings) ? holdings : [],
    trades: Array.isArray(trades) ? trades : [],
    theses: Array.isArray(theses) ? theses : [],
    snapshots: Array.isArray(snapshots) ? snapshots : [],
    leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
    persisted: true
  };
}

export async function listInvestmentAssetQuotes(): Promise<InvestmentAssetQuote[]> {
  const assets = await listInvestmentAssets();
  let storedRows: Payload[] = [];
  if (supabaseConfigured()) {
    try {
      const rows = await selectRows("investment_daily_prices", {
        select: "symbol,price_date,close_price,provider",
        order: "price_date.desc",
        limit: "400"
      });
      storedRows = Array.isArray(rows) ? rows : [];
    } catch {
      storedRows = [];
    }
  }
  const latestBySymbol = new Map<string, Payload>();
  for (const row of storedRows) {
    const symbol = rowString(row, "symbol");
    if (!latestBySymbol.has(symbol)) latestBySymbol.set(symbol, row);
  }

  return assets.map((asset) => {
    const stored = latestBySymbol.get(asset.symbol);
    const storedDate = stored ? rowString(stored, "price_date") : null;
    return {
      ...asset,
      latestClose: stored ? rowNumber(stored, "close_price", asset.referencePrice) : asset.referencePrice,
      priceDate: storedDate,
      provider: stored ? rowString(stored, "provider") || "stored" : "educational_reference",
      priceAvailable: Boolean(stored),
      priceSource: stored ? ("cache" as const) : ("reference" as const),
      priceMessage: storedDate
        ? `Using latest saved close price from ${storedDate}.`
        : "Latest close not saved yet. Click Refresh featured prices."
    };
  });
}

async function listInvestmentAssets(): Promise<InvestmentAsset[]> {
  const assets = new Map<string, InvestmentAsset>();
  for (const asset of INVESTMENT_ASSETS) {
    assets.set(asset.symbol, asset);
  }

  if (supabaseConfigured()) {
    try {
      const rows = await selectRows("investment_assets", {
        select: "*",
        enabled: "eq.true",
        order: "featured.desc,sort_order.asc,symbol.asc",
        limit: "300"
      });
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const asset = mapAssetRow(row);
          assets.set(asset.symbol, { ...assets.get(asset.symbol), ...asset });
        }
      }
    } catch {
      return Array.from(assets.values());
    }
  }

  return Array.from(assets.values()).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.symbol.localeCompare(b.symbol);
  });
}

async function resolveInvestmentAsset(symbol: string): Promise<InvestmentAsset | null> {
  const normalized = normalizeSymbol(symbol);
  const featured = getInvestmentAsset(normalized);
  if (featured) return featured;

  if (!supabaseConfigured()) return null;
  try {
    const rows = await selectRows("investment_assets", {
      select: "*",
      symbol: `eq.${normalized}`,
      enabled: "eq.true",
      limit: "1"
    });
    if (!Array.isArray(rows) || !rows[0]) return null;
    return mapAssetRow(rows[0]);
  } catch {
    return null;
  }
}

function mapAssetRow(row: Payload): InvestmentAsset {
  const symbol = normalizeSymbol(rowString(row, "symbol"));
  return {
    symbol,
    name: rowString(row, "name") || symbol,
    type: alphaTypeToAssetType(rowString(row, "asset_type")),
    theme: rowString(row, "theme") || "US-listed asset",
    referencePrice: rowNumber(row, "reference_price"),
    region: rowString(row, "region") || "United States",
    currency: rowString(row, "currency") || "USD",
    exchange: rowNullableString(row, "exchange"),
    featured: Boolean(row.featured)
  };
}

async function upsertInvestmentAsset(asset: InvestmentAsset) {
  if (!supabaseConfigured()) return null;
  return upsertRow(
    "investment_assets",
    {
      symbol: normalizeSymbol(asset.symbol),
      name: asset.name,
      asset_type: asset.type,
      theme: asset.theme || "US-listed asset",
      region: asset.region ?? "United States",
      currency: asset.currency ?? "USD",
      exchange: asset.exchange ?? null,
      reference_price: asset.referencePrice ?? 0,
      featured: Boolean(asset.featured),
      enabled: true
    },
    "symbol"
  );
}

function featuredAssetSearchResults(): InvestmentAssetSearchResult[] {
  return INVESTMENT_ASSETS.map((asset, index) => ({
    ...asset,
    matchScore: 1 - index / 100,
    latestClose: asset.referencePrice,
    priceAvailable: false,
    priceDate: null
  }));
}

async function attachCachedPricesToSearchResults(results: InvestmentAssetSearchResult[]) {
  if (!results.length || !supabaseConfigured()) return results;

  const enriched = await Promise.all(
    results.map(async (asset) => {
      const cached = await getCachedPrice(asset.symbol);
      if (!cached) return asset;
      return {
        ...asset,
        latestClose: cached.latestClose,
        priceAvailable: cached.priceAvailable,
        priceDate: cached.priceDate,
        referencePrice: cached.latestClose || asset.referencePrice
      };
    })
  );

  return enriched;
}

function mapAlphaSearchMatch(match: Payload): InvestmentAssetSearchResult | null {
  const symbol = normalizeSymbol(String(match["1. symbol"] ?? ""));
  if (!isSupportedSymbol(symbol)) return null;
  const region = String(match["4. region"] ?? "").trim();
  const currency = String(match["8. currency"] ?? "").trim();
  const type = alphaTypeToAssetType(match["3. type"]);
  return {
    symbol,
    name: sanitizeAssetName(match["2. name"], symbol),
    type,
    theme: type === "ETF" ? "Exchange-traded fund" : "US-listed company",
    referencePrice: getInvestmentAsset(symbol)?.referencePrice ?? 0,
    region,
    currency,
    exchange: null,
    featured: Boolean(getInvestmentAsset(symbol)?.featured),
    matchScore: Number(match["9. matchScore"] ?? 0),
    priceAvailable: false,
    latestClose: null,
    priceDate: null
  };
}

async function ensureDefaultCompetition(slug = DEFAULT_INVESTMENT_COMPETITION_SLUG) {
  const rows = await upsertRow(
    "investment_competitions",
    {
      slug,
      title: "Phronesia Investment Challenge",
      status: "active",
      starting_cash: INVESTMENT_STARTING_CASH,
      updated_at: new Date().toISOString()
    },
    "slug"
  );
  if (!Array.isArray(rows) || !rows[0]) return null;
  return { id: rowString(rows[0], "id"), slug: rowString(rows[0], "slug") };
}

async function upsertInvestmentDailyPrice(price: {
  symbol: string;
  priceDate: string;
  closePrice: number;
  adjustedClosePrice: number;
  volume: number;
  provider: string;
  raw: unknown;
}) {
  if (!supabaseConfigured()) return null;
  const payload = {
    symbol: price.symbol,
    price_date: price.priceDate,
    trading_day: price.priceDate,
    close_price: price.closePrice,
    adjusted_close_price: price.adjustedClosePrice,
    volume: price.volume,
    provider: price.provider,
    raw: price.raw,
    raw_source: price.raw,
    fetched_at: new Date().toISOString()
  };
  try {
    return await upsertRow("investment_daily_prices", payload, "symbol,price_date");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/trading_day|raw_source|schema cache|column/i.test(message)) throw error;
    const { trading_day: _tradingDay, raw_source: _rawSource, ...legacyPayload } = payload;
    return upsertRow("investment_daily_prices", legacyPayload, "symbol,price_date");
  }
}

async function getStoredLatestPrice(symbol: string) {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await selectRows("investment_daily_prices", {
      select: "symbol,price_date,close_price,provider",
      symbol: `eq.${symbol}`,
      order: "price_date.desc",
      limit: "1"
    });
    if (!Array.isArray(rows) || !rows[0]) return null;
    return {
      latestClose: rowNumber(rows[0], "close_price"),
      priceDate: rowString(rows[0], "price_date"),
      provider: rowString(rows[0], "provider") || "stored",
      priceAvailable: true
    };
  } catch {
    return null;
  }
}

async function getAccountRow(accountId: string) {
  const rows = await selectRows("investment_accounts", {
    select: "*",
    id: `eq.${accountId}`,
    limit: "1"
  });
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function getHoldingRow(accountId: string, symbol: string) {
  const rows = await selectRows("investment_holdings", {
    select: "*",
    account_id: `eq.${accountId}`,
    symbol: `eq.${symbol}`,
    limit: "1"
  });
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function buildInvestmentAccountView(accountId: string, priceMapInput?: Map<string, number>): Promise<InvestmentAccountView | null> {
  const account = await getAccountRow(accountId);
  if (!account) return null;
  const [holdingsRows, quotes, thesisRows, previousSnapshotValue, assets] = await Promise.all([
    selectRows("investment_holdings", { select: "*", account_id: `eq.${accountId}`, order: "symbol.asc" }),
    priceMapInput ? Promise.resolve(null) : listInvestmentAssetQuotes(),
    selectRows("investment_theses", { select: "*", account_id: `eq.${accountId}`, limit: "1" }),
    getPreviousSnapshotTotal(accountId),
    listInvestmentAssets()
  ]);
  const tradesRows = await selectRows("investment_trades", {
    select: "*",
    account_id: `eq.${accountId}`,
    order: "created_at.desc",
    limit: "8"
  });

  const quoteList = quotes ?? assets.map((asset) => ({
    ...asset,
    latestClose: priceMapInput?.get(asset.symbol) ?? asset.referencePrice,
    priceDate: null,
    provider: priceMapInput?.has(asset.symbol) ? "stored" : "educational_reference",
    priceAvailable: Boolean(priceMapInput?.has(asset.symbol)),
    priceSource: priceMapInput?.has(asset.symbol) ? ("cache" as const) : ("reference" as const),
    priceMessage: priceMapInput?.has(asset.symbol)
      ? "Using latest saved close price."
      : "Latest close not saved yet. Click Refresh featured prices."
  }));
  const priceMap = new Map(quoteList.map((quote) => [quote.symbol, quote.latestClose]));
  const holdingViews = Array.isArray(holdingsRows)
    ? holdingsRows
        .filter((row) => rowNumber(row, "quantity") > 0)
        .map((row) => {
          const symbol = rowString(row, "symbol");
          const asset = quoteList.find((quote) => quote.symbol === symbol) ?? getInvestmentAsset(symbol);
          const latestClose = priceMap.get(symbol) ?? asset?.referencePrice ?? 0;
          const quantity = rowNumber(row, "quantity");
          const averageBuyPrice = rowNumber(row, "average_buy_price");
          const marketValue = quantity * latestClose;
          return {
            symbol,
            assetName: asset?.name ?? symbol,
            assetType: asset?.type ?? "Stock",
            quantity,
            averageBuyPrice,
            latestClose,
            priceDate: quoteList.find((quote) => quote.symbol === symbol)?.priceDate ?? null,
            marketValue,
            unrealizedGainLoss: (latestClose - averageBuyPrice) * quantity,
            weight: 0
          };
        })
    : [];

  const cash = rowNumber(account, "cash", INVESTMENT_STARTING_CASH);
  const startingCash = rowNumber(account, "starting_cash", INVESTMENT_STARTING_CASH);
  const holdingsValue = holdingViews.reduce((sum, holding) => sum + holding.marketValue, 0);
  const totalValue = cash + holdingsValue;
  const dailyChange = previousSnapshotValue ? ((totalValue - previousSnapshotValue) / previousSnapshotValue) * 100 : 0;
  holdingViews.forEach((holding) => {
    holding.weight = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
  });

  const thesisRow = Array.isArray(thesisRows) && thesisRows[0] ? thesisRows[0] : null;
  return {
    account: {
      id: rowString(account, "id"),
      competitionId: rowString(account, "competition_id"),
      teamName: rowString(account, "team_name"),
      participantLogin: rowNullableString(account, "participant_login"),
      startingCash,
      cash
    },
    holdings: holdingViews,
    trades: Array.isArray(tradesRows) ? tradesRows.map(mapTradeRow) : [],
    thesis: thesisRow
      ? {
          thesis: rowString(thesisRow, "thesis"),
          risks: rowString(thesisRow, "risks"),
          diversificationLogic: rowString(thesisRow, "diversification_logic"),
          macroView: rowString(thesisRow, "macro_view"),
          thesisScore: rowNumber(thesisRow, "thesis_score")
        }
      : null,
    quotes: quoteList,
    portfolio: {
      startingCash,
      cash,
      holdingsValue,
      totalValue,
      dailyChange,
      totalReturn: startingCash > 0 ? ((totalValue - startingCash) / startingCash) * 100 : 0,
      diversificationScore: calculateDiversificationScore(holdingViews, totalValue),
      riskScore: calculateRiskScore(holdingViews, totalValue)
    },
    marketStatus: getMarketStatus()
  };
}

function calculateDiversificationScore(holdings: InvestmentHoldingView[], totalValue: number) {
  if (!holdings.length) return 0;
  const maxWeight = holdings.reduce((max, holding) => Math.max(max, totalValue > 0 ? holding.marketValue / totalValue : 0), 0);
  const concentrationPenalty = maxWeight <= 0.2 ? 0 : ((maxWeight - 0.2) / 0.8) * 100;
  const assetCountBonus = Math.min(20, holdings.length * 4);
  return clampScore(100 - concentrationPenalty + assetCountBonus - 20);
}

function calculateRiskScore(holdings: InvestmentHoldingView[], totalValue: number) {
  if (!holdings.length || totalValue <= 0) return 0;
  const singleStockWeight = holdings
    .filter((holding) => holding.assetType === "Stock")
    .reduce((sum, holding) => sum + holding.marketValue / totalValue, 0);
  const maxWeight = holdings.reduce((max, holding) => Math.max(max, holding.marketValue / totalValue), 0);
  return clampScore(100 - singleStockWeight * 45 - Math.max(0, maxWeight - 0.2) * 120);
}

function mapTradeRow(row: Payload): InvestmentTradeView {
  return {
    id: rowString(row, "id"),
    createdAt: rowString(row, "created_at"),
    executedAt: rowNullableString(row, "executed_at"),
    symbol: rowString(row, "symbol"),
    side: rowString(row, "side"),
    quantity: rowNumber(row, "quantity"),
    price: rowNumber(row, "price"),
    grossValue: rowNumber(row, "gross_value", rowNumber(row, "gross_amount")),
    feeRate: rowNumber(row, "fee_rate", INVESTMENT_TRANSACTION_FEE_RATE),
    feeAmount: rowNumber(row, "fee_amount"),
    netValue: rowNumber(row, "net_value", Math.abs(rowNumber(row, "net_amount"))),
    priceDate: rowNullableString(row, "price_date"),
    priceSource: rowNullableString(row, "price_source"),
    rejected: Boolean(row.rejected),
    rejectReason: rowNullableString(row, "reject_reason")
  };
}

function scoreThesis(input: { thesis: string; risks: string; diversificationLogic: string; macroView: string }) {
  const fields = [input.thesis, input.risks, input.diversificationLogic, input.macroView].map((value) => value.trim());
  const completeness = fields.filter(Boolean).length * 18;
  const depth = fields.reduce((sum, value) => sum + Math.min(7, Math.floor(value.length / 120)), 0);
  return clampScore(completeness + depth);
}

async function upsertHolding(accountId: string, symbol: string, quantity: number, averageBuyPrice: number, realizedGainLoss: number) {
  return upsertRow(
    "investment_holdings",
    {
      account_id: accountId,
      symbol,
      quantity,
      average_buy_price: averageBuyPrice,
      realized_gain_loss: realizedGainLoss,
      updated_at: new Date().toISOString()
    },
    "account_id,symbol"
  );
}

async function saveTrade(
  account: Payload,
  symbol: string,
  side: TradeSide,
  quantity: number,
  price: number,
  gross: number,
  fee: number,
  net: number,
  priceDate: string | null,
  priceSource: string | undefined
) {
  const executedAt = new Date().toISOString();
  return insertInvestmentTrade({
    account_id: rowString(account, "id"),
    competition_id: rowString(account, "competition_id"),
    symbol,
    side,
    quantity,
    price,
    gross_amount: gross,
    gross_value: gross,
    fee_rate: INVESTMENT_TRANSACTION_FEE_RATE,
    fee_amount: fee,
    net_amount: net,
    net_value: net,
    price_date: priceDate,
    price_source: priceSource ?? null,
    executed_at: executedAt,
    rejected: false,
    reject_reason: null,
    trade_date: todayIsoInEt(),
    created_at: executedAt
  });
}

async function rejectTrade(account: Payload, symbol: string, side: string, quantity: number, reason: string) {
  if (account && rowString(account, "id")) {
    const executedAt = new Date().toISOString();
    await insertInvestmentTrade({
      account_id: rowString(account, "id"),
      competition_id: rowString(account, "competition_id"),
      symbol: symbol || "UNKNOWN",
      side: side === "sell" ? "sell" : "buy",
      quantity: Number.isFinite(quantity) ? quantity : 0,
      price: null,
      gross_amount: null,
      gross_value: null,
      fee_rate: INVESTMENT_TRANSACTION_FEE_RATE,
      fee_amount: null,
      net_amount: null,
      net_value: null,
      price_date: null,
      price_source: null,
      executed_at: executedAt,
      rejected: true,
      reject_reason: reason,
      trade_date: todayIsoInEt(),
      created_at: executedAt
    });
  }
  return { ok: false as const, reason };
}

async function insertInvestmentTrade(payload: Payload) {
  try {
    return await insertRow("investment_trades", payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/gross_value|fee_rate|net_value|price_date|price_source|executed_at|schema cache|column/i.test(message)) {
      throw error;
    }
    const legacyPayload = { ...payload };
    delete legacyPayload.gross_value;
    delete legacyPayload.fee_rate;
    delete legacyPayload.net_value;
    delete legacyPayload.price_date;
    delete legacyPayload.price_source;
    delete legacyPayload.executed_at;
    return insertRow("investment_trades", legacyPayload);
  }
}

async function upsertPortfolioSnapshot(view: InvestmentAccountView) {
  return upsertRow(
    "investment_portfolio_snapshots",
    {
      account_id: view.account.id,
      competition_id: view.account.competitionId,
      snapshot_date: todayIsoInEt(),
      cash: view.portfolio.cash,
      holdings_value: view.portfolio.holdingsValue,
      total_value: view.portfolio.totalValue,
      daily_change: view.portfolio.dailyChange,
      total_return: view.portfolio.totalReturn,
      diversification_score: view.portfolio.diversificationScore,
      created_at: new Date().toISOString()
    },
    "account_id,snapshot_date"
  );
}

async function listSnapshots(accountId: string) {
  const rows = await selectRows("investment_portfolio_snapshots", {
    select: "*",
    account_id: `eq.${accountId}`,
    order: "snapshot_date.asc",
    limit: "260"
  });
  return Array.isArray(rows) ? rows : [];
}

async function getPreviousSnapshotTotal(accountId: string) {
  if (!supabaseConfigured()) return 0;
  const rows = await selectRows("investment_portfolio_snapshots", {
    select: "snapshot_date,total_value",
    account_id: `eq.${accountId}`,
    order: "snapshot_date.desc",
    limit: "5"
  });
  if (!Array.isArray(rows)) return 0;
  const today = todayIsoInEt();
  const previous = rows.find((row) => rowString(row, "snapshot_date") !== today);
  return previous ? rowNumber(previous, "total_value") : 0;
}

function calculateMaxDrawdown(snapshots: Payload[], currentValue: number) {
  const values = snapshots.map((row) => rowNumber(row, "total_value")).filter((value) => value > 0);
  if (currentValue > 0) values.push(currentValue);
  if (!values.length) return 0;
  let peak = values[0];
  let maxDrawdown = 0;
  for (const value of values) {
    peak = Math.max(peak, value);
    const drawdown = peak > 0 ? ((value - peak) / peak) * 100 : 0;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }
  return maxDrawdown;
}

function mapLeaderboardRow(row: Payload): InvestmentLeaderboardRow {
  return {
    rank: rowNumber(row, "rank_position"),
    accountId: rowString(row, "account_id"),
    competitionId: rowString(row, "competition_id"),
    teamName: rowString(row, "team_name"),
    totalValue: rowNumber(row, "total_value"),
    totalReturn: rowNumber(row, "total_return"),
    riskAdjustedScore: rowNumber(row, "risk_adjusted_score"),
    diversificationScore: rowNumber(row, "diversification_score"),
    thesisScore: rowNumber(row, "thesis_score"),
    drawdownScore: rowNumber(row, "drawdown_score"),
    overallScore: rowNumber(row, "overall_score"),
    updatedAt: rowString(row, "updated_at")
  };
}
