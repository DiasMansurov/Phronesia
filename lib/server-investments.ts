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
import { pbkdf2, randomBytes, randomUUID, timingSafeEqual } from "crypto";
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
  competition: InvestmentCompetitionView;
  holdings: InvestmentHoldingView[];
  positions: InvestmentPositionView[];
  trades: InvestmentTradeView[];
  thesis: InvestmentThesisView | null;
  quotes: InvestmentAssetQuote[];
  portfolio: InvestmentPortfolioSummary;
  portfolioDebug: InvestmentPortfolioDebug;
  marketStatus: InvestmentMarketStatus;
  currentRank: InvestmentLeaderboardRow | null;
};

export type InvestmentCompetitionRuntimeStatus = "not_started" | "active" | "closed";

export type InvestmentCompetitionView = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  startingCash: number;
  startAt: string | null;
  endAt: string | null;
  status: string;
  runtimeStatus: InvestmentCompetitionRuntimeStatus;
  transactionFee: number;
  rankingMethod: string;
  isTeenvestor: boolean;
  welcomeMessage: string | null;
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
  priceWarning?: string | null;
};

export type InvestmentPortfolioSummary = {
  startingCash: number;
  cash: number;
  holdingsValue: number;
  lockedMargin: number;
  totalExposure: number;
  unrealizedPnl: number;
  holdingsUnrealizedPnl: number;
  totalUnrealizedPnl: number;
  openPositionValue: number;
  totalValue: number;
  dailyChange: number;
  totalReturn: number;
  diversificationScore: number;
  riskScore: number;
  formulaBreakdown: InvestmentPortfolioFormulaBreakdown;
};

export type InvestmentPortfolioFormulaBreakdown = {
  cash: number;
  normalHoldingsValue: number;
  lockedMargin: number;
  openExposure: number;
  holdingsUnrealizedPnl: number;
  positionsUnrealizedPnl: number;
  totalUnrealizedPnl: number;
  openPositionValue: number;
  totalPortfolioValue: number;
  profitLoss: number;
  returnPercent: number;
};

export type InvestmentPortfolioDebug = {
  cashBalance: number;
  legacyHoldingsCount: number;
  legacyHoldingsValue: number;
  openPositionsCount: number;
  lockedMargin: number;
  openExposure: number;
  holdingsUnrealizedPnl: number;
  unrealizedPnl: number;
  totalUnrealizedPnl: number;
  openPositionValue: number;
  calculatedPortfolioValue: number;
  formulaBreakdown: InvestmentPortfolioFormulaBreakdown;
  pricesUsed: Array<{
    symbol: string;
    price: number | null;
    source: string;
    priceDate: string | null;
    fetchedAt: string | null;
  }>;
};

export type InvestmentPositionView = {
  id: string;
  symbol: string;
  assetName: string;
  side: "long" | "short";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  marginLocked: number;
  exposureValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  status: "open" | "closed" | "liquidated";
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
  priceWarning?: string | null;
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
  teamId: string;
  competitionId: string;
  competitionCode?: string;
  teamName: string;
  startingCash: number;
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  profitLoss: number;
  totalReturn: number;
  tradeCount: number;
  riskAdjustedScore: number;
  diversificationScore: number;
  riskScore: number;
  thesisScore: number;
  drawdownScore: number;
  overallScore: number;
  status: string;
  updatedAt: string;
};

export type InvestmentTradeView = {
  id: string;
  createdAt: string;
  executedAt: string | null;
  positionId: string | null;
  action: string | null;
  symbol: string;
  assetName: string;
  side: string;
  quantity: number;
  price: number;
  grossValue: number;
  feeRate: number;
  feeAmount: number;
  netValue: number;
  leverage: number | null;
  marginUsed: number | null;
  exposureValue: number | null;
  realizedPnl: number | null;
  priceDate: string | null;
  priceSource: string | null;
  priceTimestamp: string | null;
  rejected: boolean;
  rejectReason: string | null;
};

export type InvestmentAdminTeamResult = {
  rank: number;
  teamId: string;
  competitionId: string;
  competitionCode: string;
  teamName: string;
  startingCash: number;
  cashBalance: number;
  holdingsValue: number;
  lockedMargin: number;
  totalExposure: number;
  unrealizedPnl: number;
  holdingsUnrealizedPnl: number;
  positionsUnrealizedPnl: number;
  totalUnrealizedPnl: number;
  openPositionValue: number;
  totalPortfolioValue: number;
  formulaBreakdown: InvestmentPortfolioFormulaBreakdown;
  portfolioDebug: InvestmentPortfolioDebug;
  profitLoss: number;
  returnPercent: number;
  tradesCount: number;
  holdingsCount: number;
  openPositionsCount: number;
  lastActivity: string | null;
  status: string;
};

export type InvestmentAdminPositionResult = InvestmentPositionView & {
  marketValue: number;
};

export type InvestmentAdminHoldingResult = {
  symbol: string;
  assetName: string;
  quantity: number;
  averageBuyPrice: number;
  latestPrice: number | null;
  priceDate: string | null;
  marketValue: number | null;
  unrealizedProfitLoss: number | null;
  allocationPercent: number;
  priceWarning: string | null;
};

export type InvestmentAdminTradeResult = InvestmentTradeView & {
  teamName: string;
};

export type InvestmentAdminResultsBundle = {
  persisted: boolean;
  competition: InvestmentCompetitionView | null;
  teams: InvestmentAdminTeamResult[];
  stats: {
    totalTeams: number;
    totalTrades: number;
    averageReturn: number;
    bestTeam: string;
    totalSimulatedPortfolioValue: number;
    competitionStatus: string;
  };
};

export type InvestmentAdminTeamDetail = {
  persisted: boolean;
  competition: InvestmentCompetitionView | null;
  overview: (InvestmentAdminTeamResult & {
    createdAt: string | null;
    lastLoginAt: string | null;
    updatedAt: string | null;
  }) | null;
  holdings: InvestmentAdminHoldingResult[];
  positions: InvestmentAdminPositionResult[];
  trades: InvestmentAdminTradeResult[];
};

export type InvestmentTeamSessionView = {
  account: InvestmentAccountView;
  competition: InvestmentCompetitionView;
  created: boolean;
  message: string;
};

export type InvestmentTeamAccessDiagnostics = {
  steps: Record<string, number>;
  supabaseErrorMessage: string | null;
  supabaseErrorCode: string | null;
  finalErrorReason: string | null;
};

const MARKET_CLOSED_MESSAGE =
  "US market is closed. Latest cached stock prices are still shown. Trading reopens at 9:30 AM ET.";

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;
const TEENVESTOR_CODE = "Teenvestor.school";
const TEENVESTOR_SLUG = "teenvestor-school";
const MARKETDATA_APP_PROVIDER = "marketdata_app";
const MARKETDATA_STOCK_PRICE_ENDPOINT = "stocks/quotes";
const MARKETDATA_CACHE_FRESH_MS = 15 * 60 * 1000;
const MARKETDATA_PROVIDER_MAX_AGE_MS = 30 * 60 * 1000;
const TEAM_PASSWORD_ITERATIONS = 50000;
const MAX_MARKETDATA_SYMBOLS_PER_CRON = Math.max(1, Number(process.env.MAX_MARKETDATA_SYMBOLS_PER_CRON ?? "50") || 50);
type PriceSource = "live" | "cache" | "marketdata_app" | "alpha_vantage" | "yahoo_finance" | "reference" | "unavailable";
type PriceFailureCode = "rate_limit" | "symbol_not_found" | "price_unavailable" | "stale_price" | "temporary_unavailable";
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
      responseTextPreview?: string | null;
      providerTradingDay?: string | null;
      providerUpdatedAt?: string | null;
      providerUpdatedAtEt?: string | null;
      isProviderStale?: false;
      staleReason?: null;
      canTrade?: boolean;
    }
  | {
      ok: false;
      symbol: string;
      provider: string;
      code: PriceFailureCode;
      message: string;
      raw?: unknown;
      responseTextPreview?: string | null;
      providerTradingDay?: string | null;
      providerUpdatedAt?: string | null;
      providerUpdatedAtEt?: string | null;
      isProviderStale?: boolean;
      staleReason?: string | null;
      canTrade?: boolean;
    };

export type LatestClosePriceResult = {
  symbol: string;
  price: number | null;
  tradingDay: string | null;
  source: "cache" | "marketdata_app" | "alpha_vantage" | "yahoo_finance" | null;
  cached: boolean;
  error: string | null;
  fetchedAt?: string | null;
};

export type InvestmentPriceDebugResult = {
  symbol: string;
  provider: string;
  hasMarketDataApiKey: boolean;
  runtime?: string | null;
  nodeVersion?: string | null;
  cacheFound: boolean;
  cachedPrice: number | null;
  cachedFetchedAt: string | null;
  cacheFresh: boolean;
  currentNyseDate?: string;
  providerTradingDay?: string | null;
  providerUpdatedAtET?: string | null;
  isProviderStale?: boolean;
  staleReason?: string | null;
  canTrade?: boolean;
  calledMarketDataApp: boolean;
  endpointUsed?: string | null;
  requestUrlWithoutToken?: string | null;
  httpStatus?: number | null;
  responseOk?: boolean | null;
  marketDataAppStatus: string;
  parsedFields?: {
    symbol: string | null;
    last: number | null;
    mid: number | null;
    bid: number | null;
    ask: number | null;
    updated: number | string | null;
  } | null;
  parsedPrice?: number | null;
  finalPrice: number | null;
  tradingDay: string | null;
  source: "cache" | "marketdata_app" | "alpha_vantage" | "yahoo_finance" | null;
  responseTextPreview?: string | null;
  errorName?: string | null;
  errorMessage?: string | null;
  errorCause?: string | null;
  errorStackPreview?: string | null;
  bearerAttempt?: MarketDataAttemptDiagnostics;
  queryTokenAttempt?: MarketDataAttemptDiagnostics;
  error: string | null;
};

export type MarketDataAttemptDiagnostics = {
  attempted: boolean;
  httpStatus: number | null;
  responseOk: boolean | null;
  responseTextPreview: string | null;
  errorName: string | null;
  errorMessage: string | null;
  errorCause: string | null;
  errorStackPreview?: string | null;
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

function latestIso(...values: Array<string | null | undefined>) {
  let latest: string | null = null;
  let latestTime = 0;
  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (!Number.isFinite(time) || time <= latestTime) continue;
    latest = value;
    latestTime = time;
  }
  return latest;
}

function deriveTeamPasswordHash(password: string, salt: string, iterations: number) {
  return new Promise<Buffer>((resolve, reject) => {
    pbkdf2(password, salt, iterations, 32, "sha256", (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashTeamPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await deriveTeamPasswordHash(password, salt, TEAM_PASSWORD_ITERATIONS)).toString("hex");
  return `pbkdf2_sha256$${TEAM_PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

async function verifyTeamPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [scheme, iterationsRaw, salt, expectedHash] = storedHash.split("$");
  if (scheme !== "pbkdf2_sha256" || !iterationsRaw || !salt || !expectedHash) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  const actualHash = await deriveTeamPasswordHash(password, salt, iterations);
  const expected = Buffer.from(expectedHash, "hex");
  if (actualHash.length !== expected.length) return false;
  return timingSafeEqual(actualHash, expected);
}

function formatTradeUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function normalizeInvestmentTeamDisplayName(teamName: string) {
  return teamName.trim().replace(/\s+/g, " ").slice(0, 96);
}

function normalizeInvestmentTeamNameKey(teamName: string) {
  return normalizeInvestmentTeamDisplayName(teamName).toLowerCase();
}

function competitionCodeToSlug(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return DEFAULT_INVESTMENT_COMPETITION_SLUG;
  return trimmed
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || DEFAULT_INVESTMENT_COMPETITION_SLUG;
}

function displayCompetitionCode(input?: string | null) {
  const value = input?.trim();
  if (!value) return DEFAULT_INVESTMENT_COMPETITION_SLUG;
  return competitionCodeToSlug(value) === TEENVESTOR_SLUG ? TEENVESTOR_CODE : value.slice(0, 96);
}

function competitionDisplayName(code: string) {
  return competitionCodeToSlug(code) === TEENVESTOR_SLUG
    ? "Teenvestor Investment Competition"
    : code === DEFAULT_INVESTMENT_COMPETITION_SLUG
      ? "Phronesia Investment Challenge"
      : `${code} Investment Competition`;
}

function nullableIso(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function runtimeStatusForCompetition(row: Payload | InvestmentCompetitionView): InvestmentCompetitionRuntimeStatus {
  const rawStatus = "runtimeStatus" in row ? row.runtimeStatus : String(row.status ?? "active");
  if (rawStatus === "closed" || rawStatus === "archived") return "closed";
  if (rawStatus === "draft") return "not_started";
  const startAt = ("startAt" in row ? row.startAt : nullableIso(row.start_at) ?? nullableIso(row.starts_at)) as string | null;
  const endAt = ("endAt" in row ? row.endAt : nullableIso(row.end_at) ?? nullableIso(row.ends_at)) as string | null;
  const now = Date.now();
  if (startAt && now < Date.parse(startAt)) return "not_started";
  if (endAt && now > Date.parse(endAt)) return "closed";
  return "active";
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

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function getMarketDataApiKey() {
  return process.env.MARKET_DATA_API_KEY?.trim() ?? "";
}

function preferredMarketDataProvider() {
  return (process.env.MARKET_DATA_PROVIDER ?? MARKETDATA_APP_PROVIDER).trim().toLowerCase();
}

function marketDataAppUrl(path: string, params: Record<string, string> = {}) {
  const apiKey = getMarketDataApiKey();
  const search = new URLSearchParams(params);
  if (apiKey) search.set("token", apiKey);
  return `https://api.marketdata.app/v1/${path}${search.size ? `?${search.toString()}` : ""}`;
}

function marketDataAppUrlWithoutToken(path: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams(params);
  return `https://api.marketdata.app/v1/${path}${search.size ? `?${search.toString()}` : ""}`;
}

function marketDataAppQueryUrlWithoutToken(path: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams(params);
  search.set("token", "[redacted]");
  return `https://api.marketdata.app/v1/${path}${search.size ? `?${search.toString()}` : ""}`;
}

function marketDataAppStockPriceUrl(symbol: string) {
  return marketDataAppUrl(`${MARKETDATA_STOCK_PRICE_ENDPOINT}/${encodeURIComponent(normalizeSymbol(symbol))}/`);
}

export function marketDataAppStockPriceUrlWithoutToken(symbol: string) {
  return `https://api.marketdata.app/v1/${MARKETDATA_STOCK_PRICE_ENDPOINT}/${encodeURIComponent(normalizeSymbol(symbol))}/?token=[redacted]`;
}

function parseMarketDataTimestamp(value: unknown) {
  const raw = firstValue(value);
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const milliseconds = raw > 10_000_000_000 ? raw : raw * 1000;
    return new Date(milliseconds);
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function formatProviderUpdatedAtEt(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short"
  }).format(date);
}

function validateMarketDataFreshness(updatedValue: unknown, now = new Date()) {
  const marketStatus = getMarketStatus(now);
  const updatedAt = parseMarketDataTimestamp(updatedValue);
  const providerTradingDay = updatedAt ? todayIsoInEt(updatedAt) : null;
  const providerUpdatedAt = updatedAt?.toISOString() ?? null;
  const providerUpdatedAtEt = formatProviderUpdatedAtEt(updatedAt);
  let staleReason: string | null = null;

  if (!updatedAt || !providerTradingDay) {
    staleReason = "The provider did not return a valid updated timestamp.";
  } else if (updatedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    staleReason = "The provider timestamp is in the future.";
  } else if (marketStatus.isOpen && providerTradingDay !== marketStatus.etDate) {
    staleReason = `Provider quote is from ${providerTradingDay}, not the current NYSE date ${marketStatus.etDate}.`;
  } else if (marketStatus.isOpen && now.getTime() - updatedAt.getTime() > MARKETDATA_PROVIDER_MAX_AGE_MS) {
    staleReason = "The provider quote is older than 30 minutes during NYSE market hours.";
  }

  return {
    currentNyseDate: marketStatus.etDate,
    providerTradingDay,
    providerUpdatedAt,
    providerUpdatedAtEt,
    isProviderStale: Boolean(staleReason),
    staleReason,
    canTrade: marketStatus.isOpen && !staleReason
  };
}

function marketDataFailure(
  symbol: string,
  message: string,
  code: PriceFailureCode = "temporary_unavailable",
  raw?: unknown,
  responseTextPreview?: string | null
): Extract<MarketPriceResult, { ok: false }> {
  return {
    ok: false,
    symbol: normalizeSymbol(symbol),
    provider: MARKETDATA_APP_PROVIDER,
    code,
    message,
    raw,
    responseTextPreview: responseTextPreview ?? null
  };
}

function safeResponsePreview(text: string) {
  const apiKey = getMarketDataApiKey();
  return (apiKey ? text.replaceAll(apiKey, "[redacted]") : text).slice(0, 600);
}

function safeDiagnosticText(value: unknown, maxLength = 800) {
  if (value === null || value === undefined) return null;
  let text: string;
  if (typeof value === "string") {
    text = value;
  } else if (value instanceof Error) {
    text = `${value.name}: ${value.message}`;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  return safeResponsePreview(text).slice(0, maxLength);
}

function serializeFetchError(error: unknown) {
  const typed = error as (Error & { cause?: unknown }) | undefined;
  return {
    errorName: typed instanceof Error ? typed.name : "FetchError",
    errorMessage: typed instanceof Error ? typed.message : "fetch failed",
    errorCause: safeDiagnosticText(typed?.cause ?? null),
    errorStackPreview: safeDiagnosticText(typed?.stack ?? null)
  };
}

function skippedMarketDataAttempt(): MarketDataAttemptDiagnostics {
  return {
    attempted: false,
    httpStatus: null,
    responseOk: null,
    responseTextPreview: null,
    errorName: null,
    errorMessage: null,
    errorCause: null
  };
}

type MarketDataFetchAttemptResult = {
  diagnostics: MarketDataAttemptDiagnostics;
  responseText: string | null;
  data: Payload | null;
};

type MarketDataFetchResult = {
  requestUrlWithoutToken: string;
  usedAuth: "bearer" | "queryToken" | null;
  bearerAttempt: MarketDataAttemptDiagnostics;
  queryTokenAttempt: MarketDataAttemptDiagnostics;
  httpStatus: number | null;
  responseOk: boolean | null;
  responseText: string | null;
  responseTextPreview: string | null;
  data: Payload | null;
  errorName: string | null;
  errorMessage: string | null;
  errorCause: string | null;
  errorStackPreview: string | null;
};

async function attemptMarketDataFetch(url: string, init: RequestInit): Promise<MarketDataFetchAttemptResult> {
  try {
    const response = await fetch(url, init);
    const responseText = await response.text();
    const responseTextPreview = safeResponsePreview(responseText);
    return {
      diagnostics: {
        attempted: true,
        httpStatus: response.status,
        responseOk: response.ok,
        responseTextPreview,
        errorName: null,
        errorMessage: null,
        errorCause: null
      },
      responseText,
      data: parseJsonPayload(responseText)
    };
  } catch (error) {
    const serialized = serializeFetchError(error);
    return {
      diagnostics: {
        attempted: true,
        httpStatus: null,
        responseOk: null,
        responseTextPreview: null,
        ...serialized
      },
      responseText: null,
      data: null
    };
  }
}

function isSuccessfulMarketDataAttempt(attempt: MarketDataFetchAttemptResult) {
  if (!attempt.diagnostics.responseOk || !attempt.data) return false;
  return String(firstValue(attempt.data.s ?? attempt.data.status) ?? "").toLowerCase() === "ok";
}

async function fetchMarketDataApp(path: string, params: Record<string, string> = {}): Promise<MarketDataFetchResult> {
  const apiKey = getMarketDataApiKey();
  const requestUrlWithoutToken = marketDataAppQueryUrlWithoutToken(path, params);
  const bearerUrl = marketDataAppUrlWithoutToken(path, params);
  const queryTokenUrl = marketDataAppUrl(path, params);

  const bearer = await attemptMarketDataFetch(bearerUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Phronesia/1.0"
    }
  });

  let usedAttempt = bearer;
  let usedAuth: MarketDataFetchResult["usedAuth"] = isSuccessfulMarketDataAttempt(bearer) ? "bearer" : null;
  let queryToken: MarketDataFetchAttemptResult = {
    diagnostics: skippedMarketDataAttempt(),
    responseText: null,
    data: null
  };

  if (!usedAuth) {
    queryToken = await attemptMarketDataFetch(queryTokenUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Phronesia/1.0"
      }
    });
    usedAttempt = queryToken;
    usedAuth = isSuccessfulMarketDataAttempt(queryToken) ? "queryToken" : null;
  }

  const serialized =
    usedAttempt.diagnostics.errorName || usedAttempt.diagnostics.errorMessage || usedAttempt.diagnostics.errorCause
      ? {
          errorName: usedAttempt.diagnostics.errorName,
          errorMessage: usedAttempt.diagnostics.errorMessage,
          errorCause: usedAttempt.diagnostics.errorCause,
          errorStackPreview: usedAttempt.diagnostics.errorStackPreview ?? null
        }
      : {
          errorName: null,
          errorMessage: null,
          errorCause: null,
          errorStackPreview: null
        };

  return {
    requestUrlWithoutToken,
    usedAuth,
    bearerAttempt: bearer.diagnostics,
    queryTokenAttempt: queryToken.diagnostics,
    httpStatus: usedAttempt.diagnostics.httpStatus,
    responseOk: usedAttempt.diagnostics.responseOk,
    responseText: usedAttempt.responseText,
    responseTextPreview: usedAttempt.diagnostics.responseTextPreview,
    data: usedAttempt.data,
    ...serialized
  };
}

function parseJsonPayload(text: string): Payload | null {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Payload;
  } catch {
    return null;
  }
}

function marketDataArrayField(data: Payload, key: string, index = 0) {
  const value = data[key];
  return Array.isArray(value) ? value[index] : value;
}

function parsedMarketDataFields(data: Payload, index = 0) {
  return {
    symbol: typeof marketDataArrayField(data, "symbol", index) === "string" ? String(marketDataArrayField(data, "symbol", index)) : null,
    last: parsePositiveNumber(marketDataArrayField(data, "last", index)),
    mid: parsePositiveNumber(marketDataArrayField(data, "mid", index)),
    bid: parsePositiveNumber(marketDataArrayField(data, "bid", index)),
    ask: parsePositiveNumber(marketDataArrayField(data, "ask", index)),
    updated: (marketDataArrayField(data, "updated", index) as number | string | null | undefined) ?? null
  };
}

function parseMarketDataStockPricePayload(data: Payload, requestedSymbol: string, index = 0, responseTextPreview?: string | null): MarketPriceResult {
  const status = String(firstValue(data.s ?? data.status) ?? "").toLowerCase();
  const providerMessage = String(firstValue(data.errmsg) ?? firstValue(data.error) ?? firstValue(data.message) ?? "").trim();
  if (status !== "ok") {
    const rateLimited = /limit|quota|credit|unauthorized|payment|required/i.test(providerMessage);
    return marketDataFailure(
      requestedSymbol,
      rateLimited
        ? "API credit limit reached. Using saved prices when available."
        : providerMessage || `MarketData.app returned status "${status || "missing"}".`,
      rateLimited ? "rate_limit" : "temporary_unavailable",
      data,
      responseTextPreview
    );
  }

  const parsedFields = parsedMarketDataFields(data, index);
  const symbol = normalizeSymbol(parsedFields.symbol ?? requestedSymbol);
  const price = parsedFields.last ?? parsedFields.mid ?? parsedFields.bid ?? parsedFields.ask;

  if (!price) {
    return marketDataFailure(symbol, "MarketData.app stock price unavailable for this asset.", "price_unavailable", data, responseTextPreview);
  }

  const updatedValue = parsedFields.updated ?? marketDataArrayField(data, "date", index) ?? marketDataArrayField(data, "time", index) ?? marketDataArrayField(data, "timestamp", index);
  const freshness = validateMarketDataFreshness(updatedValue);
  if (freshness.isProviderStale || !freshness.providerTradingDay || !freshness.providerUpdatedAt || !freshness.providerUpdatedAtEt) {
    return {
      ...marketDataFailure(
        symbol,
        "Fresh price is not available for this asset right now. Please try again later or choose another ticker.",
        "stale_price",
        data,
        responseTextPreview
      ),
      providerTradingDay: freshness.providerTradingDay,
      providerUpdatedAt: freshness.providerUpdatedAt,
      providerUpdatedAtEt: freshness.providerUpdatedAtEt,
      isProviderStale: true,
      staleReason: freshness.staleReason,
      canTrade: false
    };
  }

  const tradingDay = freshness.providerTradingDay;
  return {
    ok: true,
    symbol,
    priceDate: tradingDay,
    closePrice: price,
    adjustedClosePrice: price,
    volume: Number(marketDataArrayField(data, "volume", index) ?? 0),
    provider: MARKETDATA_APP_PROVIDER,
    source: MARKETDATA_APP_PROVIDER,
    message: `Latest MarketData.app stock quote from ${tradingDay}.`,
    raw: { endpoint: MARKETDATA_STOCK_PRICE_ENDPOINT, payload: data },
    responseTextPreview: responseTextPreview ?? null,
    providerTradingDay: tradingDay,
    providerUpdatedAt: freshness.providerUpdatedAt,
    providerUpdatedAtEt: freshness.providerUpdatedAtEt,
    isProviderStale: false,
    staleReason: null,
    canTrade: freshness.canTrade
  };
}

export async function getMarketDataStockPrice(symbol: string): Promise<MarketPriceResult> {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) return marketDataFailure(normalized, "Symbol not found.", "symbol_not_found");
  const apiKey = getMarketDataApiKey();
  if (!apiKey) return marketDataFailure(normalized, "MarketData.app API key is not configured.");

  const result = await fetchMarketDataApp(`${MARKETDATA_STOCK_PRICE_ENDPOINT}/${encodeURIComponent(normalized)}/`);
  if (!result.data) {
    return marketDataFailure(
      normalized,
      result.errorMessage ?? "MarketData.app returned a non-JSON response.",
      "temporary_unavailable",
      {
        bearerAttempt: result.bearerAttempt,
        queryTokenAttempt: result.queryTokenAttempt,
        errorName: result.errorName,
        errorCause: result.errorCause
      },
      result.responseTextPreview
    );
  }
  if (!result.responseOk) {
    const status = result.httpStatus ?? 0;
    return marketDataFailure(
      normalized,
      status === 404 ? "Symbol not found." : status === 402 || status === 429 ? "API credit limit reached. Using saved prices when available." : "Market data temporarily unavailable.",
      status === 404 ? "symbol_not_found" : status === 402 || status === 429 ? "rate_limit" : "temporary_unavailable",
      result.data,
      result.responseTextPreview
    );
  }
  return parseMarketDataStockPricePayload(result.data, normalized, 0, result.responseTextPreview);
}

export async function getMarketDataStockPrices(symbols: string[]): Promise<Record<string, MarketPriceResult>> {
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeSymbol).filter(isSupportedSymbol)));
  if (!uniqueSymbols.length) return {};
  const apiKey = getMarketDataApiKey();
  if (!apiKey) {
    return Object.fromEntries(uniqueSymbols.map((symbol) => [symbol, marketDataFailure(symbol, "MarketData.app API key is not configured.")]));
  }

  const response = await fetchMarketDataApp(`${MARKETDATA_STOCK_PRICE_ENDPOINT}/`, { symbols: uniqueSymbols.join(",") });
  if (!response.data) {
    return Object.fromEntries(
      uniqueSymbols.map((symbol) => [
        symbol,
        marketDataFailure(
          symbol,
          response.errorMessage ?? "MarketData.app returned a non-JSON response.",
          "temporary_unavailable",
          {
            bearerAttempt: response.bearerAttempt,
            queryTokenAttempt: response.queryTokenAttempt,
            errorName: response.errorName,
            errorCause: response.errorCause
          },
          response.responseTextPreview
        )
      ])
    );
  }
  if (!response.responseOk) {
    const reason = response.httpStatus === 402 || response.httpStatus === 429 ? "API credit limit reached. Using saved prices when available." : "Market data temporarily unavailable.";
    return Object.fromEntries(
      uniqueSymbols.map((symbol) => [
        symbol,
        marketDataFailure(symbol, reason, response.httpStatus === 402 || response.httpStatus === 429 ? "rate_limit" : "temporary_unavailable", response.data, response.responseTextPreview)
      ])
    );
  }

  const symbolsPayload = response.data.symbol;
  const result: Record<string, MarketPriceResult> = {};
  if (Array.isArray(symbolsPayload)) {
    symbolsPayload.forEach((rawSymbol, index) => {
      const parsed = parseMarketDataStockPricePayload(response.data!, String(rawSymbol ?? uniqueSymbols[index] ?? ""), index, response.responseTextPreview);
      result[parsed.symbol] = parsed;
    });
  } else {
    const parsed = parseMarketDataStockPricePayload(response.data, uniqueSymbols[0], 0, response.responseTextPreview);
    result[parsed.symbol] = parsed;
  }

  for (const symbol of uniqueSymbols) {
    if (!result[symbol]) result[symbol] = marketDataFailure(symbol, "MarketData.app stock price unavailable for this asset.", "price_unavailable", response.data);
  }
  return result;
}

export async function getMarketDataAppQuote(symbol: string): Promise<MarketPriceResult> {
  return getMarketDataStockPrice(symbol);
}

export async function getMarketDataAppBatchQuotes(symbols: string[]): Promise<Record<string, MarketPriceResult>> {
  return getMarketDataStockPrices(symbols);
}

export async function searchMarketDataAppAsset(query: string): Promise<InvestmentAssetSearchResult[]> {
  const normalized = normalizeSymbol(query);
  if (!isSupportedSymbol(normalized)) return [];
  const quote = await getMarketDataStockPrice(normalized);
  if (!quote.ok) return [];
  const featured = getInvestmentAsset(normalized);
  return [
    {
      symbol: normalized,
      name: featured?.name ?? normalized,
      type: featured?.type ?? "Stock",
      theme: featured?.theme ?? "US-listed asset",
      referencePrice: quote.closePrice,
      region: "United States",
      currency: "USD",
      exchange: featured?.exchange ?? null,
      featured: Boolean(featured?.featured),
      matchScore: 0.85,
      priceAvailable: true,
      latestClose: quote.closePrice,
      priceDate: quote.priceDate
    }
  ];
}

export async function debugMarketDataAppPrice(symbol: string): Promise<InvestmentPriceDebugResult> {
  const normalized = normalizeSymbol(symbol);
  const provider = preferredMarketDataProvider();
  const apiKey = getMarketDataApiKey();
  const cached = await getCachedPrice(normalized).catch(() => null);
  const marketStatus = getMarketStatus();
  const cacheFresh = cached ? isCachedQuoteFresh(cached, marketStatus) : false;
  const baseDebug = {
    symbol: normalized,
    provider,
    hasMarketDataApiKey: Boolean(apiKey),
    runtime: "nodejs",
    nodeVersion: typeof process !== "undefined" ? process.version : null,
    cacheFound: Boolean(cached),
    cachedPrice: cached?.latestClose ?? null,
    cachedFetchedAt: cached?.fetchedAt ?? null,
    cacheFresh,
    currentNyseDate: marketStatus.etDate,
    providerTradingDay: null,
    providerUpdatedAtET: null,
    isProviderStale: false,
    staleReason: null,
    canTrade: false,
    calledMarketDataApp: false,
    endpointUsed: `/${MARKETDATA_STOCK_PRICE_ENDPOINT}`,
    requestUrlWithoutToken: marketDataAppStockPriceUrlWithoutToken(normalized),
    httpStatus: null,
    responseOk: null,
    marketDataAppStatus: "not_used",
    parsedFields: null,
    parsedPrice: null,
    finalPrice: null,
    tradingDay: null,
    source: null,
    responseTextPreview: null,
    errorName: null,
    errorMessage: null,
    errorCause: null,
    errorStackPreview: null,
    bearerAttempt: skippedMarketDataAttempt(),
    queryTokenAttempt: skippedMarketDataAttempt(),
    error: null
  } satisfies InvestmentPriceDebugResult;

  if (!isSupportedSymbol(normalized)) {
    return { ...baseDebug, error: "Invalid ticker format.", errorMessage: "Invalid ticker format.", marketDataAppStatus: "invalid_symbol" };
  }

  if (!apiKey) {
    return { ...baseDebug, error: "MarketData.app API key is not configured.", errorMessage: "MarketData.app API key is not configured.", marketDataAppStatus: "missing_api_key" };
  }

  const calledMarketDataApp = true;
  const response = await fetchMarketDataApp(`${MARKETDATA_STOCK_PRICE_ENDPOINT}/${encodeURIComponent(normalized)}/`);

  if (!response.data) {
    const fallbackPrice = cached?.latestClose ?? null;
    return {
      ...baseDebug,
      calledMarketDataApp,
      httpStatus: response.httpStatus,
      responseOk: response.responseOk,
      marketDataAppStatus: response.errorName || response.errorMessage ? "fetch_failed" : "non_json_response",
      parsedPrice: null,
      finalPrice: fallbackPrice,
      tradingDay: cached?.priceDate ?? null,
      source: fallbackPrice ? "cache" : null,
      responseTextPreview: response.responseTextPreview,
      errorName: response.errorName,
      errorMessage: response.errorMessage ?? "MarketData.app returned a non-JSON response.",
      errorCause: response.errorCause,
      errorStackPreview: response.errorStackPreview,
      bearerAttempt: response.bearerAttempt,
      queryTokenAttempt: response.queryTokenAttempt,
      error: response.errorMessage ?? "MarketData.app returned a non-JSON response."
    };
  }

  const parsedFields = parsedMarketDataFields(response.data);
  const parsed = parseMarketDataStockPricePayload(response.data, normalized, 0, response.responseTextPreview);
  if (!response.responseOk || !parsed.ok) {
    const message = parsed.ok ? "Market data temporarily unavailable." : parsed.message;
    const cachedCanTrade = Boolean(cached && cacheFresh && marketStatus.isOpen);
    return {
      ...baseDebug,
      calledMarketDataApp,
      httpStatus: response.httpStatus,
      responseOk: response.responseOk,
      marketDataAppStatus: String(firstValue(response.data.s ?? response.data.status) ?? providerStatus(parsed)),
      parsedFields,
      parsedPrice: null,
      providerTradingDay: parsed.providerTradingDay ?? null,
      providerUpdatedAtET: parsed.providerUpdatedAtEt ?? null,
      isProviderStale: parsed.isProviderStale ?? false,
      staleReason: parsed.staleReason ?? null,
      canTrade: cachedCanTrade,
      finalPrice: cachedCanTrade ? cached?.latestClose ?? null : null,
      tradingDay: cachedCanTrade ? cached?.priceDate ?? null : parsed.providerTradingDay ?? null,
      source: cachedCanTrade ? "cache" : null,
      responseTextPreview: response.responseTextPreview,
      errorName: response.errorName,
      errorMessage: message,
      errorCause: response.errorCause,
      errorStackPreview: response.errorStackPreview,
      bearerAttempt: response.bearerAttempt,
      queryTokenAttempt: response.queryTokenAttempt,
      error: message
    };
  }

  try {
    await savePriceToCache(normalized, parsed.closePrice, parsed.priceDate, await resolveInvestmentAsset(normalized), parsed);
  } catch (cacheError) {
    const serialized = serializeFetchError(cacheError);
    return {
      ...baseDebug,
      calledMarketDataApp,
      httpStatus: response.httpStatus,
      responseOk: response.responseOk,
      marketDataAppStatus: "ok",
      parsedFields,
      parsedPrice: parsed.closePrice,
      finalPrice: parsed.closePrice,
      tradingDay: parsed.priceDate,
      source: "marketdata_app",
      providerTradingDay: parsed.providerTradingDay ?? parsed.priceDate,
      providerUpdatedAtET: parsed.providerUpdatedAtEt ?? null,
      isProviderStale: false,
      staleReason: null,
      canTrade: parsed.canTrade ?? marketStatus.isOpen,
      responseTextPreview: response.responseTextPreview,
      errorName: serialized.errorName,
      errorMessage: serialized.errorMessage ?? "Price fetched, but cache save failed.",
      errorCause: serialized.errorCause,
      errorStackPreview: serialized.errorStackPreview,
      bearerAttempt: response.bearerAttempt,
      queryTokenAttempt: response.queryTokenAttempt,
      error: null
    };
  }

  return {
    ...baseDebug,
    calledMarketDataApp,
    httpStatus: response.httpStatus,
    responseOk: response.responseOk,
    marketDataAppStatus: "ok",
    parsedFields,
    parsedPrice: parsed.closePrice,
    finalPrice: parsed.closePrice,
    tradingDay: parsed.priceDate,
    source: "marketdata_app",
    providerTradingDay: parsed.providerTradingDay ?? parsed.priceDate,
    providerUpdatedAtET: parsed.providerUpdatedAtEt ?? null,
    isProviderStale: false,
    staleReason: null,
    canTrade: parsed.canTrade ?? marketStatus.isOpen,
    responseTextPreview: response.responseTextPreview,
    bearerAttempt: response.bearerAttempt,
    queryTokenAttempt: response.queryTokenAttempt,
    error: null
  };
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

function providerStatus(result: MarketPriceResult | null) {
  if (!result) return "not_used";
  if (result.ok) return `success:${result.closePrice}:${result.priceDate}`;
  return `${result.code}:${result.message}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Market data temporarily unavailable.";
}

function dateFromYahooValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return todayIsoInEt(value);
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    return todayIsoInEt(new Date(milliseconds));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return todayIsoInEt(parsed);
  }
  return todayIsoInEt();
}

async function fetchAlphaVantageLatestClose(symbol: string): Promise<{ result: MarketPriceResult; globalQuote: MarketPriceResult; dailyClose?: MarketPriceResult }> {
  const globalQuote = await getGlobalQuotePrice(symbol);
  if (globalQuote.ok) return { result: globalQuote, globalQuote };

  const dailyClose = await getDailyClosePrice(symbol);
  if (dailyClose.ok) return { result: dailyClose, globalQuote, dailyClose };

  return {
    result: choosePriceFailure([globalQuote, dailyClose]),
    globalQuote,
    dailyClose
  };
}

export async function getYahooFinanceClosePrice(symbol: string): Promise<MarketPriceResult> {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return {
      ok: false,
      symbol: normalized,
      provider: "yahoo_finance",
      code: "symbol_not_found",
      message: "Symbol not found."
    };
  }

  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const quote = (await yahooFinance.quote(normalized)) as Payload;
    const marketStatus = getMarketStatus();
    const previousClose = parsePositiveNumber(quote.regularMarketPreviousClose);
    const marketPrice = parsePositiveNumber(quote.regularMarketPrice);
    const price = marketStatus.isOpen ? marketPrice ?? previousClose : previousClose ?? marketPrice;

    if (price) {
      const tradingDay = dateFromYahooValue(quote.regularMarketTime ?? quote.postMarketTime ?? quote.preMarketTime);
      return {
        ok: true,
        symbol: normalized,
        priceDate: tradingDay,
        closePrice: price,
        adjustedClosePrice: price,
        volume: Number(quote.regularMarketVolume ?? 0),
        provider: "yahoo_finance",
        source: "yahoo_finance",
        message: `Latest Yahoo Finance price from ${tradingDay}.`,
        raw: quote
      };
    }

    const period2 = new Date();
    const period1 = new Date(period2);
    period1.setUTCDate(period1.getUTCDate() - 14);
    const history = (await yahooFinance.historical(normalized, {
      period1,
      period2,
      interval: "1d"
    })) as Payload[];
    const latest = Array.isArray(history)
      ? history
          .filter((row) => parsePositiveNumber(row.close))
          .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))[0]
      : null;
    const historicalClose = parsePositiveNumber(latest?.close);
    if (latest && historicalClose) {
      const tradingDay = dateFromYahooValue(latest.date);
      return {
        ok: true,
        symbol: normalized,
        priceDate: tradingDay,
        closePrice: historicalClose,
        adjustedClosePrice: parsePositiveNumber(latest.adjClose) ?? historicalClose,
        volume: Number(latest.volume ?? 0),
        provider: "yahoo_finance",
        source: "yahoo_finance",
        message: `Latest Yahoo Finance historical close from ${tradingDay}.`,
        raw: latest
      };
    }

    return {
      ok: false,
      symbol: normalized,
      provider: "yahoo_finance",
      code: "price_unavailable",
      message: "Daily close price unavailable for this asset.",
      raw: quote
    };
  } catch (error) {
    return {
      ok: false,
      symbol: normalized,
      provider: "yahoo_finance",
      code: /not found|invalid|quote not found/i.test(errorMessage(error)) ? "symbol_not_found" : "temporary_unavailable",
      message: /not found|invalid|quote not found/i.test(errorMessage(error)) ? "Symbol not found." : "Market data temporarily unavailable.",
      raw: { error: errorMessage(error) }
    };
  }
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
      ? "US market is open. Simulated buy and sell orders use server-side cached stock prices."
      : holidayName
        ? `US market is closed for ${holidayName}. Latest cached stock prices are still shown, but buy/sell orders are disabled.`
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

  const lower = keyword.toLowerCase();
  const localAssets = (await listInvestmentAssets()).map((asset, index) => ({
    ...asset,
    matchScore: asset.symbol.toLowerCase() === lower ? 1 : Math.max(0.1, 0.9 - index / 300),
    latestClose: null,
    priceAvailable: false,
    priceDate: null
  }));
  const localMatches = localAssets.filter(
    (asset) => asset.symbol.toLowerCase().includes(lower) || asset.name.toLowerCase().includes(lower)
  );
  if (localMatches.length) {
    await Promise.all(localMatches.slice(0, 12).map((asset) => recordInvestmentAssetEvent(asset.symbol, "search")));
    return attachCachedPricesToSearchResults(localMatches.slice(0, 12));
  }

  const direct = normalizeSymbol(keyword);
  if (isSupportedSymbol(direct)) {
    await recordInvestmentAssetEvent(direct, "search");
    const providerResults = preferredMarketDataProvider() === MARKETDATA_APP_PROVIDER ? await searchMarketDataAppAsset(direct) : [];
    if (providerResults.length) {
      await upsertInvestmentAsset({ ...providerResults[0], referencePrice: providerResults[0].latestClose ?? providerResults[0].referencePrice });
      return attachCachedPricesToSearchResults(providerResults);
    }
    return attachCachedPricesToSearchResults([
      {
        symbol: direct,
        name: direct,
        type: "Stock",
        theme: "US-listed asset",
        referencePrice: 0,
        region: "United States",
        currency: "USD",
        exchange: null,
        featured: false,
        matchScore: 0.25,
        priceAvailable: false,
        latestClose: null,
        priceDate: null
      }
    ]);
  }

  return [];
}

export async function getAssetQuote(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return { ok: false as const, reason: "Invalid ticker format." };
  }

  const existing = await resolveInvestmentAsset(normalized);
  const searchMatch = existing ? null : (await searchAssets(normalized)).find((asset) => asset.symbol === normalized) ?? null;
  const candidate = existing ?? searchMatch ?? getInvestmentAsset(normalized) ?? null;
  await recordInvestmentAssetEvent(normalized, "select");
  const latest = await getLatestCloseQuote(normalized, candidate ?? undefined, { allowReferenceFallback: Boolean(candidate?.referencePrice) });

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
  await recordInvestmentAssetEvent(normalized, "trade");
  const latest = await getLatestCloseQuote(normalized, candidate, { allowReferenceFallback: false });
  if (!latest.priceAvailable) {
    return {
      ok: false as const,
      reason:
        latest.isStale || /fresh price/i.test(latest.priceMessage ?? "")
          ? "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
          : "Price is not available for this asset right now. Please try again later."
    };
  }
  if (getMarketStatus().isOpen && latest.canTrade === false) {
    return {
      ok: false as const,
      reason: "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
    };
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
      message: `Latest provider price from ${priceDate}.`,
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
  const latest = await getLatestClosePrice(symbol);
  if (!latest.price || !latest.tradingDay || !latest.source) return null;
  return {
    ok: true as const,
    symbol: normalizeSymbol(symbol),
    priceDate: latest.tradingDay,
    closePrice: latest.price,
    adjustedClosePrice: latest.price,
    volume: 0,
    provider: latest.source,
    source: latest.source,
    message: latest.cached ? `Using latest saved close from ${latest.tradingDay}.` : `Latest close from ${latest.source}.`,
    raw: { cached: latest.cached }
  };
}

async function resolveLatestClosePrice(
  symbol: string,
  assetInput?: InvestmentAsset,
  options: { allowReferenceFallback?: boolean; refresh?: boolean } = {}
) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) throw new Error("Unsupported investment asset.");
  const refresh = options.refresh ?? false;
  const asset = assetInput ?? (await resolveInvestmentAsset(normalized));
  let marketDataAppStatus = "not_used";
  let calledMarketDataApp = false;

  const stored = await getCachedPrice(normalized);
  const marketStatus = getMarketStatus();
  const cacheFresh = stored ? isCachedQuoteFresh(stored, marketStatus) : false;
  if (stored && !refresh && cacheFresh) {
    return {
      result: {
        symbol: normalized,
        price: stored.latestClose,
        tradingDay: stored.priceDate,
        source: "cache" as const,
        cached: true,
        error: null,
        fetchedAt: stored.fetchedAt ?? null
      },
      quote: stored,
      debug: {
        symbol: normalized,
        provider: preferredMarketDataProvider(),
        hasMarketDataApiKey: Boolean(getMarketDataApiKey()),
        cacheFound: true,
        cachedPrice: stored.latestClose,
        cachedFetchedAt: stored.fetchedAt ?? null,
        cacheFresh: true,
        calledMarketDataApp: false,
        endpointUsed: `/${MARKETDATA_STOCK_PRICE_ENDPOINT}`,
        marketDataAppStatus: "skipped_cache_hit",
        finalPrice: stored.latestClose,
        tradingDay: stored.priceDate,
        source: "cache" as const,
        responseTextPreview: null,
        error: null
      } satisfies InvestmentPriceDebugResult
    };
  }

  const marketData = await getMarketDataStockPrice(normalized);
  calledMarketDataApp = true;
  marketDataAppStatus = marketData.ok ? "ok" : providerStatus(marketData);
  if (marketData.ok) {
    let cacheSaveError: string | null = null;
    try {
      await savePriceToCache(normalized, marketData.closePrice, marketData.priceDate, asset, marketData);
    } catch (error) {
      cacheSaveError = errorMessage(error);
    }
    const quote = {
      latestClose: marketData.closePrice,
      priceDate: marketData.priceDate,
      provider: marketData.provider,
      priceAvailable: true,
      priceSource: "marketdata_app" as const,
      priceMessage: cacheSaveError ? `${marketData.message} Cache save failed, but the live price is shown for this session.` : marketData.message,
      fetchedAt: new Date().toISOString(),
      currency: asset?.currency ?? "USD",
      cacheStatus: "fresh" as const,
      canTrade: marketData.canTrade ?? marketStatus.isOpen,
      isStale: false,
      staleReason: null,
      providerUpdatedAt: marketData.providerUpdatedAt ?? null,
      providerUpdatedAtEt: marketData.providerUpdatedAtEt ?? null
    };
    return {
      result: {
        symbol: normalized,
        price: marketData.closePrice,
        tradingDay: marketData.priceDate,
        source: "marketdata_app" as const,
        cached: false,
        error: null,
        fetchedAt: quote.fetchedAt
      },
      quote,
      debug: {
        symbol: normalized,
        provider: preferredMarketDataProvider(),
        hasMarketDataApiKey: Boolean(getMarketDataApiKey()),
        cacheFound: Boolean(stored),
        cachedPrice: stored?.latestClose ?? null,
        cachedFetchedAt: stored?.fetchedAt ?? null,
        cacheFresh,
        calledMarketDataApp,
        endpointUsed: `/${MARKETDATA_STOCK_PRICE_ENDPOINT}`,
        marketDataAppStatus,
        finalPrice: marketData.closePrice,
        tradingDay: marketData.priceDate,
        source: "marketdata_app" as const,
        responseTextPreview: marketData.responseTextPreview ?? null,
        error: cacheSaveError
      } satisfies InvestmentPriceDebugResult
    };
  }

  if (stored) {
    const prefix = marketData.ok ? "Using saved price." : marketData.message;
    const quote = {
      ...stored,
      priceMessage: `${prefix} Using saved price from ${stored.fetchedAt ? new Date(stored.fetchedAt).toLocaleString("en-US") : stored.priceDate}.`,
      cacheStatus: stored.cacheStatus ?? (cacheFresh ? "fresh" : "stale"),
      canTrade: marketStatus.isOpen && cacheFresh,
      isStale: marketStatus.isOpen && !cacheFresh,
      staleReason:
        marketStatus.isOpen && !cacheFresh
          ? "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
          : null
    };
    return {
      result: {
        symbol: normalized,
        price: stored.latestClose,
        tradingDay: stored.priceDate,
        source: "cache" as const,
        cached: true,
        error: quote.priceMessage,
        fetchedAt: stored.fetchedAt ?? null
      },
      quote,
      debug: {
        symbol: normalized,
        provider: preferredMarketDataProvider(),
        hasMarketDataApiKey: Boolean(getMarketDataApiKey()),
        cacheFound: true,
        cachedPrice: stored.latestClose,
        cachedFetchedAt: stored.fetchedAt ?? null,
        cacheFresh,
        calledMarketDataApp,
        endpointUsed: `/${MARKETDATA_STOCK_PRICE_ENDPOINT}`,
        marketDataAppStatus,
        finalPrice: stored.latestClose,
        tradingDay: stored.priceDate,
        source: "cache" as const,
        responseTextPreview: marketData.responseTextPreview ?? null,
        error: quote.priceMessage
      } satisfies InvestmentPriceDebugResult
    };
  }

  const failure = marketData;
  const error =
    failure.code === "symbol_not_found"
      ? "Symbol not found."
      : failure.code === "price_unavailable"
        ? "MarketData.app stock price unavailable for this asset."
        : failure.code === "stale_price"
          ? "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
        : failure.code === "rate_limit"
          ? "API credit limit reached. Using saved prices when available."
          : "No saved price yet. Select the asset to fetch the latest price.";

  return {
    result: {
      symbol: normalized,
      price: null,
      tradingDay: null,
      source: null,
      cached: false,
      error,
      fetchedAt: null
    },
    quote: {
      latestClose: 0,
      priceDate: null,
      provider: failure.provider,
      priceAvailable: false,
      priceSource: "unavailable" as const,
      priceMessage: error,
      fetchedAt: null,
      currency: asset?.currency ?? "USD",
      cacheStatus: "missing" as const,
      canTrade: false,
      isStale: failure.code === "stale_price",
      staleReason: failure.staleReason ?? (failure.code === "stale_price" ? error : null),
      providerUpdatedAt: failure.providerUpdatedAt ?? null,
      providerUpdatedAtEt: failure.providerUpdatedAtEt ?? null
    },
    debug: {
      symbol: normalized,
      provider: preferredMarketDataProvider(),
      hasMarketDataApiKey: Boolean(getMarketDataApiKey()),
      cacheFound: false,
      cachedPrice: null,
      cachedFetchedAt: null,
      cacheFresh: false,
      calledMarketDataApp,
      endpointUsed: `/${MARKETDATA_STOCK_PRICE_ENDPOINT}`,
      marketDataAppStatus,
      finalPrice: null,
      tradingDay: null,
      source: null,
      responseTextPreview: failure.responseTextPreview ?? null,
      error
    } satisfies InvestmentPriceDebugResult
  };
}

export async function getLatestClosePrice(
  symbol: string,
  assetInput?: InvestmentAsset,
  options: { refresh?: boolean } = {}
): Promise<LatestClosePriceResult> {
  const resolved = await resolveLatestClosePrice(symbol, assetInput, { refresh: options.refresh, allowReferenceFallback: false });
  return resolved.result;
}

export async function getLatestStockPrice(
  symbol: string,
  assetInput?: InvestmentAsset,
  options: { refresh?: boolean } = {}
): Promise<LatestClosePriceResult> {
  return getLatestClosePrice(symbol, assetInput, options);
}

async function getLatestCloseQuote(
  symbol: string,
  assetInput?: InvestmentAsset,
  options: { allowReferenceFallback?: boolean; refresh?: boolean } = {}
) {
  const normalized = normalizeSymbol(symbol);
  const allowReferenceFallback = options.allowReferenceFallback ?? true;
  const asset = assetInput ?? (await resolveInvestmentAsset(normalized));
  const resolved = await resolveLatestClosePrice(normalized, asset ?? undefined, options);
  if (resolved.quote.priceAvailable || !allowReferenceFallback) return resolved.quote;

  return {
    latestClose: asset?.referencePrice ?? 0,
    priceDate: null,
    provider: "educational_reference",
    priceAvailable: false,
    priceSource: asset?.referencePrice ? ("reference" as const) : ("unavailable" as const),
    priceMessage: asset?.referencePrice
      ? resolved.result.error ?? "No saved price yet. Select the asset to fetch the latest price."
      : "No saved price yet. Select the asset to fetch the latest price.",
    fetchedAt: null,
    currency: asset?.currency ?? "USD",
    cacheStatus: "missing" as const,
    canTrade: false,
    isStale: false,
    staleReason: null,
    providerUpdatedAt: null,
    providerUpdatedAtEt: null
  };
}

export async function debugInvestmentPrice(symbol: string): Promise<InvestmentPriceDebugResult> {
  const resolved = await resolveLatestClosePrice(symbol, undefined, { refresh: true, allowReferenceFallback: false });
  return resolved.debug;
}

export async function getCachedPrice(symbol: string) {
  const stored = await getStoredLatestPrice(normalizeSymbol(symbol));
  if (!stored) return null;
  const marketStatus = getMarketStatus();
  const cacheFresh = isCachedQuoteFresh(stored, marketStatus);
  const isStale = marketStatus.isOpen && !cacheFresh;
  return {
    ...stored,
    provider: stored.provider || MARKETDATA_APP_PROVIDER,
    priceSource: "cache" as const,
    cacheStatus: cacheFresh ? ("fresh" as const) : marketStatus.isOpen ? ("stale" as const) : ("cached" as const),
    priceMessage: isStale
      ? "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
      : `Using saved price from ${stored.fetchedAt ? new Date(stored.fetchedAt).toLocaleString("en-US") : stored.priceDate}.`,
    canTrade: marketStatus.isOpen && cacheFresh,
    isStale,
    staleReason: isStale
      ? "Fresh price is not available for this asset right now. Please try again later or choose another ticker."
      : null,
    providerUpdatedAt: stored.providerUpdatedAt ?? null,
    providerUpdatedAtEt: stored.providerUpdatedAt ? formatProviderUpdatedAtEt(new Date(stored.providerUpdatedAt)) : null
  };
}

function collectPortfolioSymbols(holdingRows: Payload[], positionRows: Payload[]) {
  const symbols = new Set<string>();
  for (const row of holdingRows) {
    const quantity = rowNumber(row, "quantity");
    const symbol = normalizeSymbol(rowString(row, "symbol"));
    if (symbol && quantity > 0) symbols.add(symbol);
  }
  for (const row of positionRows) {
    const symbol = normalizeSymbol(rowString(row, "symbol"));
    if (symbol) symbols.add(symbol);
  }
  return symbols;
}

async function resolvePortfolioQuotesForSymbols(
  symbols: Iterable<string>,
  baseQuotes: InvestmentAssetQuote[] = [],
  assetsInput: InvestmentAsset[] = [],
  priceMapInput?: Map<string, number>
) {
  const quotesBySymbol = new Map<string, InvestmentAssetQuote>();
  for (const quote of baseQuotes) {
    const symbol = normalizeSymbol(quote.symbol);
    if (symbol) quotesBySymbol.set(symbol, { ...quote, symbol });
  }

  const assetsBySymbol = new Map<string, InvestmentAsset>();
  for (const asset of assetsInput) assetsBySymbol.set(normalizeSymbol(asset.symbol), asset);
  for (const asset of INVESTMENT_ASSETS) {
    const symbol = normalizeSymbol(asset.symbol);
    if (!assetsBySymbol.has(symbol)) assetsBySymbol.set(symbol, asset);
  }

  for (const rawSymbol of symbols) {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) continue;
    const existing = quotesBySymbol.get(symbol);
    if (
      existing &&
      existing.priceAvailable &&
      existing.priceSource !== "reference" &&
      Number.isFinite(existing.latestClose) &&
      existing.latestClose > 0
    ) {
      continue;
    }

    const cached = await getCachedPrice(symbol).catch(() => null);
    if (cached && Number.isFinite(cached.latestClose) && cached.latestClose > 0) {
      const asset = assetsBySymbol.get(symbol) ?? (await resolveInvestmentAsset(symbol).catch(() => null)) ?? getInvestmentAsset(symbol) ?? null;
      quotesBySymbol.set(symbol, {
        ...(asset ?? {
          symbol,
          name: symbol,
          type: "Stock",
          theme: "US-listed asset",
          referencePrice: cached.latestClose,
          region: "United States",
          currency: cached.currency ?? "USD",
          exchange: null,
          featured: false
        }),
        latestClose: cached.latestClose,
        priceDate: cached.priceDate,
        provider: cached.provider,
        priceAvailable: true,
        priceSource: "cache",
        priceMessage: cached.priceMessage ?? "Using latest cached price.",
        fetchedAt: cached.fetchedAt ?? null,
        currency: cached.currency ?? asset?.currency ?? "USD",
        cacheStatus: cached.cacheStatus,
        canTrade: cached.canTrade,
        isStale: cached.isStale,
        staleReason: cached.staleReason,
        providerUpdatedAt: cached.providerUpdatedAt,
        providerUpdatedAtEt: cached.providerUpdatedAtEt
      });
      continue;
    }

    const inputPrice = priceMapInput?.get(symbol);
    if (inputPrice && Number.isFinite(inputPrice) && inputPrice > 0) {
      const asset = assetsBySymbol.get(symbol) ?? (await resolveInvestmentAsset(symbol).catch(() => null)) ?? getInvestmentAsset(symbol) ?? null;
      quotesBySymbol.set(symbol, {
        ...(asset ?? {
          symbol,
          name: symbol,
          type: "Stock",
          theme: "US-listed asset",
          referencePrice: inputPrice,
          region: "United States",
          currency: "USD",
          exchange: null,
          featured: false
        }),
        latestClose: inputPrice,
        priceDate: null,
        provider: "saved_price_map",
        priceAvailable: true,
        priceSource: "cache",
        priceMessage: "Using latest cached price.",
        fetchedAt: null,
        currency: asset?.currency ?? "USD",
        cacheStatus: "cached",
        canTrade: false,
        isStale: getMarketStatus().isOpen,
        staleReason: getMarketStatus().isOpen ? "Fresh price is temporarily unavailable for this asset." : null
      });
      continue;
    }

    const asset = assetsBySymbol.get(symbol) ?? (await resolveInvestmentAsset(symbol).catch(() => null)) ?? getInvestmentAsset(symbol) ?? null;
    const referencePrice = asset?.referencePrice ?? 0;
    quotesBySymbol.set(symbol, {
      ...(asset ?? {
        symbol,
        name: symbol,
        type: "Stock",
        theme: "US-listed asset",
        referencePrice,
        region: "United States",
        currency: "USD",
        exchange: null,
        featured: false
      }),
      latestClose: referencePrice,
      priceDate: null,
      provider: referencePrice ? "educational_reference" : "unavailable",
      priceAvailable: false,
      priceSource: referencePrice ? "reference" : "unavailable",
      priceMessage: referencePrice ? "Using reference price as final fallback." : "Price unavailable.",
      fetchedAt: null,
      currency: asset?.currency ?? "USD",
      cacheStatus: "missing",
      canTrade: false,
      isStale: false,
      staleReason: null
    });
  }

  return Array.from(quotesBySymbol.values());
}

function portfolioPricesUsed(symbols: Iterable<string>, quoteMap: Map<string, InvestmentAssetQuote>) {
  return Array.from(symbols)
    .map((symbol) => normalizeSymbol(symbol))
    .filter(Boolean)
    .sort()
    .map((symbol) => {
      const quote = quoteMap.get(symbol);
      return {
        symbol,
        price: quote && Number.isFinite(quote.latestClose) && quote.latestClose > 0 ? quote.latestClose : null,
        source: quote?.priceSource ?? quote?.provider ?? "unavailable",
        priceDate: quote?.priceDate ?? null,
        fetchedAt: quote?.fetchedAt ?? null
      };
    });
}

function marketPriceMapFromQuotes(quotes: InvestmentAssetQuote[]) {
  // Portfolio valuation should use the latest saved platform price even when it is
  // too stale for new trades. Trading freshness and portfolio mark-to-market are
  // separate concerns.
  const map = new Map<string, number>();
  for (const quote of quotes) {
    if (quote.priceSource === "reference" && Number.isFinite(quote.latestClose) && quote.latestClose > 0) {
      map.set(quote.symbol, quote.latestClose);
    }
  }
  for (const quote of quotes) {
    if (
      quote.priceAvailable &&
      quote.priceSource !== "reference" &&
      quote.priceSource !== "unavailable" &&
      Number.isFinite(quote.latestClose) &&
      quote.latestClose > 0
    ) {
      map.set(quote.symbol, quote.latestClose);
    }
  }
  return map;
}

function isCachedQuoteFresh(
  stored: { fetchedAt?: string | null; priceDate?: string | null },
  marketStatus = getMarketStatus()
) {
  if (!stored.fetchedAt && !stored.priceDate) return false;
  if (!marketStatus.isOpen) return Boolean(stored.priceDate || stored.fetchedAt);
  if (!stored.priceDate || stored.priceDate !== marketStatus.etDate) return false;
  if (!stored.fetchedAt) return false;
  const fetchedAt = Date.parse(stored.fetchedAt);
  if (!Number.isFinite(fetchedAt)) return false;
  return Date.now() - fetchedAt < MARKETDATA_CACHE_FRESH_MS;
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
  if (marketPrice?.isProviderStale) return null;

  const stored = await getStoredLatestPrice(normalized).catch(() => null);
  if (stored?.priceDate && stored.priceDate > tradingDay) return stored;
  if (stored?.providerUpdatedAt && marketPrice?.providerUpdatedAt) {
    const storedUpdatedAt = Date.parse(stored.providerUpdatedAt);
    const incomingUpdatedAt = Date.parse(marketPrice.providerUpdatedAt);
    if (Number.isFinite(storedUpdatedAt) && Number.isFinite(incomingUpdatedAt) && incomingUpdatedAt <= storedUpdatedAt) {
      return stored;
    }
  }

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
    provider: marketPrice?.provider ?? MARKETDATA_APP_PROVIDER,
    raw: marketPrice?.raw ?? { cached: true }
  });
}

export async function updateDailyPrices() {
  await ensureInvestmentSeedData();
  return refreshUsedAssetPrices(MAX_MARKETDATA_SYMBOLS_PER_CRON);
}

export type InvestmentPriceRefreshResult = {
  symbol: string;
  success: boolean;
  ok: boolean;
  price?: number;
  priceDate?: string | null;
  tradingDay?: string | null;
  source?: string;
  apiLimitReached?: boolean;
  error?: string;
  message?: string;
};

export async function refreshFeaturedAssetPrices() {
  await ensureInvestmentSeedData();
  const assets = (await listInvestmentAssets()).filter((asset) => asset.featured);
  return refreshPriceCache(assets.map((asset) => asset.symbol), { force: true, maxSymbols: assets.length });
}

export async function refreshFeaturedPrices() {
  return refreshFeaturedAssetPrices();
}

export async function refreshPriceForSymbol(symbol: string) {
  const [result] = await refreshPriceCache([symbol], { force: true });
  return result;
}

export async function refreshPriceCache(
  symbols: string[],
  options: { force?: boolean; maxSymbols?: number } = {}
): Promise<InvestmentPriceRefreshResult[]> {
  await ensureInvestmentSeedData();
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeSymbol).filter(isSupportedSymbol))).slice(0, options.maxSymbols ?? MAX_MARKETDATA_SYMBOLS_PER_CRON);
  if (!uniqueSymbols.length) return [];

  const results: InvestmentPriceRefreshResult[] = [];
  const symbolsToFetch: string[] = [];
  const marketStatus = getMarketStatus();

  for (const symbol of uniqueSymbols) {
    const cached = await getCachedPrice(symbol);
    if (cached && !options.force && isCachedQuoteFresh(cached, marketStatus)) {
      results.push({
        symbol,
        success: true,
        ok: true,
        price: cached.latestClose,
        priceDate: cached.priceDate,
        tradingDay: cached.priceDate,
        source: "cache",
        message: `Using saved price from ${cached.fetchedAt ? new Date(cached.fetchedAt).toLocaleString("en-US") : cached.priceDate}.`
      });
      continue;
    }
    symbolsToFetch.push(symbol);
  }

  if (!symbolsToFetch.length) return results;

  const providerResults = preferredMarketDataProvider() === MARKETDATA_APP_PROVIDER
    ? await getMarketDataStockPrices(symbolsToFetch)
    : Object.fromEntries(symbolsToFetch.map((symbol) => [symbol, marketDataFailure(symbol, "MarketData.app provider is not enabled.")]));

  for (const symbol of symbolsToFetch) {
    const providerResult = providerResults[symbol] ?? marketDataFailure(symbol, "MarketData.app stock price unavailable for this asset.", "price_unavailable");
    const asset = await resolveInvestmentAsset(symbol);
    if (providerResult.ok) {
      await savePriceToCache(symbol, providerResult.closePrice, providerResult.priceDate, asset, providerResult);
      results.push({
        symbol,
        success: true,
        ok: true,
        price: providerResult.closePrice,
        priceDate: providerResult.priceDate,
        tradingDay: providerResult.priceDate,
        source: providerResult.provider,
        apiLimitReached: false,
        message: providerResult.message
      });
      continue;
    }

    const cached = await getCachedPrice(symbol);
    if (cached) {
      results.push({
        symbol,
        success: true,
        ok: true,
        price: cached.latestClose,
        priceDate: cached.priceDate,
        tradingDay: cached.priceDate,
        source: "cache",
        apiLimitReached: providerResult.code === "rate_limit",
        error: providerResult.message,
        message: `${providerResult.message} Using saved price from ${cached.fetchedAt ? new Date(cached.fetchedAt).toLocaleString("en-US") : cached.priceDate}.`
      });
    } else {
      results.push({
        symbol,
        success: false,
        ok: false,
        apiLimitReached: providerResult.code === "rate_limit",
        error: providerResult.message,
        message: providerResult.message
      });
    }
  }

  return results;
}

export async function refreshUsedAssetPrices(maxSymbols = MAX_MARKETDATA_SYMBOLS_PER_CRON) {
  const symbols = await getUsedInvestmentSymbols(maxSymbols);
  return refreshPriceCache(symbols, { maxSymbols });
}

export async function refreshFeaturedPricesIfNeeded() {
  return refreshPriceCache(INVESTMENT_ASSETS.map((asset) => asset.symbol), { force: false, maxSymbols: INVESTMENT_ASSETS.length });
}

export async function refreshHeldAssetPrices() {
  const symbols = await getHeldInvestmentSymbols();
  const results = await refreshPriceCache(symbols, { maxSymbols: MAX_MARKETDATA_SYMBOLS_PER_CRON });
  return results.map((result) => ({ symbol: result.symbol, ok: result.ok, message: result.message ?? result.error }));
}

async function getHeldInvestmentSymbols() {
  if (!supabaseConfigured()) return [];

  let symbols: string[] = [];
  try {
    const [holdingRows, positionRows] = await Promise.all([
      selectRows("investment_holdings", {
        select: "symbol,quantity",
        quantity: "gt.0",
        limit: "200"
      }).catch(() => []),
      selectRows("investment_positions", {
        select: "symbol,status",
        status: "eq.open",
        limit: "200"
      }).catch(() => [])
    ]);
    symbols = Array.from(
      new Set(
        [...(Array.isArray(holdingRows) ? holdingRows : []), ...(Array.isArray(positionRows) ? positionRows : [])]
          .map((row) => normalizeSymbol(rowString(row, "symbol")))
          .filter(Boolean)
      )
    );
  } catch {
    return [];
  }

  return symbols;
}

async function getUsedInvestmentSymbols(maxSymbols = MAX_MARKETDATA_SYMBOLS_PER_CRON) {
  if (!supabaseConfigured()) {
    return INVESTMENT_ASSETS.slice(0, Math.min(maxSymbols, 5)).map((asset) => asset.symbol);
  }

  const prioritized: string[] = [];
  const add = (symbol: string) => {
    const normalized = normalizeSymbol(symbol);
    if (isSupportedSymbol(normalized) && !prioritized.includes(normalized)) prioritized.push(normalized);
  };

  for (const symbol of await getHeldInvestmentSymbols()) add(symbol);

  try {
    const trades = await selectRows("investment_trades", {
      select: "symbol,created_at,rejected",
      rejected: "eq.false",
      order: "created_at.desc",
      limit: "200"
    });
    if (Array.isArray(trades)) trades.forEach((row) => add(rowString(row, "symbol")));
  } catch {
    // Watchlist fallback below.
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const events = await selectRows("investment_asset_watchlist_events", {
      select: "symbol,event_type,created_at",
      created_at: `gte.${since}`,
      order: "created_at.desc",
      limit: "500"
    });
    if (Array.isArray(events)) events.forEach((row) => add(rowString(row, "symbol")));
  } catch {
    // Migration may not exist yet on older deployments.
  }

  for (const asset of INVESTMENT_ASSETS) {
    if (prioritized.length >= Math.min(maxSymbols, 8)) break;
    add(asset.symbol);
  }

  return prioritized.slice(0, maxSymbols);
}

export async function searchOptionChain(symbol: string) {
  return getOptionChain(symbol);
}

export async function getOptionChain(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) {
    return { ok: false as const, reason: "Symbol not found.", contracts: [] as Payload[] };
  }

  return {
    ok: false as const,
    reason: "Options are shown in educational mode using simplified estimates. Real options market data is not used.",
    contracts: [] as Payload[]
  };
}

export async function getOptionContractPrice(contract: Payload) {
  const premium = parsePositiveNumber(contract.mark) ?? parsePositiveNumber(contract.last) ?? parsePositiveNumber(contract.ask) ?? parsePositiveNumber(contract.bid);
  return premium
    ? { ok: true as const, premium, provider: "educational_estimate" }
    : { ok: false as const, reason: "Real options market data is not used." };
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
  const priceMap = marketPriceMapFromQuotes(quotes);
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

export async function updateInvestmentLeaderboard(competitionCodeOrSlug?: string | null) {
  if (!supabaseConfigured()) return { rows: [], persisted: false };
  await ensureInvestmentSeedData();

  const competitions = competitionCodeOrSlug
    ? [await resolveInvestmentCompetition(competitionCodeOrSlug)]
    : await listInvestmentCompetitions();
  const validCompetitions = competitions.filter((competition): competition is InvestmentCompetitionView => Boolean(competition));
  if (!validCompetitions.length) return { rows: [], persisted: false };

  const allScored: InvestmentLeaderboardRow[] = [];

  for (const competition of validCompetitions) {
    if (competition.runtimeStatus === "closed") {
      const lockedRows = await listLockedCompetitionResultRows(competition);
      if (lockedRows.length) {
        allScored.push(...lockedRows);
        continue;
      }
    }
    const accounts = await selectRows("investment_accounts", {
      select: "*",
      competition_id: `eq.${competition.id}`,
      order: "created_at.asc",
      limit: "1000"
    });
    if (!Array.isArray(accounts)) continue;

    const quotes = await listInvestmentAssetQuotes();
    const priceMap = marketPriceMapFromQuotes(quotes);
    const scored: InvestmentLeaderboardRow[] = [];

    for (const account of accounts) {
      const view = await buildInvestmentAccountView(rowString(account, "id"), priceMap);
      if (!view) continue;
      const snapshots = await listSnapshots(view.account.id);
      const drawdown = calculateMaxDrawdown(snapshots, view.portfolio.totalValue);
      const thesisScore = view.thesis?.thesisScore ?? 0;
      const tradeCount = await getTradeCount(view.account.id);
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
      const profitLoss = view.portfolio.totalValue - view.portfolio.startingCash;

      scored.push({
        rank: 0,
        accountId: view.account.id,
        teamId: view.account.id,
        competitionId: competition.id,
        competitionCode: competition.code,
        teamName: view.account.teamName,
        startingCash: view.portfolio.startingCash,
        cashBalance: view.portfolio.cash,
        holdingsValue: view.portfolio.holdingsValue,
        totalValue: view.portfolio.totalValue,
        profitLoss,
        totalReturn: view.portfolio.totalReturn,
        tradeCount,
        riskAdjustedScore,
        diversificationScore: view.portfolio.diversificationScore,
        riskScore: view.portfolio.riskScore,
        thesisScore,
        drawdownScore,
        overallScore,
        status: competition.runtimeStatus === "closed" ? "closed" : "active",
        updatedAt: new Date().toISOString()
      });
    }

    scored.sort((a, b) => b.totalValue - a.totalValue || b.totalReturn - a.totalReturn || b.overallScore - a.overallScore);
    scored.forEach((row, index) => {
      row.rank = index + 1;
    });

    for (const row of scored) {
      await upsertLeaderboardRow(row);
      if (competition.runtimeStatus === "closed") await upsertCompetitionResult(row);
    }

    allScored.push(...scored);
  }

  return { rows: allScored, persisted: true };
}

async function listLockedCompetitionResultRows(competition: InvestmentCompetitionView) {
  try {
    const rows = await selectRows("investment_competition_results", {
      select: "*",
      competition_id: `eq.${competition.id}`,
      order: "final_rank.asc,final_value.desc",
      limit: "500"
    });
    if (!Array.isArray(rows) || !rows.length) return [];
    return rows.map((row) => ({
      rank: rowNumber(row, "final_rank"),
      accountId: rowString(row, "account_id"),
      teamId: rowString(row, "account_id"),
      competitionId: competition.id,
      competitionCode: competition.code,
      teamName: rowString(row, "team_name"),
      startingCash: rowNumber(row, "starting_cash"),
      cashBalance: 0,
      holdingsValue: 0,
      totalValue: rowNumber(row, "final_value"),
      profitLoss: rowNumber(row, "profit_loss"),
      totalReturn: rowNumber(row, "total_return"),
      tradeCount: rowNumber(row, "trade_count"),
      riskAdjustedScore: 0,
      diversificationScore: rowNumber(row, "diversification_score"),
      riskScore: rowNumber(row, "risk_score"),
      thesisScore: rowNumber(row, "thesis_score"),
      drawdownScore: 0,
      overallScore: 0,
      status: "closed",
      updatedAt: rowString(row, "finalized_at")
    }));
  } catch {
    return [];
  }
}

async function upsertLeaderboardRow(row: InvestmentLeaderboardRow) {
  const payload = {
    competition_id: row.competitionId,
    account_id: row.accountId,
    team_id: row.teamId,
    team_name: row.teamName,
    starting_cash: row.startingCash,
    cash_balance: row.cashBalance,
    holdings_value: row.holdingsValue,
    total_value: row.totalValue,
    total_portfolio_value: row.totalValue,
    profit_loss: row.profitLoss,
    total_return: row.totalReturn,
    return_percent: row.totalReturn,
    trade_count: row.tradeCount,
    trades_count: row.tradeCount,
    risk_adjusted_score: row.riskAdjustedScore,
    diversification_score: row.diversificationScore,
    risk_score: row.riskScore,
    thesis_score: row.thesisScore,
    drawdown_score: row.drawdownScore,
    overall_score: row.overallScore,
    status: row.status,
    rank_position: row.rank,
    rank: row.rank,
    updated_at: row.updatedAt
  };
  try {
    return await upsertRow("investment_leaderboard", payload, "competition_id,account_id");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/team_id|cash_balance|holdings_value|total_portfolio_value|return_percent|trades_count|rank|starting_cash|profit_loss|trade_count|risk_score|status|schema cache|column/i.test(message)) throw error;
    const legacyPayload: Payload = { ...payload };
    delete legacyPayload.team_id;
    delete legacyPayload.cash_balance;
    delete legacyPayload.holdings_value;
    delete legacyPayload.total_portfolio_value;
    delete legacyPayload.return_percent;
    delete legacyPayload.trades_count;
    delete legacyPayload.rank;
    delete legacyPayload.starting_cash;
    delete legacyPayload.profit_loss;
    delete legacyPayload.trade_count;
    delete legacyPayload.risk_score;
    delete legacyPayload.status;
    return upsertRow("investment_leaderboard", legacyPayload, "competition_id,account_id");
  }
}

async function upsertCompetitionResult(row: InvestmentLeaderboardRow) {
  const payload = {
    competition_id: row.competitionId,
    account_id: row.accountId,
    team_name: row.teamName,
    final_rank: row.rank,
    starting_cash: row.startingCash,
    final_value: row.totalValue,
    profit_loss: row.profitLoss,
    total_return: row.totalReturn,
    trade_count: row.tradeCount,
    diversification_score: row.diversificationScore,
    risk_score: row.riskScore,
    thesis_score: row.thesisScore,
    finalized_at: new Date().toISOString()
  };
  try {
    return await upsertRow("investment_competition_results", payload, "competition_id,account_id");
  } catch {
    return null;
  }
}

async function getTradeCount(accountId: string) {
  try {
    const rows = await selectRows("investment_trades", {
      select: "id,rejected",
      account_id: `eq.${accountId}`,
      rejected: "eq.false",
      limit: "1000"
    });
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
}

export async function ensureInvestmentSeedData(includeCompetitions = true) {
  if (!supabaseConfigured()) return null;
  const competition = includeCompetitions ? await ensureDefaultCompetition() : null;
  if (includeCompetitions) await ensureDefaultCompetition(TEENVESTOR_CODE);
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
  competitionCode?: string;
}) {
  if (!supabaseConfigured()) return null;
  const requestedCompetition = input.competitionCode || input.competitionSlug;
  const competition = requestedCompetition
    ? await resolveInvestmentCompetition(requestedCompetition)
    : await ensureDefaultCompetition();
  if (!competition) return null;

  const teamName = normalizeInvestmentTeamDisplayName(input.teamName);
  const normalizedTeamName = normalizeInvestmentTeamNameKey(teamName);
  if (!teamName) throw new Error("Team name is required.");

  const existing = await findInvestmentAccountByNormalizedTeamName(competition.id, normalizedTeamName);
  if (existing) {
    await updateInvestmentAccountNormalizedName(existing, normalizedTeamName);
    return calculateInvestmentPortfolio(rowString(existing, "id"));
  }

  const accountPayload = {
    competition_id: competition.id,
    team_name: teamName,
    normalized_team_name: normalizedTeamName,
    participant_login: input.participantLogin?.trim().slice(0, 96) || null,
    starting_cash: competition.startingCash,
    cash: competition.startingCash,
    updated_at: new Date().toISOString()
  };
  let rows: Payload[] | { ok: boolean; reason: "missing_env" };
  try {
    rows = await upsertRow("investment_accounts", accountPayload, "competition_id,team_name");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/normalized_team_name|schema cache|column/i.test(message)) throw error;
    const { normalized_team_name: _normalizedTeamName, ...legacyPayload } = accountPayload;
    rows = await upsertRow("investment_accounts", legacyPayload, "competition_id,team_name");
  }
  if (!Array.isArray(rows) || !rows[0]) return null;
  const accountId = rowString(rows[0], "id");
  await updateInvestmentAccountNormalizedName(rows[0], normalizedTeamName);
  await recalculatePortfolios();
  return calculateInvestmentPortfolio(accountId);
}

async function findInvestmentAccountByNormalizedTeamName(
  competitionId: string,
  normalizedTeamName: string,
  displayTeamName?: string
) {
  if (!normalizedTeamName) return null;

  try {
    const rows = await selectRows("investment_accounts", {
      select: "*",
      competition_id: `eq.${competitionId}`,
      normalized_team_name: `eq.${normalizedTeamName}`,
      limit: "1"
    });
    if (Array.isArray(rows) && rows[0]) return rows[0];
  } catch {
    // Older Supabase schemas may not have normalized_team_name yet.
  }

  if (displayTeamName) {
    try {
      const rows = await selectRows("investment_accounts", {
        select: "*",
        competition_id: `eq.${competitionId}`,
        team_name: `ilike.${displayTeamName}`,
        limit: "10"
      });
      if (Array.isArray(rows)) {
        const exact = rows.find((row) => normalizeInvestmentTeamNameKey(rowString(row, "team_name")) === normalizedTeamName);
        if (exact) return exact;
      }
    } catch {
      // Fall back to the legacy scan only for older schemas.
    }
  }

  try {
    const rows = await selectRows("investment_accounts", {
      select: "*",
      competition_id: `eq.${competitionId}`,
      limit: "1000"
    });
    if (!Array.isArray(rows)) return null;
    return rows.find((row) => normalizeInvestmentTeamNameKey(rowString(row, "team_name")) === normalizedTeamName) ?? null;
  } catch {
    return null;
  }
}

function investmentTeamAccessErrorDetails(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown team access error");
  const jsonCode = message.match(/"code"\s*:\s*"([^"]+)"/i)?.[1] ?? null;
  const postgresCode = message.match(/\b(23\d{3}|PGRST\d+)\b/i)?.[1] ?? null;
  return { message, code: jsonCode ?? postgresCode };
}

function recordInvestmentTeamAccessError(diagnostics: InvestmentTeamAccessDiagnostics | undefined, error: unknown) {
  if (!diagnostics) return;
  const details = investmentTeamAccessErrorDetails(error);
  diagnostics.supabaseErrorMessage = details.message;
  diagnostics.supabaseErrorCode = details.code;
}

function buildTeamSessionAccount(accountRow: Payload, competition: InvestmentCompetitionView): InvestmentAccountView {
  const startingCash = rowNumber(accountRow, "starting_cash", competition.startingCash);
  const cash = rowNumber(accountRow, "cash_balance", rowNumber(accountRow, "cash", startingCash));
  const totalReturn = startingCash > 0 ? ((cash - startingCash) / startingCash) * 100 : 0;
  const formulaBreakdown: InvestmentPortfolioFormulaBreakdown = {
    cash,
    normalHoldingsValue: 0,
    lockedMargin: 0,
    openExposure: 0,
    holdingsUnrealizedPnl: 0,
    positionsUnrealizedPnl: 0,
    totalUnrealizedPnl: 0,
    openPositionValue: 0,
    totalPortfolioValue: cash,
    profitLoss: cash - startingCash,
    returnPercent: totalReturn
  };
  return {
    account: {
      id: rowString(accountRow, "id"),
      competitionId: competition.id,
      teamName: rowString(accountRow, "team_name"),
      participantLogin: rowNullableString(accountRow, "participant_login"),
      startingCash,
      cash
    },
    competition,
    holdings: [],
    positions: [],
    trades: [],
    thesis: null,
    quotes: [],
    portfolio: {
      startingCash,
      cash,
      holdingsValue: 0,
      lockedMargin: 0,
      totalExposure: 0,
      unrealizedPnl: 0,
      holdingsUnrealizedPnl: 0,
      totalUnrealizedPnl: 0,
      openPositionValue: 0,
      totalValue: cash,
      dailyChange: 0,
      totalReturn,
      diversificationScore: 0,
      riskScore: 100,
      formulaBreakdown
    },
    portfolioDebug: {
      cashBalance: cash,
      legacyHoldingsCount: 0,
      legacyHoldingsValue: 0,
      openPositionsCount: 0,
      lockedMargin: 0,
      openExposure: 0,
      holdingsUnrealizedPnl: 0,
      unrealizedPnl: 0,
      totalUnrealizedPnl: 0,
      openPositionValue: 0,
      calculatedPortfolioValue: cash,
      formulaBreakdown,
      pricesUsed: []
    },
    marketStatus: getMarketStatus(),
    currentRank: null
  };
}

async function updateInvestmentAccountNormalizedName(accountRow: Payload, normalizedTeamName: string) {
  const accountId = rowString(accountRow, "id");
  if (!accountId || !normalizedTeamName || rowNullableString(accountRow, "normalized_team_name")) return;
  await updateRows(
    "investment_accounts",
    { id: `eq.${accountId}` },
    { normalized_team_name: normalizedTeamName, updated_at: new Date().toISOString() }
  ).catch(() => null);
}

export async function createOrEnterInvestmentTeam(input: {
  competitionCode: string;
  teamName: string;
  password: string;
  mode: "create" | "login";
}, diagnostics?: InvestmentTeamAccessDiagnostics): Promise<
  | { ok: true; session: InvestmentTeamSessionView }
  | { ok: false; status: number; reason: string }
> {
  const fail = (status: number, reason: string) => {
    if (diagnostics) diagnostics.finalErrorReason = reason;
    return { ok: false as const, status, reason };
  };
  const timed = async <T>(step: string, operation: () => Promise<T>) => {
    const startedAt = Date.now();
    try {
      return await operation();
    } catch (error) {
      recordInvestmentTeamAccessError(diagnostics, error);
      throw error;
    } finally {
      if (diagnostics) diagnostics.steps[step] = Date.now() - startedAt;
    }
  };

  if (!supabaseConfigured()) {
    return fail(503, "Supabase is not configured for team portfolios yet.");
  }

  const competitionCode = input.competitionCode.trim();
  const teamName = normalizeInvestmentTeamDisplayName(input.teamName);
  const normalizedTeamName = normalizeInvestmentTeamNameKey(teamName);
  const password = input.password;
  const mode = input.mode;

  if (!competitionCode) return fail(400, "Competition code is required.");
  if (!teamName) return fail(400, "Team name is required.");
  if (!password) return fail(400, "Team password is required.");
  if (mode !== "create" && mode !== "login") return fail(400, "Choose whether to create a team or log in.");

  const competition = await timed("competitionLookupMs", () => resolveExistingInvestmentCompetition(competitionCode));
  if (!competition) return fail(404, "Competition not found.");

  let accountRow = await timed("accountLookupMs", () =>
    findInvestmentAccountByNormalizedTeamName(competition.id, normalizedTeamName, teamName)
  );
  const created = mode === "create";
  const message = created ? "Team created successfully." : "Welcome back to your team portfolio.";

  if (mode === "login") {
    if (!accountRow) {
      return fail(404, "Team not found. Please check the spelling or create a new team.");
    }
    const storedPasswordHash = rowNullableString(accountRow, "password_hash");
    if (storedPasswordHash) {
      const passwordMatches = await timed("passwordVerificationMs", () => verifyTeamPassword(password, storedPasswordHash));
      if (!passwordMatches) return fail(401, "Invalid team password.");
    } else {
      const existingAccountId = rowString(accountRow, "id");
      const passwordHash = await timed("passwordHashMs", () => hashTeamPassword(password));
      try {
        const updated = await timed("legacyPasswordUpdateMs", () =>
          updateRows(
            "investment_accounts",
            { id: `eq.${existingAccountId}` },
            { password_hash: passwordHash, last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          )
        );
        accountRow = Array.isArray(updated) && updated[0] ? updated[0] : { ...accountRow, password_hash: passwordHash };
      } catch (error) {
        recordInvestmentTeamAccessError(diagnostics, error);
        return fail(500, "Team password storage is not configured yet.");
      }
    }
    const normalizedStartedAt = Date.now();
    await updateInvestmentAccountNormalizedName(accountRow, normalizedTeamName);
    if (diagnostics) diagnostics.steps.normalizedNameUpdateMs = Date.now() - normalizedStartedAt;
  } else {
    if (accountRow) {
      await updateInvestmentAccountNormalizedName(accountRow, normalizedTeamName);
      return fail(409, "This team already exists. Please log in to the existing team instead.");
    }

    const passwordHash = await timed("passwordHashMs", () => hashTeamPassword(password));
    const accountPayload = {
      competition_id: competition.id,
      team_name: teamName,
      normalized_team_name: normalizedTeamName,
      participant_login: null,
      starting_cash: competition.startingCash,
      cash: competition.startingCash,
      cash_balance: competition.startingCash,
      password_hash: passwordHash,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      await timed("accountInsertMs", () => insertRow("investment_accounts", accountPayload));
    } catch (error) {
      recordInvestmentTeamAccessError(diagnostics, error);
      const message = error instanceof Error ? error.message : "";
      if (/duplicate|unique|409|23505/i.test(message)) {
        return fail(409, "This team already exists. Please log in to the existing team instead.");
      }
      if (!/normalized_team_name|cash_balance|schema cache|column/i.test(message)) {
        return fail(500, "Team password storage is not configured yet.");
      }
      const { cash_balance: _cashBalance, normalized_team_name: _normalizedTeamName, ...legacyPayload } = accountPayload;
      try {
        await timed("legacyAccountInsertMs", () => insertRow("investment_accounts", legacyPayload));
      } catch (legacyError) {
        recordInvestmentTeamAccessError(diagnostics, legacyError);
        const legacyMessage = legacyError instanceof Error ? legacyError.message : "";
        if (/duplicate|unique|409|23505/i.test(legacyMessage)) {
          return fail(409, "This team already exists. Please log in to the existing team instead.");
        }
        return fail(500, "Team password storage is not configured yet.");
      }
    }
    accountRow = await timed("createdAccountLookupMs", () =>
      findInvestmentAccountByNormalizedTeamName(competition.id, normalizedTeamName, teamName)
    );
    if (!accountRow) {
      return fail(500, "Could not create team portfolio.");
    }
    await updateInvestmentAccountNormalizedName(accountRow, normalizedTeamName);
  }

  if (mode === "login") {
    const lastLoginStartedAt = Date.now();
    try {
      await updateRows(
        "investment_accounts",
        { id: `eq.${rowString(accountRow, "id")}` },
        { last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      );
    } catch (error) {
      recordInvestmentTeamAccessError(diagnostics, error);
      // Last-login telemetry is non-critical and must not block team access.
    } finally {
      if (diagnostics) diagnostics.steps.lastLoginUpdateMs = Date.now() - lastLoginStartedAt;
    }
  }

  const account = buildTeamSessionAccount(accountRow, competition);
  if (!account.account.id) return fail(500, "Could not load team portfolio.");

  return {
    ok: true,
    session: {
      account,
      competition: account.competition,
      created,
      message
    }
  };
}

export async function getInvestmentAccountView(accountId: string) {
  if (!supabaseConfigured()) return null;
  return calculateInvestmentPortfolio(accountId);
}

export async function calculateInvestmentPortfolio(accountId: string, competitionId?: string | null) {
  if (!supabaseConfigured()) return null;
  const quotes = await listInvestmentAssetQuotes();
  const priceMap = marketPriceMapFromQuotes(quotes);
  const view = await buildInvestmentAccountView(accountId, priceMap);
  if (!view) return null;
  if (competitionId && view.account.competitionId !== competitionId) return null;
  return view;
}

export async function calculateTeamPortfolioValue(teamId: string, competitionId?: string | null) {
  if (!supabaseConfigured()) return null;
  const view = await calculateInvestmentPortfolio(teamId, competitionId);
  if (!view) return null;
  const openPositions = view.positions.filter((position) => position.status === "open");
  return {
    startingCash: view.portfolio.startingCash,
    cashBalance: view.portfolio.cash,
    holdingsValue: view.portfolio.holdingsValue,
    legacyHoldingsValue: view.portfolio.holdingsValue,
    lockedMargin: view.portfolio.lockedMargin,
    openExposure: view.portfolio.totalExposure,
    unrealizedPnl: view.portfolio.formulaBreakdown.totalUnrealizedPnl,
    holdingsUnrealizedPnl: view.portfolio.formulaBreakdown.holdingsUnrealizedPnl,
    positionsUnrealizedPnl: view.portfolio.formulaBreakdown.positionsUnrealizedPnl,
    totalUnrealizedPnl: view.portfolio.formulaBreakdown.totalUnrealizedPnl,
    openPositionValue: view.portfolio.formulaBreakdown.openPositionValue,
    portfolioValue: view.portfolio.totalValue,
    profitLoss: view.portfolio.formulaBreakdown.profitLoss,
    returnPercent: view.portfolio.totalReturn,
    holdingsCount: view.holdings.length,
    openPositionsCount: openPositions.length,
    tradesCount: await getTradeCount(teamId),
    holdings: view.holdings,
    openPositions,
    pricesUsed: view.portfolioDebug.pricesUsed,
    portfolioDebug: view.portfolioDebug,
    formulaBreakdown: view.portfolio.formulaBreakdown
  };
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
  const competition = await getCompetitionById(rowString(account, "competition_id"));
  if (!competition) return rejectTrade(account, normalizeSymbol(input.symbol), input.side, Number(input.quantity), "Competition was not found.");

  const quantity = Number(input.quantity);
  const normalizedSymbol = normalizeSymbol(input.symbol);
  if (input.side !== "buy" && input.side !== "sell") return rejectTrade(account, normalizedSymbol, input.side, quantity, "Invalid trade side.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return rejectTrade(account, normalizedSymbol, input.side, quantity, "Quantity must be a positive whole number of shares.");
  }
  if (competition.runtimeStatus === "not_started") {
    return rejectTrade(
      account,
      normalizedSymbol,
      input.side,
      quantity,
      `Competition has not started yet. Trading opens ${competition.startAt ? new Date(competition.startAt).toLocaleString("en-US", { timeZone: "America/New_York" }) : "when the organizer starts it"}.`
    );
  }
  if (competition.runtimeStatus === "closed") {
    return rejectTrade(account, normalizedSymbol, input.side, quantity, "Competition closed. Rankings are now final.");
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
    return rejectTrade(account, asset.symbol, input.side, quantity, "Latest cached stock price is unavailable.");
  }

  const cash = rowNumber(account, "cash", rowNumber(account, "cash_balance"));
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
    await saveTrade(account, asset.symbol, asset.name, "buy", quantity, price, gross, fee, totalCost, latest.priceDate, latest.priceSource, latest.fetchedAt);
    await upsertHolding(account, asset.symbol, asset.name, newQuantity, newAverage, holding ? rowNumber(holding, "realized_gain_loss") : 0);
    await updateInvestmentAccountCash(rowString(account, "id"), cash - totalCost);
  } else {
    if (currentQuantity < quantity) {
      return rejectTrade(account, asset.symbol, "sell", quantity, "You cannot sell more shares than you own.");
    }

    const avg = holding ? rowNumber(holding, "average_buy_price") : 0;
    const proceeds = gross - fee;
    const previousRealized = holding ? rowNumber(holding, "realized_gain_loss") : 0;
    const realized = previousRealized + (price - avg) * quantity - fee;
    const newQuantity = currentQuantity - quantity;
    await saveTrade(account, asset.symbol, asset.name, "sell", quantity, price, gross, fee, proceeds, latest.priceDate, latest.priceSource, latest.fetchedAt);
    await upsertHolding(account, asset.symbol, asset.name, newQuantity, newQuantity > 0 ? avg : 0, realized);
    await updateInvestmentAccountCash(rowString(account, "id"), cash + proceeds);
  }

  await recalculatePortfolios();
  const view = await calculateInvestmentPortfolio(rowString(account, "id"));
  return { ok: true as const, account: view, price, fee, gross, net: input.side === "buy" ? gross + fee : gross - fee };
}

export async function openInvestmentPosition(input: {
  accountId: string;
  symbol: string;
  side: "long" | "short";
  quantity: number;
  leverage: number;
}) {
  if (!supabaseConfigured()) return { ok: false as const, reason: "Supabase is not configured for leveraged positions yet." };

  const account = await getAccountRow(input.accountId);
  if (!account) return { ok: false as const, reason: "Investment account was not found." };
  const competition = await getCompetitionById(rowString(account, "competition_id"));
  if (!competition) return { ok: false as const, reason: "Competition was not found." };
  if (competition.runtimeStatus === "not_started") return { ok: false as const, reason: "Competition has not started yet." };
  if (competition.runtimeStatus === "closed") return { ok: false as const, reason: "Competition closed. Rankings are now final." };
  const status = getMarketStatus();
  if (!status.isOpen) return { ok: false as const, reason: status.message };

  const side = input.side === "short" ? "short" : "long";
  const quantity = Number(input.quantity);
  const leverage = Number(input.leverage);
  if (!Number.isInteger(quantity) || quantity <= 0) return { ok: false as const, reason: "Quantity must be a positive whole number of shares." };
  if (![1, 2, 3].includes(leverage)) return { ok: false as const, reason: "Max leverage is x3." };

  const validation = await validateAsset(normalizeSymbol(input.symbol));
  if (!validation.ok) return { ok: false as const, reason: validation.reason };
  const asset = validation.asset;
  const latest = validation.price;
  const price = latest.latestClose;
  if (!price || !Number.isFinite(price) || price <= 0) return { ok: false as const, reason: "Price unavailable." };

  const currentView = await calculateInvestmentPortfolio(rowString(account, "id"));
  const portfolioValue = Math.max(currentView?.portfolio.totalValue ?? rowNumber(account, "cash", rowNumber(account, "cash_balance", INVESTMENT_STARTING_CASH)), 1);
  const currentExposure = currentView?.portfolio.totalExposure ?? 0;
  const exposure = quantity * price;
  const margin = exposure / leverage;
  const fee = exposure * INVESTMENT_TRANSACTION_FEE_RATE;
  const totalRequiredCash = margin + fee;
  const cash = rowNumber(account, "cash", rowNumber(account, "cash_balance"));

  if (margin > portfolioValue * 0.3 + 0.00001) return { ok: false as const, reason: "Position exceeds 30% margin limit." };
  if (currentExposure + exposure > portfolioValue * 1.5 + 0.00001) return { ok: false as const, reason: "Total exposure limit exceeded." };
  if (totalRequiredCash > cash + 0.00001) {
    return { ok: false as const, reason: `Insufficient cash. Required margin plus commission is ${formatTradeUsd(totalRequiredCash)}.` };
  }

  const now = new Date().toISOString();
  const positionId = randomUUID();
  const positionPayload = {
    id: positionId,
    competition_id: rowString(account, "competition_id"),
    team_id: rowString(account, "id"),
    symbol: asset.symbol,
    asset_name: asset.name,
    side,
    quantity,
    entry_price: price,
    current_price: price,
    leverage,
    margin_locked: margin,
    exposure_value: exposure,
    unrealized_pnl: 0,
    realized_pnl: 0,
    status: "open",
    opened_at: now,
    updated_at: now
  };

  try {
    await insertRow("investment_positions", positionPayload);
  } catch {
    return { ok: false as const, reason: "Leveraged positions table is not configured yet." };
  }

  await updateInvestmentAccountCash(rowString(account, "id"), cash - totalRequiredCash);
  await savePositionTrade({
    account,
    positionId,
    symbol: asset.symbol,
    assetName: asset.name,
    action: side === "short" ? "open_short" : "open_long",
    side,
    quantity,
    price,
    gross: exposure,
    fee,
    net: totalRequiredCash,
    leverage,
    margin,
    exposure,
    realizedPnl: 0,
    priceDate: latest.priceDate,
    priceSource: latest.priceSource,
    priceTimestamp: latest.fetchedAt
  });

  await recalculatePortfolios();
  await updateInvestmentLeaderboard(competition.code);
  const view = await calculateInvestmentPortfolio(rowString(account, "id"));
  return { ok: true as const, account: view, price, fee, margin, exposure };
}

export async function closeInvestmentPosition(input: { accountId: string; positionId: string }) {
  if (!supabaseConfigured()) return { ok: false as const, reason: "Supabase is not configured for leveraged positions yet." };

  const account = await getAccountRow(input.accountId);
  if (!account) return { ok: false as const, reason: "Investment account was not found." };
  const competition = await getCompetitionById(rowString(account, "competition_id"));
  if (!competition) return { ok: false as const, reason: "Competition was not found." };
  if (competition.runtimeStatus === "closed") return { ok: false as const, reason: "Competition closed. Rankings are now final." };
  const status = getMarketStatus();
  if (!status.isOpen) return { ok: false as const, reason: status.message };

  const position = await getPositionRow(input.positionId, rowString(account, "id")).catch(() => null);
  if (!position) return { ok: false as const, reason: "Position was not found." };
  if (positionStatus(position) !== "open") return { ok: false as const, reason: "Position is already closed." };

  const symbol = normalizeSymbol(rowString(position, "symbol"));
  const validation = await validateAsset(symbol);
  if (!validation.ok) return { ok: false as const, reason: validation.reason };
  const price = validation.price.latestClose;
  if (!price || !Number.isFinite(price) || price <= 0) return { ok: false as const, reason: "Price unavailable." };

  const side = positionSide(position);
  const quantity = rowNumber(position, "quantity");
  const leverage = Math.max(1, rowNumber(position, "leverage", 1));
  const margin = rowNumber(position, "margin_locked");
  const exposure = quantity * price;
  const rawPnl = calculatePositionPnl(side, rowNumber(position, "entry_price"), price, quantity, leverage);
  const liquidated = rawPnl <= -margin;
  const realizedPnl = liquidated ? -margin : Math.max(rawPnl, -margin);
  const fee = liquidated ? 0 : exposure * INVESTMENT_TRANSACTION_FEE_RATE;
  const cashReturned = Math.max(0, liquidated ? 0 : margin + realizedPnl - fee);
  const now = new Date().toISOString();

  await updateRows(
    "investment_positions",
    { id: `eq.${rowString(position, "id")}` },
    {
      current_price: price,
      exposure_value: exposure,
      unrealized_pnl: 0,
      realized_pnl: realizedPnl,
      status: liquidated ? "liquidated" : "closed",
      closed_at: now,
      updated_at: now
    }
  );

  const cash = rowNumber(account, "cash", rowNumber(account, "cash_balance"));
  await updateInvestmentAccountCash(rowString(account, "id"), cash + cashReturned);
  await savePositionTrade({
    account,
    positionId: rowString(position, "id"),
    symbol,
    assetName: rowNullableString(position, "asset_name") ?? validation.asset.name,
    action: liquidated ? "liquidated" : side === "short" ? "close_short" : "close_long",
    side,
    quantity,
    price,
    gross: exposure,
    fee,
    net: cashReturned,
    leverage,
    margin,
    exposure,
    realizedPnl,
    priceDate: validation.price.priceDate,
    priceSource: validation.price.priceSource,
    priceTimestamp: validation.price.fetchedAt
  });

  await recalculatePortfolios();
  await updateInvestmentLeaderboard(competition.code);
  const view = await calculateInvestmentPortfolio(rowString(account, "id"));
  return { ok: true as const, account: view, price, fee, margin, exposure, realizedPnl, liquidated };
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

export async function createOrUpdateInvestmentCompetition(input: {
  code: string;
  name?: string;
  description?: string;
  startingCash?: number;
  startAt?: string;
  endAt?: string;
  status?: string;
  rankingMethod?: string;
  allowedAssets?: string;
  tradingRules?: string;
}) {
  if (!supabaseConfigured()) return null;
  const code = displayCompetitionCode(input.code);
  const slug = competitionCodeToSlug(code);
  const name = input.name?.trim() || competitionDisplayName(code);
  const startingCash = Number.isFinite(input.startingCash) && Number(input.startingCash) > 0 ? Number(input.startingCash) : INVESTMENT_STARTING_CASH;
  const startAt = input.startAt?.trim() || new Date().toISOString();
  const endAt = input.endAt?.trim() || null;
  const rows = await upsertCompetitionWithFallback({
    slug,
    code,
    title: name,
    name,
    description: input.description?.trim() || null,
    status: input.status === "draft" || input.status === "closed" ? input.status : "active",
    starting_cash: startingCash,
    starts_at: startAt,
    start_at: startAt,
    ends_at: endAt,
    end_at: endAt,
    allowed_assets: input.allowedAssets?.trim()
      ? input.allowedAssets
          .split(",")
          .map((item) => normalizeSymbol(item))
          .filter(Boolean)
      : null,
    trading_rules: input.tradingRules?.trim() ? { note: input.tradingRules.trim().slice(0, 1000) } : null,
    transaction_fee: INVESTMENT_TRANSACTION_FEE_RATE,
    ranking_method: input.rankingMethod?.trim() || "portfolio_value",
    updated_at: new Date().toISOString()
  });
  return Array.isArray(rows) && rows[0] ? mapCompetitionRow(rows[0]) : null;
}

export async function finalizeInvestmentCompetition(codeOrSlug: string) {
  if (!supabaseConfigured()) return { ok: false as const, reason: "Supabase is not configured." };
  const competition = await resolveInvestmentCompetition(codeOrSlug);
  if (!competition) return { ok: false as const, reason: "Competition was not found." };
  const payload = {
    status: "closed",
    finalized_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  try {
    await updateRows("investment_competitions", { id: `eq.${competition.id}` }, payload);
  } catch {
    await updateRows("investment_competitions", { id: `eq.${competition.id}` }, { status: "archived", updated_at: new Date().toISOString() });
  }
  const leaderboard = await updateInvestmentLeaderboard(competition.code);
  return { ok: true as const, competition: { ...competition, status: "closed", runtimeStatus: "closed" as const }, leaderboard };
}

export async function listInvestmentLeaderboard(competitionCodeOrSlug?: string | null) {
  if (!supabaseConfigured()) return { rows: [], persisted: false, competition: null };
  const competition = competitionCodeOrSlug ? await resolveInvestmentCompetition(competitionCodeOrSlug) : await ensureDefaultCompetition();
  await updateInvestmentLeaderboard(competition?.code ?? competitionCodeOrSlug);
  const query: Record<string, string> = {
    select: "*",
    order: "rank_position.asc,total_value.desc",
    limit: "100"
  };
  if (competition?.id) query.competition_id = `eq.${competition.id}`;
  const rows = await selectRows("investment_leaderboard", query);
  if (!Array.isArray(rows)) return { rows: [], persisted: false };
  return { rows: rows.map((row) => mapLeaderboardRow(row, competition ?? undefined)), persisted: true, competition };
}

export async function listInvestmentFinalResults(competitionCodeOrSlug?: string | null) {
  if (!supabaseConfigured()) return { rows: [], persisted: false, competition: null };
  const competition = await resolveInvestmentCompetition(competitionCodeOrSlug);
  if (!competition) return { rows: [], persisted: false, competition: null };
  await updateInvestmentLeaderboard(competition.code);
  let resultRows: Payload[] = [];
  try {
    const rows = await selectRows("investment_competition_results", {
      select: "*",
      competition_id: `eq.${competition.id}`,
      order: "final_rank.asc,final_value.desc",
      limit: "250"
    });
    resultRows = Array.isArray(rows) ? rows : [];
  } catch {
    resultRows = [];
  }
  if (!resultRows.length) {
    const leaderboard = await listInvestmentLeaderboard(competition.code);
    return { rows: leaderboard.rows, persisted: leaderboard.persisted, competition };
  }
  return {
    rows: resultRows.map((row) => ({
      rank: rowNumber(row, "final_rank"),
      accountId: rowString(row, "account_id"),
      teamId: rowString(row, "account_id"),
      competitionId: rowString(row, "competition_id"),
      competitionCode: competition.code,
      teamName: rowString(row, "team_name"),
      startingCash: rowNumber(row, "starting_cash"),
      cashBalance: 0,
      holdingsValue: 0,
      totalValue: rowNumber(row, "final_value"),
      profitLoss: rowNumber(row, "profit_loss"),
      totalReturn: rowNumber(row, "total_return"),
      tradeCount: rowNumber(row, "trade_count"),
      riskAdjustedScore: 0,
      diversificationScore: rowNumber(row, "diversification_score"),
      riskScore: rowNumber(row, "risk_score"),
      thesisScore: rowNumber(row, "thesis_score"),
      drawdownScore: 0,
      overallScore: 0,
      status: "closed",
      updatedAt: rowString(row, "finalized_at")
    })),
    persisted: true,
    competition
  };
}

export async function listInvestmentAdminBundle() {
  if (!supabaseConfigured()) {
    return { accounts: [], holdings: [], trades: [], theses: [], snapshots: [], leaderboard: [], competitions: [], stats: null, persisted: false };
  }
  // Refresh leaderboard with latest cached prices before reading so values are not stale.
  await updateInvestmentLeaderboard().catch(() => null);
  const [accounts, holdings, trades, theses, snapshots, leaderboard, competitionRows] = await Promise.all([
    selectRows("investment_accounts", { select: "*", order: "created_at.desc", limit: "500" }),
    selectRows("investment_holdings", { select: "*", order: "updated_at.desc", limit: "1000" }),
    selectRows("investment_trades", { select: "*", order: "created_at.desc", limit: "1000" }),
    selectRows("investment_theses", { select: "*", order: "updated_at.desc", limit: "500" }),
    selectRows("investment_portfolio_snapshots", { select: "*", order: "snapshot_date.desc", limit: "1000" }),
    selectRows("investment_leaderboard", { select: "*", order: "rank_position.asc", limit: "500" }),
    selectRows("investment_competitions", { select: "*", order: "created_at.desc", limit: "200" })
  ]);
  const leaderboardRows = Array.isArray(leaderboard) ? leaderboard : [];
  const returns = leaderboardRows.map((row) => rowNumber(row, "total_return")).filter((value) => Number.isFinite(value));
  const best = leaderboardRows.slice().sort((a, b) => rowNumber(b, "total_value") - rowNumber(a, "total_value"))[0] ?? null;
  const activeTeams = Array.isArray(accounts) ? accounts.filter((row) => rowNumber(row, "cash") !== rowNumber(row, "starting_cash")).length : 0;

  return {
    accounts: Array.isArray(accounts) ? accounts : [],
    holdings: Array.isArray(holdings) ? holdings : [],
    trades: Array.isArray(trades) ? trades : [],
    theses: Array.isArray(theses) ? theses : [],
    snapshots: Array.isArray(snapshots) ? snapshots : [],
    leaderboard: leaderboardRows,
    competitions: Array.isArray(competitionRows) ? competitionRows.map(mapCompetitionRow) : [],
    stats: {
      totalTeams: Array.isArray(accounts) ? accounts.length : 0,
      activeTeams,
      totalTrades: Array.isArray(trades) ? trades.filter((row) => !row.rejected).length : 0,
      averageReturn: returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0,
      bestTeam: best ? rowString(best, "team_name") : "n/a",
      bestValue: best ? rowNumber(best, "total_value") : 0
    },
    persisted: true
  };
}

export async function listInvestmentAdminResults(competitionCodeOrSlug = TEENVESTOR_CODE): Promise<InvestmentAdminResultsBundle> {
  if (!supabaseConfigured()) {
    return {
      persisted: false,
      competition: null,
      teams: [],
      stats: {
        totalTeams: 0,
        totalTrades: 0,
        averageReturn: 0,
        bestTeam: "n/a",
        totalSimulatedPortfolioValue: 0,
        competitionStatus: "not_configured"
      }
    };
  }

  const competition = await resolveInvestmentAdminCompetition(competitionCodeOrSlug);
  if (!competition) {
    return {
      persisted: true,
      competition: null,
      teams: [],
      stats: {
        totalTeams: 0,
        totalTrades: 0,
        averageReturn: 0,
        bestTeam: "n/a",
        totalSimulatedPortfolioValue: 0,
        competitionStatus: "missing"
      }
    };
  }

  await updateInvestmentLeaderboard(competition.code).catch(() => null);

  const accounts = await selectRows("investment_accounts", {
    select: "*",
    competition_id: `eq.${competition.id}`,
    order: "created_at.asc",
    limit: "1000"
  });

  const accountRows = Array.isArray(accounts) ? accounts : [];
  const quotes = await listInvestmentAssetQuotes();
  const priceMap = marketPriceMapFromQuotes(quotes);

  const teams = (
    await Promise.all(
      accountRows.map(async (account) => {
        const accountId = rowString(account, "id");
        const view = await buildInvestmentAccountView(accountId, priceMap);
        if (!view) return null;
        const openPositions = view.positions.filter((position) => position.status === "open");
        const tradesCount = await getTradeCount(accountId);
        const lastTradeActivity = latestIso(...view.trades.map((trade) => trade.executedAt ?? trade.createdAt));
        const lastPositionActivity = latestIso(
          ...view.positions.map((position) => position.closedAt ?? position.updatedAt ?? position.openedAt)
        );
        const lastActivity = latestIso(
          rowNullableString(account, "last_login_at"),
          rowNullableString(account, "updated_at"),
          rowNullableString(account, "created_at"),
          lastTradeActivity,
          lastPositionActivity
        );
        const formulaBreakdown = view.portfolio.formulaBreakdown;
        const profitLoss = formulaBreakdown.profitLoss;

        return {
          rank: 0,
          teamId: accountId,
          competitionId: competition.id,
          competitionCode: competition.code,
          teamName: view.account.teamName || rowString(account, "team_name"),
          startingCash: view.portfolio.startingCash,
          cashBalance: view.portfolio.cash,
          holdingsValue: view.portfolio.holdingsValue,
          lockedMargin: view.portfolio.lockedMargin,
          totalExposure: view.portfolio.totalExposure,
          unrealizedPnl: formulaBreakdown.totalUnrealizedPnl,
          holdingsUnrealizedPnl: formulaBreakdown.holdingsUnrealizedPnl,
          positionsUnrealizedPnl: formulaBreakdown.positionsUnrealizedPnl,
          totalUnrealizedPnl: formulaBreakdown.totalUnrealizedPnl,
          openPositionValue: formulaBreakdown.openPositionValue,
          totalPortfolioValue: view.portfolio.totalValue,
          formulaBreakdown,
          portfolioDebug: view.portfolioDebug,
          profitLoss,
          returnPercent: view.portfolio.totalReturn,
          tradesCount,
          holdingsCount: view.holdings.length,
          openPositionsCount: openPositions.length,
          lastActivity,
          status: competition.runtimeStatus === "closed"
            ? "closed"
            : tradesCount || view.holdings.length || openPositions.length
              ? "active"
              : "registered"
        } satisfies InvestmentAdminTeamResult;
      })
    )
  ).filter((team): team is InvestmentAdminTeamResult => Boolean(team));

  teams.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue || b.returnPercent - a.returnPercent || a.teamName.localeCompare(b.teamName));
  teams.forEach((team, index) => {
    team.rank = index + 1;
  });

  const totalTrades = teams.reduce((sum, team) => sum + team.tradesCount, 0);
  const totalSimulatedPortfolioValue = teams.reduce((sum, team) => sum + team.totalPortfolioValue, 0);
  const averageReturn = teams.length ? teams.reduce((sum, team) => sum + team.returnPercent, 0) / teams.length : 0;

  return {
    persisted: true,
    competition,
    teams,
    stats: {
      totalTeams: teams.length,
      totalTrades,
      averageReturn,
      bestTeam: teams[0]?.teamName ?? "n/a",
      totalSimulatedPortfolioValue,
      competitionStatus: competition.runtimeStatus
    }
  };
}

async function resolveInvestmentAdminCompetition(codeOrSlug = TEENVESTOR_CODE) {
  if (!supabaseConfigured()) return null;
  const code = displayCompetitionCode(codeOrSlug);
  const slug = competitionCodeToSlug(code);
  const lookupAttempts: Array<Record<string, string>> = [
    { select: "*", code: `eq.${code}`, limit: "1" },
    { select: "*", slug: `eq.${slug}`, limit: "1" },
    { select: "*", title: "ilike.*Teenvestor*", limit: "1" },
    { select: "*", name: "ilike.*Teenvestor*", limit: "1" }
  ];

  for (const query of lookupAttempts) {
    try {
      const rows = await selectRows("investment_competitions", query);
      if (Array.isArray(rows) && rows[0]) return mapCompetitionRow(rows[0]);
    } catch {
      // Some production schemas may not have code/name/title columns yet. Try the next lookup shape.
    }
  }

  return null;
}

export async function getInvestmentAdminTeamDetail(
  teamId: string,
  competitionCodeOrSlug = TEENVESTOR_CODE
): Promise<InvestmentAdminTeamDetail> {
  if (!supabaseConfigured()) return { persisted: false, competition: null, overview: null, holdings: [], positions: [], trades: [] };

  const competition = await resolveInvestmentAdminCompetition(competitionCodeOrSlug);
  if (!competition) return { persisted: true, competition: null, overview: null, holdings: [], positions: [], trades: [] };

  const account = await getAccountRow(teamId);
  if (!account || rowString(account, "competition_id") !== competition.id) {
    return { persisted: true, competition, overview: null, holdings: [], positions: [], trades: [] };
  }

  const results = await listInvestmentAdminResults(competition.code);
  const overviewBase = results.teams.find((team) => team.teamId === teamId) ?? null;
  const [accountView, tradeRows] = await Promise.all([
    calculateInvestmentPortfolio(teamId, competition.id),
    selectRows("investment_trades", { select: "*", account_id: `eq.${teamId}`, order: "created_at.desc", limit: "3000" })
  ]);
  const openPositions = accountView?.positions.filter((position) => position.status === "open") ?? [];
  const tradesCount = await getTradeCount(teamId);
  const lastTradeActivity = accountView ? latestIso(...accountView.trades.map((trade) => trade.executedAt ?? trade.createdAt)) : null;
  const lastPositionActivity = accountView
    ? latestIso(...accountView.positions.map((position) => position.closedAt ?? position.updatedAt ?? position.openedAt))
    : null;
  const lastActivity = latestIso(
    rowNullableString(account, "last_login_at"),
    rowNullableString(account, "updated_at"),
    rowNullableString(account, "created_at"),
    lastTradeActivity,
    lastPositionActivity
  );
  const totalValue =
    accountView?.portfolio.totalValue ??
    overviewBase?.totalPortfolioValue ??
    rowNumber(account, "cash", rowNumber(account, "cash_balance", INVESTMENT_STARTING_CASH));

  const holdings = (accountView?.holdings ?? []).map((holding) => ({
    symbol: holding.symbol,
    assetName: holding.assetName,
    quantity: holding.quantity,
    averageBuyPrice: holding.averageBuyPrice,
    latestPrice: holding.latestClose > 0 ? holding.latestClose : null,
    priceDate: holding.priceDate,
    marketValue: holding.latestClose > 0 ? holding.marketValue : null,
    unrealizedProfitLoss: holding.latestClose > 0 ? holding.unrealizedGainLoss : null,
    allocationPercent: totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0,
    priceWarning: holding.priceWarning ?? null
  } satisfies InvestmentAdminHoldingResult));

  const positions = (accountView?.positions ?? []).map((position) => ({
    ...position,
    marketValue: position.status === "open" ? position.marginLocked + position.unrealizedPnl : 0
  } satisfies InvestmentAdminPositionResult));

  const trades = (Array.isArray(tradeRows) ? tradeRows : []).map((row) => ({
    ...mapTradeRow(row),
    teamName: overviewBase?.teamName ?? rowString(account, "team_name")
  }));

  return {
    persisted: true,
    competition,
    overview: accountView
      ? {
          rank: overviewBase?.rank ?? 0,
          teamId,
          competitionId: competition.id,
          competitionCode: competition.code,
          teamName: accountView.account.teamName || rowString(account, "team_name"),
          startingCash: accountView.portfolio.startingCash,
          cashBalance: accountView.portfolio.cash,
          holdingsValue: accountView.portfolio.holdingsValue,
          lockedMargin: accountView.portfolio.lockedMargin,
          totalExposure: accountView.portfolio.totalExposure,
          unrealizedPnl: accountView.portfolio.formulaBreakdown.totalUnrealizedPnl,
          holdingsUnrealizedPnl: accountView.portfolio.formulaBreakdown.holdingsUnrealizedPnl,
          positionsUnrealizedPnl: accountView.portfolio.formulaBreakdown.positionsUnrealizedPnl,
          totalUnrealizedPnl: accountView.portfolio.formulaBreakdown.totalUnrealizedPnl,
          openPositionValue: accountView.portfolio.formulaBreakdown.openPositionValue,
          totalPortfolioValue: accountView.portfolio.totalValue,
          formulaBreakdown: accountView.portfolio.formulaBreakdown,
          portfolioDebug: accountView.portfolioDebug,
          profitLoss: accountView.portfolio.formulaBreakdown.profitLoss,
          returnPercent: accountView.portfolio.totalReturn,
          tradesCount,
          holdingsCount: accountView.holdings.length,
          openPositionsCount: openPositions.length,
          lastActivity,
          status: competition.runtimeStatus === "closed"
            ? "closed"
            : tradesCount || accountView.holdings.length || openPositions.length
              ? "active"
              : "registered",
          createdAt: rowNullableString(account, "created_at"),
          lastLoginAt: rowNullableString(account, "last_login_at"),
          updatedAt: rowNullableString(account, "updated_at")
        }
      : null,
    holdings,
    positions,
    trades
  };
}

async function listInvestmentHoldingsForCompetition(competitionId: string, accountIds: Set<string>) {
  try {
    const rows = await selectRows("investment_holdings", {
      select: "*",
      competition_id: `eq.${competitionId}`,
      order: "updated_at.desc",
      limit: "5000"
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    const allRows = await Promise.all(
      Array.from(accountIds).map((accountId) =>
        selectRows("investment_holdings", { select: "*", account_id: `eq.${accountId}`, order: "updated_at.desc", limit: "1000" }).catch(() => [])
      )
    );
    return allRows.flat().filter((row): row is Payload => Boolean(row && typeof row === "object"));
  }
}

async function listInvestmentTradesForCompetition(competitionId: string, accountIds: Set<string>) {
  try {
    const rows = await selectRows("investment_trades", {
      select: "*",
      competition_id: `eq.${competitionId}`,
      order: "created_at.desc",
      limit: "10000"
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    const allRows = await Promise.all(
      Array.from(accountIds).map((accountId) =>
        selectRows("investment_trades", { select: "*", account_id: `eq.${accountId}`, order: "created_at.desc", limit: "3000" }).catch(() => [])
      )
    );
    return allRows.flat().filter((row): row is Payload => Boolean(row && typeof row === "object"));
  }
}

async function listInvestmentPositionsForCompetition(competitionId: string, accountIds: Set<string>) {
  try {
    const rows = await selectRows("investment_positions", {
      select: "*",
      competition_id: `eq.${competitionId}`,
      order: "updated_at.desc,opened_at.desc",
      limit: "10000"
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    const allRows = await Promise.all(
      Array.from(accountIds).map((accountId) =>
        selectRows("investment_positions", { select: "*", team_id: `eq.${accountId}`, order: "updated_at.desc,opened_at.desc", limit: "3000" }).catch(() => [])
      )
    );
    return allRows.flat().filter((row): row is Payload => Boolean(row && typeof row === "object"));
  }
}

function groupRowsByTeam(rows: Payload[]) {
  const grouped = new Map<string, Payload[]>();
  for (const row of rows) {
    const teamId = rowString(row, "team_id") || rowString(row, "account_id");
    if (!teamId) continue;
    const list = grouped.get(teamId) ?? [];
    list.push(row);
    grouped.set(teamId, list);
  }
  return grouped;
}

function storedPriceRawPayload(row: Payload | null | undefined): Payload | null {
  const raw = row?.raw_source ?? row?.raw;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const payload = (raw as Payload).payload;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Payload) : (raw as Payload);
}

function resolveStoredInvestmentPrice(row: Payload | null | undefined, referencePrice = 0) {
  const raw = storedPriceRawPayload(row);
  const bidPrice = raw ? parsePositiveNumber(marketDataArrayField(raw, "bid")) : null;
  const lastPrice = raw ? parsePositiveNumber(marketDataArrayField(raw, "last")) : null;
  const cachedPrice = row ? parsePositiveNumber(row.price) ?? parsePositiveNumber(row.close_price) : null;
  const fallbackPrice = parsePositiveNumber(referencePrice);
  const price = bidPrice ?? lastPrice ?? cachedPrice ?? fallbackPrice;
  const priceDate = row ? rowString(row, "trading_day") || rowString(row, "price_date") : null;
  const fetchedAt = row ? rowNullableString(row, "fetched_at") ?? rowNullableString(row, "updated_at") : null;
  const source = bidPrice
    ? "bid"
    : lastPrice
      ? "last"
      : cachedPrice
        ? "cache"
        : fallbackPrice
          ? "reference"
          : "unavailable";

  return { price, priceDate, fetchedAt, source };
}

export async function listInvestmentAssetQuotes(): Promise<InvestmentAssetQuote[]> {
  const assets = await listInvestmentAssets();
  let storedRows: Payload[] = [];
  if (supabaseConfigured()) {
    try {
      const rows = await selectRows("investment_daily_prices", {
        select: "symbol,price_date,trading_day,close_price,price,currency,provider,endpoint,fetched_at,updated_at,raw,raw_source",
        order: "fetched_at.desc,price_date.desc",
        limit: "400"
      });
      storedRows = Array.isArray(rows) ? rows : [];
    } catch {
      try {
        const rows = await selectRows("investment_daily_prices", {
          select: "symbol,price_date,trading_day,close_price,price,currency,provider,endpoint,fetched_at,updated_at",
          order: "fetched_at.desc,price_date.desc",
          limit: "400"
        });
        storedRows = Array.isArray(rows) ? rows : [];
      } catch {
        storedRows = [];
      }
    }
  }
  const latestBySymbol = new Map<string, Payload>();
  for (const row of storedRows) {
    const symbol = rowString(row, "symbol");
    if (!latestBySymbol.has(symbol)) latestBySymbol.set(symbol, row);
  }

  return assets.map((asset) => {
    const stored = latestBySymbol.get(asset.symbol);
    const resolvedPrice = resolveStoredInvestmentPrice(stored, asset.referencePrice);
    const marketStatus = getMarketStatus();
    const cacheFresh = stored ? isCachedQuoteFresh({ fetchedAt: resolvedPrice.fetchedAt, priceDate: resolvedPrice.priceDate }, marketStatus) : false;
    const isStale = Boolean(stored && marketStatus.isOpen && !cacheFresh);
    return {
      ...asset,
      latestClose: resolvedPrice.price ?? asset.referencePrice,
      priceDate: resolvedPrice.priceDate,
      provider: stored ? rowString(stored, "provider") || "stored" : "educational_reference",
      priceAvailable: Boolean(stored) || (asset.referencePrice > 0),
      priceSource: stored ? ("cache" as const) : ("reference" as const),
      fetchedAt: resolvedPrice.fetchedAt,
      currency: stored ? rowString(stored, "currency") || "USD" : asset.currency ?? "USD",
      cacheStatus: stored ? (cacheFresh ? ("fresh" as const) : ("cached" as const)) : ("missing" as const),
      canTrade: Boolean(stored && marketStatus.isOpen && cacheFresh),
      isStale,
      staleReason: isStale ? "Fresh price is temporarily unavailable for this asset." : null,
      providerUpdatedAt: null,
      providerUpdatedAtEt: null,
      priceMessage: isStale
        ? "Fresh price is temporarily unavailable for this asset."
        : resolvedPrice.priceDate
          ? `Using saved ${resolvedPrice.source} price from ${resolvedPrice.fetchedAt ? new Date(resolvedPrice.fetchedAt).toLocaleString("en-US") : resolvedPrice.priceDate}.`
        : stored
          ? "No saved price yet. Select the asset to fetch the latest price."
          : "Reference price. Live price updates every 15 min during market hours."
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

async function recordInvestmentAssetEvent(symbol: string, eventType: "search" | "select" | "trade" | "hold") {
  if (!supabaseConfigured()) return null;
  const normalized = normalizeSymbol(symbol);
  if (!isSupportedSymbol(normalized)) return null;
  try {
    return await insertRow("investment_asset_watchlist_events", {
      symbol: normalized,
      event_type: eventType,
      created_at: new Date().toISOString()
    });
  } catch {
    return null;
  }
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

async function searchYahooAssets(query: string): Promise<InvestmentAssetSearchResult[]> {
  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const result = (await yahooFinance.search(query, { quotesCount: 12, newsCount: 0 })) as Payload;
    const quotes = Array.isArray(result.quotes) ? (result.quotes as Payload[]) : [];
    return quotes
      .map((quote, index) => mapYahooSearchMatch(quote, index))
      .filter((asset): asset is InvestmentAssetSearchResult => Boolean(asset))
      .slice(0, 12);
  } catch {
    return [];
  }
}

function mapYahooSearchMatch(match: Payload, index: number): InvestmentAssetSearchResult | null {
  const symbol = normalizeSymbol(String(match.symbol ?? ""));
  if (!isSupportedSymbol(symbol)) return null;
  const quoteType = String(match.quoteType ?? match.typeDisp ?? "").toLowerCase();
  const type = quoteType.includes("etf") || quoteType.includes("fund") ? "ETF" : "Stock";
  if (!quoteType.includes("equity") && !quoteType.includes("etf") && !quoteType.includes("fund") && quoteType) {
    return null;
  }
  const exchange = String(match.exchDisp ?? match.exchange ?? "").trim() || null;
  return {
    symbol,
    name: sanitizeAssetName(match.longname ?? match.shortname ?? match.name, symbol),
    type,
    theme: type === "ETF" ? "Exchange-traded fund" : "US-listed company",
    referencePrice: getInvestmentAsset(symbol)?.referencePrice ?? 0,
    region: "United States",
    currency: "USD",
    exchange,
    featured: Boolean(getInvestmentAsset(symbol)?.featured),
    matchScore: Math.max(0.1, 1 - index / 20),
    priceAvailable: false,
    latestClose: null,
    priceDate: null
  };
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

function mapCompetitionRow(row: Payload): InvestmentCompetitionView {
  const slug = rowString(row, "slug") || competitionCodeToSlug(rowString(row, "code"));
  const code = rowString(row, "code") || slug || DEFAULT_INVESTMENT_COMPETITION_SLUG;
  const isTeenvestor = slug === TEENVESTOR_SLUG || competitionCodeToSlug(code) === TEENVESTOR_SLUG;
  const name = isTeenvestor ? competitionDisplayName(code) : rowString(row, "name") || rowString(row, "title") || competitionDisplayName(code);
  const startAt = rowNullableString(row, "start_at") ?? rowNullableString(row, "starts_at");
  const endAt = rowNullableString(row, "end_at") ?? rowNullableString(row, "ends_at");
  const status = rowString(row, "status") || "active";
  const competition: InvestmentCompetitionView = {
    id: rowString(row, "id"),
    slug,
    code,
    name,
    description: rowNullableString(row, "description"),
    startingCash: rowNumber(row, "starting_cash", INVESTMENT_STARTING_CASH),
    startAt,
    endAt,
    status,
    runtimeStatus: "active",
    transactionFee: rowNumber(row, "transaction_fee", INVESTMENT_TRANSACTION_FEE_RATE),
    rankingMethod: rowString(row, "ranking_method") || "portfolio_value",
    isTeenvestor,
    welcomeMessage: null
  };
  competition.runtimeStatus = runtimeStatusForCompetition(competition);
  competition.welcomeMessage = competition.isTeenvestor ? "Welcome to the Teenvestor Investment Competition." : null;
  return competition;
}

async function upsertCompetitionWithFallback(payload: Payload) {
  try {
    return await upsertRow("investment_competitions", payload, "slug");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/code|name|description|start_at|end_at|allowed_assets|trading_rules|transaction_fee|ranking_method|finalized_at|schema cache|column/i.test(message)) {
      throw error;
    }
    const legacyPayload = { ...payload };
    delete legacyPayload.code;
    delete legacyPayload.name;
    delete legacyPayload.description;
    delete legacyPayload.start_at;
    delete legacyPayload.end_at;
    delete legacyPayload.allowed_assets;
    delete legacyPayload.trading_rules;
    delete legacyPayload.transaction_fee;
    delete legacyPayload.ranking_method;
    delete legacyPayload.finalized_at;
    if (legacyPayload.status === "closed") legacyPayload.status = "archived";
    return upsertRow("investment_competitions", legacyPayload, "slug");
  }
}

async function getCompetitionById(competitionId: string): Promise<InvestmentCompetitionView | null> {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await selectRows("investment_competitions", {
      select: "*",
      id: `eq.${competitionId}`,
      limit: "1"
    });
    return Array.isArray(rows) && rows[0] ? mapCompetitionRow(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function resolveInvestmentCompetition(codeOrSlug?: string | null): Promise<InvestmentCompetitionView | null> {
  if (!supabaseConfigured()) return null;
  await ensureInvestmentSeedData(false);
  const code = displayCompetitionCode(codeOrSlug);
  const slug = competitionCodeToSlug(code);

  try {
    const bySlug = await selectRows("investment_competitions", {
      select: "*",
      slug: `eq.${slug}`,
      limit: "1"
    });
    if (Array.isArray(bySlug) && bySlug[0]) return mapCompetitionRow(bySlug[0]);
  } catch {
    // Fall back to creation below.
  }

  return ensureDefaultCompetition(code);
}

export async function resolveExistingInvestmentCompetition(codeOrSlug?: string | null): Promise<InvestmentCompetitionView | null> {
  if (!supabaseConfigured()) return null;
  const rawCode = codeOrSlug?.trim();
  if (!rawCode) return null;
  const code = displayCompetitionCode(rawCode);
  const slug = competitionCodeToSlug(code);

  if (slug !== TEENVESTOR_SLUG) await ensureInvestmentSeedData(false);

  try {
    const bySlug = await selectRows("investment_competitions", {
      select: "*",
      slug: `eq.${slug}`,
      limit: "1"
    });
    if (Array.isArray(bySlug) && bySlug[0]) return mapCompetitionRow(bySlug[0]);
  } catch {
    // Try exact code lookup below.
  }

  try {
    const byCode = await selectRows("investment_competitions", {
      select: "*",
      code: `eq.${code}`,
      limit: "1"
    });
    if (Array.isArray(byCode) && byCode[0]) return mapCompetitionRow(byCode[0]);
  } catch {
    // Create the official fallback below if Supabase does not have it yet.
  }

  return slug === TEENVESTOR_SLUG ? ensureDefaultCompetition(TEENVESTOR_CODE) : null;
}

async function ensureDefaultCompetition(codeInput = DEFAULT_INVESTMENT_COMPETITION_SLUG) {
  const code = displayCompetitionCode(codeInput);
  const slug = competitionCodeToSlug(code);
  const isTeenvestor = slug === TEENVESTOR_SLUG;
  const now = new Date();
  const defaultEnd = new Date(now);
  defaultEnd.setUTCDate(defaultEnd.getUTCDate() + (isTeenvestor ? 30 : 365));
  const defaultStart = isTeenvestor ? new Date(Date.UTC(2026, 5, 22, 13, 30, 0, 0)) : now;
  if (isTeenvestor) defaultEnd.setTime(defaultStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  const name = competitionDisplayName(code);
  const description = isTeenvestor
    ? "A private educational virtual portfolio competition for Teenvestor.school teams."
    : "A public educational virtual portfolio competition on Phronesia.";
  const rows = await upsertCompetitionWithFallback({
    slug,
    code,
    title: name,
    name,
    description,
    status: "active",
    starting_cash: INVESTMENT_STARTING_CASH,
    starts_at: defaultStart.toISOString(),
    start_at: defaultStart.toISOString(),
    ends_at: defaultEnd.toISOString(),
    end_at: defaultEnd.toISOString(),
    transaction_fee: INVESTMENT_TRANSACTION_FEE_RATE,
    ranking_method: "portfolio_value",
    updated_at: now.toISOString()
  });
  if (!Array.isArray(rows) || !rows[0]) return null;
  return mapCompetitionRow(rows[0]);
}

export async function listInvestmentCompetitions(): Promise<InvestmentCompetitionView[]> {
  if (!supabaseConfigured()) return [];
  await ensureInvestmentSeedData(false);
  try {
    const rows = await selectRows("investment_competitions", {
      select: "*",
      order: "created_at.desc",
      limit: "200"
    });
    return Array.isArray(rows) ? rows.map(mapCompetitionRow) : [];
  } catch {
    return [];
  }
}

export async function getCompetitionStatus(competitionId: string) {
  const competition = await getCompetitionById(competitionId);
  return competition?.runtimeStatus ?? "closed";
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
  const fetchedAt = new Date().toISOString();
  const payload = {
    symbol: price.symbol,
    price_date: price.priceDate,
    trading_day: price.priceDate,
    price: price.closePrice,
    close_price: price.closePrice,
    adjusted_close_price: price.adjustedClosePrice,
    volume: price.volume,
    currency: "USD",
    provider: price.provider,
    endpoint: price.provider === MARKETDATA_APP_PROVIDER ? MARKETDATA_STOCK_PRICE_ENDPOINT : null,
    raw: price.raw,
    raw_source: price.raw,
    fetched_at: fetchedAt,
    updated_at: fetchedAt
  };
  try {
    return await upsertRow("investment_daily_prices", payload, "symbol,price_date");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/trading_day|raw_source|price|currency|updated_at|endpoint|schema cache|column/i.test(message)) throw error;
    const { trading_day: _tradingDay, raw_source: _rawSource, price: _price, currency: _currency, updated_at: _updatedAt, endpoint: _endpoint, ...legacyPayload } = payload;
    return upsertRow("investment_daily_prices", legacyPayload, "symbol,price_date");
  }
}

async function getStoredLatestPrice(symbol: string) {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await selectRows("investment_daily_prices", {
      select: "symbol,price_date,trading_day,close_price,price,currency,provider,endpoint,fetched_at,updated_at,raw,raw_source",
      symbol: `eq.${symbol}`,
      order: "fetched_at.desc,price_date.desc",
      limit: "1"
    });
    if (!Array.isArray(rows) || !rows[0]) return null;
    const resolved = resolveStoredInvestmentPrice(rows[0]);
    const raw = storedPriceRawPayload(rows[0]);
    const providerTimestamp = raw
      ? parseMarketDataTimestamp(
          marketDataArrayField(raw, "updated") ??
            marketDataArrayField(raw, "date") ??
            marketDataArrayField(raw, "time") ??
            marketDataArrayField(raw, "timestamp")
        )
      : null;
    return {
      latestClose: resolved.price ?? rowNumber(rows[0], "price", rowNumber(rows[0], "close_price")),
      priceDate: resolved.priceDate,
      provider: rowString(rows[0], "provider") || "stored",
      priceAvailable: true,
      fetchedAt: resolved.fetchedAt,
      currency: rowString(rows[0], "currency") || "USD",
      providerUpdatedAt: providerTimestamp?.toISOString() ?? null
    };
  } catch {
    try {
      const rows = await selectRows("investment_daily_prices", {
        select: "symbol,price_date,trading_day,close_price,price,currency,provider,endpoint,fetched_at,updated_at",
        symbol: `eq.${symbol}`,
        order: "fetched_at.desc,price_date.desc",
        limit: "1"
      });
      if (!Array.isArray(rows) || !rows[0]) return null;
      return {
        latestClose: rowNumber(rows[0], "price", rowNumber(rows[0], "close_price")),
        priceDate: rowString(rows[0], "trading_day") || rowString(rows[0], "price_date"),
        provider: rowString(rows[0], "provider") || "stored",
        priceAvailable: true,
        fetchedAt: rowNullableString(rows[0], "fetched_at") ?? rowNullableString(rows[0], "updated_at"),
        currency: rowString(rows[0], "currency") || "USD",
        providerUpdatedAt: null
      };
    } catch {
      return null;
    }
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

async function getPositionRow(positionId: string, accountId: string) {
  const rows = await selectRows("investment_positions", {
    select: "*",
    id: `eq.${positionId}`,
    team_id: `eq.${accountId}`,
    limit: "1"
  });
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function listPositionRowsForAccount(accountId: string) {
  try {
    const rows = await selectRows("investment_positions", {
      select: "*",
      team_id: `eq.${accountId}`,
      order: "opened_at.desc",
      limit: "1000"
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function positionSide(row: Payload): "long" | "short" {
  return rowString(row, "side") === "short" ? "short" : "long";
}

function positionStatus(row: Payload): "open" | "closed" | "liquidated" {
  const status = rowString(row, "status");
  if (status === "closed" || status === "liquidated") return status;
  return "open";
}

function calculatePositionPnl(side: "long" | "short", entryPrice: number, currentPrice: number, quantity: number, leverage: number) {
  return side === "short"
    ? (entryPrice - currentPrice) * quantity * leverage
    : (currentPrice - entryPrice) * quantity * leverage;
}

function mapPositionRow(row: Payload, priceMap: Map<string, number>): InvestmentPositionView {
  const symbol = normalizeSymbol(rowString(row, "symbol"));
  const side = positionSide(row);
  const status = positionStatus(row);
  const entryPrice = rowNumber(row, "entry_price");
  const quantity = rowNumber(row, "quantity");
  const leverage = Math.max(1, rowNumber(row, "leverage", 1));
  const marginLocked = rowNumber(row, "margin_locked");
  const hasValidatedPrice = priceMap.has(symbol);
  const currentPrice = status === "open" ? priceMap.get(symbol) ?? entryPrice : rowNumber(row, "current_price", entryPrice);
  const exposureValue = status === "open" ? quantity * currentPrice : rowNumber(row, "exposure_value", quantity * currentPrice);
  const rawUnrealized = status === "open" ? calculatePositionPnl(side, entryPrice, currentPrice, quantity, leverage) : 0;
  const unrealizedPnl = status === "open" ? Math.max(rawUnrealized, -marginLocked) : 0;

  return {
    id: rowString(row, "id"),
    symbol,
    assetName: rowNullableString(row, "asset_name") ?? getInvestmentAsset(symbol)?.name ?? symbol,
    side,
    quantity,
    entryPrice,
    currentPrice,
    leverage,
    marginLocked,
    exposureValue,
    unrealizedPnl,
    realizedPnl: rowNumber(row, "realized_pnl"),
    status,
    openedAt: rowString(row, "opened_at") || rowString(row, "created_at"),
    closedAt: rowNullableString(row, "closed_at"),
    updatedAt: rowString(row, "updated_at") || rowString(row, "opened_at"),
    priceWarning: status === "open" && !hasValidatedPrice ? "Fresh price unavailable; entry price is used for display." : null
  };
}

async function liquidatePositionIfBreached(account: Payload, row: Payload, priceMap: Map<string, number>) {
  if (positionStatus(row) !== "open") return row;
  const symbol = normalizeSymbol(rowString(row, "symbol"));
  const entryPrice = rowNumber(row, "entry_price");
  const quantity = rowNumber(row, "quantity");
  const leverage = Math.max(1, rowNumber(row, "leverage", 1));
  const margin = rowNumber(row, "margin_locked");
  if (!symbol || !entryPrice || !quantity || !margin) return row;

  const currentPrice = priceMap.get(symbol) ?? entryPrice;
  const rawPnl = calculatePositionPnl(positionSide(row), entryPrice, currentPrice, quantity, leverage);
  if (rawPnl > -margin) return row;

  const now = new Date().toISOString();
  const updatedRow = {
    ...row,
    current_price: currentPrice,
    exposure_value: quantity * currentPrice,
    unrealized_pnl: 0,
    realized_pnl: -margin,
    status: "liquidated",
    closed_at: now,
    updated_at: now
  };

  try {
    await updateRows(
      "investment_positions",
      { id: `eq.${rowString(row, "id")}` },
      {
        current_price: currentPrice,
        exposure_value: quantity * currentPrice,
        unrealized_pnl: 0,
        realized_pnl: -margin,
        status: "liquidated",
        closed_at: now,
        updated_at: now
      }
    );
    await savePositionTrade({
      account,
      positionId: rowString(row, "id"),
      symbol,
      assetName: rowNullableString(row, "asset_name") ?? getInvestmentAsset(symbol)?.name ?? symbol,
      action: "liquidated",
      side: positionSide(row),
      quantity,
      price: currentPrice,
      gross: quantity * currentPrice,
      fee: 0,
      net: 0,
      leverage,
      margin,
      exposure: quantity * currentPrice,
      realizedPnl: -margin,
      priceDate: null,
      priceSource: "cache",
      priceTimestamp: now
    });
    return updatedRow;
  } catch {
    return row;
  }
}

async function updateInvestmentAccountCash(accountId: string, cash: number) {
  const payload = { cash, cash_balance: cash, updated_at: new Date().toISOString() };
  try {
    return await updateRows("investment_accounts", { id: `eq.${accountId}` }, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/cash_balance|schema cache|column/i.test(message)) throw error;
    return updateRows("investment_accounts", { id: `eq.${accountId}` }, { cash, updated_at: payload.updated_at });
  }
}

async function buildInvestmentAccountView(accountId: string, priceMapInput?: Map<string, number>): Promise<InvestmentAccountView | null> {
  const account = await getAccountRow(accountId);
  if (!account) return null;
  const [holdingsRows, positionRows, quotes, thesisRows, previousSnapshotValue, assets, competition] = await Promise.all([
    selectRows("investment_holdings", { select: "*", account_id: `eq.${accountId}`, order: "symbol.asc" }),
    listPositionRowsForAccount(accountId),
    priceMapInput ? Promise.resolve(null) : listInvestmentAssetQuotes(),
    selectRows("investment_theses", { select: "*", account_id: `eq.${accountId}`, limit: "1" }),
    getPreviousSnapshotTotal(accountId),
    listInvestmentAssets(),
    getCompetitionById(rowString(account, "competition_id"))
  ]);
  const competitionView =
    competition ??
    ({
      id: rowString(account, "competition_id"),
      slug: DEFAULT_INVESTMENT_COMPETITION_SLUG,
      code: DEFAULT_INVESTMENT_COMPETITION_SLUG,
      name: "Phronesia Investment Challenge",
      description: null,
      startingCash: rowNumber(account, "starting_cash", INVESTMENT_STARTING_CASH),
      startAt: null,
      endAt: null,
      status: "active",
      runtimeStatus: "active",
      transactionFee: INVESTMENT_TRANSACTION_FEE_RATE,
      rankingMethod: "portfolio_value",
      isTeenvestor: false,
      welcomeMessage: null
    } satisfies InvestmentCompetitionView);
  const tradesRows = await selectRows("investment_trades", {
    select: "*",
    account_id: `eq.${accountId}`,
    order: "created_at.desc",
    limit: "20"
  });

  const baseQuoteList = quotes ?? assets.map((asset) => ({
    ...asset,
    latestClose: priceMapInput?.get(asset.symbol) ?? asset.referencePrice,
    priceDate: null,
    provider: priceMapInput?.has(asset.symbol) ? "stored" : "educational_reference",
    priceAvailable: Boolean(priceMapInput?.has(asset.symbol)),
    priceSource: priceMapInput?.has(asset.symbol) ? ("cache" as const) : ("reference" as const),
    priceMessage: priceMapInput?.has(asset.symbol)
      ? "Using latest saved close price."
      : "No saved price yet. Select the asset to fetch the latest price.",
    fetchedAt: null,
    currency: asset.currency ?? "USD",
    cacheStatus: priceMapInput?.has(asset.symbol) ? ("cached" as const) : ("missing" as const)
  }));
  const portfolioSymbols = collectPortfolioSymbols(
    Array.isArray(holdingsRows) ? holdingsRows : [],
    Array.isArray(positionRows) ? positionRows : []
  );
  const quoteList = await resolvePortfolioQuotesForSymbols(portfolioSymbols, baseQuoteList, assets, priceMapInput);
  const quoteMap = new Map(quoteList.map((quote) => [quote.symbol, quote]));
  const marketStatus = getMarketStatus();
  const priceMap = new Map(
    quoteList
      .filter(
        (quote) =>
          quote.priceAvailable &&
          (!marketStatus.isOpen || quote.isStale !== true) &&
          Number.isFinite(quote.latestClose) &&
          quote.latestClose > 0
      )
      .map((quote) => [quote.symbol, quote.latestClose])
  );
  const holdingViews = Array.isArray(holdingsRows)
    ? holdingsRows
        .filter((row) => rowNumber(row, "quantity") > 0)
        .map((row) => {
          const symbol = normalizeSymbol(rowString(row, "symbol"));
          const asset = quoteMap.get(symbol) ?? getInvestmentAsset(symbol);
          const assetName = rowNullableString(row, "asset_name") ?? asset?.name ?? symbol;
          const rawPrice = priceMap.get(symbol);
          const quantity = rowNumber(row, "quantity");
          const averageBuyPrice = rowNumber(row, "average_buy_price");
          const latestClose = rawPrice !== undefined && rawPrice > 0 ? rawPrice : averageBuyPrice || asset?.referencePrice || 0;
          const marketValue = quantity * latestClose;
          return {
            symbol,
            assetName,
            assetType: asset?.type ?? "Stock",
            quantity,
            averageBuyPrice,
            latestClose,
            priceDate: quoteMap.get(symbol)?.priceDate ?? null,
            marketValue,
            unrealizedGainLoss: (latestClose - averageBuyPrice) * quantity,
            weight: 0,
            priceWarning:
              rawPrice === undefined
                ? "Fresh price unavailable; average buy price is used for portfolio display."
                : null
          };
        })
    : [];

  const cash = rowNumber(account, "cash", rowNumber(account, "cash_balance", INVESTMENT_STARTING_CASH));
  const startingCash = rowNumber(account, "starting_cash", INVESTMENT_STARTING_CASH);
  const holdingsValue = holdingViews.reduce((sum, holding) => sum + holding.marketValue, 0);
  const holdingsUnrealizedPnl = holdingViews.reduce((sum, holding) => sum + holding.unrealizedGainLoss, 0);
  const normalizedPositionRows = await Promise.all(positionRows.map((row) => liquidatePositionIfBreached(account, row, priceMap)));
  const positionViews = normalizedPositionRows.map((row) => mapPositionRow(row, priceMap));
  const openPositions = positionViews.filter((position) => position.status === "open");
  const lockedMargin = openPositions.reduce((sum, position) => sum + position.marginLocked, 0);
  const totalExposure = openPositions.reduce((sum, position) => sum + position.exposureValue, 0);
  const unrealizedPnl = openPositions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
  const openPositionValue = lockedMargin + unrealizedPnl;
  const totalUnrealizedPnl = holdingsUnrealizedPnl + unrealizedPnl;
  const totalValue = cash + holdingsValue + openPositionValue;
  const dailyChange = previousSnapshotValue ? ((totalValue - previousSnapshotValue) / previousSnapshotValue) * 100 : 0;
  holdingViews.forEach((holding) => {
    holding.weight = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
  });

  const thesisRow = Array.isArray(thesisRows) && thesisRows[0] ? thesisRows[0] : null;
  const totalReturn = startingCash > 0 ? ((totalValue - startingCash) / startingCash) * 100 : 0;
  const formulaBreakdown: InvestmentPortfolioFormulaBreakdown = {
    cash,
    normalHoldingsValue: holdingsValue,
    lockedMargin,
    openExposure: totalExposure,
    holdingsUnrealizedPnl,
    positionsUnrealizedPnl: unrealizedPnl,
    totalUnrealizedPnl,
    openPositionValue,
    totalPortfolioValue: totalValue,
    profitLoss: totalValue - startingCash,
    returnPercent: totalReturn
  };
  const portfolio = {
    startingCash,
    cash,
    holdingsValue,
    lockedMargin,
    totalExposure,
    unrealizedPnl,
    holdingsUnrealizedPnl,
    totalUnrealizedPnl,
    openPositionValue,
    totalValue,
    dailyChange,
    totalReturn,
    diversificationScore: calculateDiversificationScore(holdingViews, totalValue),
    riskScore: calculateRiskScore(holdingViews, totalValue),
    formulaBreakdown
  };
  const portfolioDebug = {
    cashBalance: cash,
    legacyHoldingsCount: holdingViews.length,
    legacyHoldingsValue: holdingsValue,
    openPositionsCount: openPositions.length,
    lockedMargin,
    openExposure: totalExposure,
    holdingsUnrealizedPnl,
    unrealizedPnl,
    totalUnrealizedPnl,
    openPositionValue,
    calculatedPortfolioValue: totalValue,
    formulaBreakdown,
    pricesUsed: portfolioPricesUsed(portfolioSymbols, quoteMap)
  };
  const currentRank = await getLeaderboardRowForAccount(accountId, competitionView);
  return {
    account: {
      id: rowString(account, "id"),
      competitionId: rowString(account, "competition_id"),
      teamName: rowString(account, "team_name"),
      participantLogin: rowNullableString(account, "participant_login"),
      startingCash,
      cash
    },
    competition: competitionView,
    holdings: holdingViews,
    positions: positionViews,
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
    portfolio,
    portfolioDebug,
    marketStatus,
    currentRank
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
    positionId: rowNullableString(row, "position_id"),
    action: rowNullableString(row, "action"),
    symbol: rowString(row, "symbol"),
    assetName: rowNullableString(row, "asset_name") ?? rowString(row, "symbol"),
    side: rowString(row, "side"),
    quantity: rowNumber(row, "quantity"),
    price: rowNumber(row, "price"),
    grossValue: rowNumber(row, "gross_value", rowNumber(row, "gross_amount")),
    feeRate: rowNumber(row, "fee_rate", INVESTMENT_TRANSACTION_FEE_RATE),
    feeAmount: rowNumber(row, "fee_amount"),
    netValue: rowNumber(row, "net_value", Math.abs(rowNumber(row, "net_amount"))),
    leverage: row.leverage === null || row.leverage === undefined ? null : rowNumber(row, "leverage"),
    marginUsed: row.margin_used === null || row.margin_used === undefined ? null : rowNumber(row, "margin_used"),
    exposureValue: row.exposure_value === null || row.exposure_value === undefined ? null : rowNumber(row, "exposure_value"),
    realizedPnl: row.realized_pnl === null || row.realized_pnl === undefined ? null : rowNumber(row, "realized_pnl"),
    priceDate: rowNullableString(row, "price_date"),
    priceSource: rowNullableString(row, "price_source"),
    priceTimestamp: rowNullableString(row, "price_timestamp"),
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

async function upsertHolding(
  account: Payload,
  symbol: string,
  assetName: string,
  quantity: number,
  averageBuyPrice: number,
  realizedGainLoss: number
) {
  if (quantity > 0) await recordInvestmentAssetEvent(symbol, "hold");
  const payload = {
    account_id: rowString(account, "id"),
    team_id: rowString(account, "id"),
    competition_id: rowString(account, "competition_id"),
    symbol,
    asset_name: assetName,
    quantity,
    average_buy_price: averageBuyPrice,
    realized_gain_loss: realizedGainLoss,
    updated_at: new Date().toISOString()
  };
  try {
    return await upsertRow("investment_holdings", payload, "account_id,symbol");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/team_id|competition_id|asset_name|schema cache|column/i.test(message)) throw error;
    const legacyPayload: Payload = { ...payload };
    delete legacyPayload.team_id;
    delete legacyPayload.competition_id;
    delete legacyPayload.asset_name;
    return upsertRow("investment_holdings", legacyPayload, "account_id,symbol");
  }
}

async function saveTrade(
  account: Payload,
  symbol: string,
  assetName: string,
  side: TradeSide,
  quantity: number,
  price: number,
  gross: number,
  fee: number,
  net: number,
  priceDate: string | null,
  priceSource: string | undefined,
  priceTimestamp?: string | null
) {
  const executedAt = new Date().toISOString();
  return insertInvestmentTrade({
    account_id: rowString(account, "id"),
    team_id: rowString(account, "id"),
    competition_id: rowString(account, "competition_id"),
    symbol,
    asset_name: assetName,
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
    price_timestamp: priceTimestamp ?? executedAt,
    executed_at: executedAt,
    rejected: false,
    reject_reason: null,
    trade_date: todayIsoInEt(),
    created_at: executedAt
  });
}

async function savePositionTrade(input: {
  account: Payload;
  positionId: string;
  symbol: string;
  assetName: string;
  action: "open_long" | "open_short" | "close_long" | "close_short" | "liquidated";
  side: "long" | "short";
  quantity: number;
  price: number;
  gross: number;
  fee: number;
  net: number;
  leverage: number;
  margin: number;
  exposure: number;
  realizedPnl: number;
  priceDate: string | null;
  priceSource: string | undefined;
  priceTimestamp?: string | null;
}) {
  const executedAt = new Date().toISOString();
  return insertInvestmentTrade({
    account_id: rowString(input.account, "id"),
    team_id: rowString(input.account, "id"),
    competition_id: rowString(input.account, "competition_id"),
    position_id: input.positionId,
    action: input.action,
    symbol: input.symbol,
    asset_name: input.assetName,
    side: input.side,
    quantity: input.quantity,
    price: input.price,
    gross_amount: input.gross,
    gross_value: input.gross,
    fee_rate: INVESTMENT_TRANSACTION_FEE_RATE,
    fee_amount: input.fee,
    net_amount: input.net,
    net_value: input.net,
    leverage: input.leverage,
    margin_used: input.margin,
    exposure_value: input.exposure,
    realized_pnl: input.realizedPnl,
    price_date: input.priceDate,
    price_source: input.priceSource ?? null,
    price_timestamp: input.priceTimestamp ?? executedAt,
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
      team_id: rowString(account, "id"),
      competition_id: rowString(account, "competition_id"),
      symbol: symbol || "UNKNOWN",
      asset_name: null,
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
      price_timestamp: null,
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
    if (!/team_id|asset_name|gross_value|fee_rate|net_value|price_date|price_source|price_timestamp|executed_at|position_id|action|leverage|margin_used|exposure_value|realized_pnl|check|constraint|schema cache|column/i.test(message)) {
      throw error;
    }
    const legacyPayload = { ...payload };
    const action = String(legacyPayload.action ?? "");
    if (legacyPayload.side === "long" || legacyPayload.side === "short") {
      legacyPayload.side = action === "open_short" || action === "close_long" || action === "liquidated" ? "sell" : "buy";
    }
    delete legacyPayload.team_id;
    delete legacyPayload.asset_name;
    delete legacyPayload.gross_value;
    delete legacyPayload.fee_rate;
    delete legacyPayload.net_value;
    delete legacyPayload.price_date;
    delete legacyPayload.price_source;
    delete legacyPayload.price_timestamp;
    delete legacyPayload.executed_at;
    delete legacyPayload.position_id;
    delete legacyPayload.action;
    delete legacyPayload.leverage;
    delete legacyPayload.margin_used;
    delete legacyPayload.exposure_value;
    delete legacyPayload.realized_pnl;
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

async function getLeaderboardRowForAccount(accountId: string, competition: InvestmentCompetitionView) {
  try {
    const rows = await selectRows("investment_leaderboard", {
      select: "*",
      account_id: `eq.${accountId}`,
      competition_id: `eq.${competition.id}`,
      limit: "1"
    });
    return Array.isArray(rows) && rows[0] ? mapLeaderboardRow(rows[0], competition) : null;
  } catch {
    return null;
  }
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

function mapLeaderboardRow(row: Payload, competition?: InvestmentCompetitionView): InvestmentLeaderboardRow {
  const startingCash = rowNumber(row, "starting_cash", INVESTMENT_STARTING_CASH);
  const totalValue = rowNumber(row, "total_portfolio_value", rowNumber(row, "total_value"));
  return {
    rank: rowNumber(row, "rank", rowNumber(row, "rank_position")),
    accountId: rowString(row, "account_id"),
    teamId: rowString(row, "team_id") || rowString(row, "account_id"),
    competitionId: rowString(row, "competition_id"),
    competitionCode: competition?.code,
    teamName: rowString(row, "team_name"),
    startingCash,
    cashBalance: rowNumber(row, "cash_balance"),
    holdingsValue: rowNumber(row, "holdings_value"),
    totalValue,
    profitLoss: rowNumber(row, "profit_loss", totalValue - startingCash),
    totalReturn: rowNumber(row, "return_percent", rowNumber(row, "total_return")),
    tradeCount: rowNumber(row, "trades_count", rowNumber(row, "trade_count")),
    riskAdjustedScore: rowNumber(row, "risk_adjusted_score"),
    diversificationScore: rowNumber(row, "diversification_score"),
    riskScore: rowNumber(row, "risk_score"),
    thesisScore: rowNumber(row, "thesis_score"),
    drawdownScore: rowNumber(row, "drawdown_score"),
    overallScore: rowNumber(row, "overall_score"),
    status: rowString(row, "status") || competition?.runtimeStatus || "active",
    updatedAt: rowString(row, "updated_at")
  };
}
