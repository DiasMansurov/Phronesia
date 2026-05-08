import { COOKIE_CONSENT_KEY, cookiesRequireConsent, inferRegionFromLocale } from "@/lib/policy";

export type AnalyticsEventName =
  | "page_view"
  | "run_started"
  | "inauguration_acknowledged"
  | "round_advanced"
  | "run_completed"
  | "run_failed"
  | "result_shared"
  | "premium_viewed"
  | "teacher_interest"
  | "challenge_interest";

type AnalyticsEvent = {
  id: string;
  event: AnalyticsEventName;
  timestamp: string;
  payload: Record<string, unknown>;
};

const KEY = "pm.v1.analytics";

function hasWindow() {
  return typeof window !== "undefined";
}

function analyticsAllowed() {
  if (!hasWindow()) return false;

  const region = inferRegionFromLocale(window.navigator.language);
  if (!cookiesRequireConsent(region)) return true;

  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

export function track(event: AnalyticsEventName, payload: Record<string, unknown> = {}) {
  if (!hasWindow() || !analyticsAllowed()) return;

  const item: AnalyticsEvent = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    payload
  };

  try {
    const current = window.localStorage.getItem(KEY);
    const parsed: AnalyticsEvent[] = current ? JSON.parse(current) : [];
    parsed.push(item);
    window.localStorage.setItem(KEY, JSON.stringify(parsed.slice(-200)));
  } catch {}

  if (typeof window !== "undefined") {
    console.info("[analytics]", item.event, item.payload);
  }
}
