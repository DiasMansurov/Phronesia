import { DEFAULT_POLICY_COMPLEXITY, defaultPolicies } from "@/lib/game/engine";
import type { HistoryEntry, LeadCapture, MacroState, PlayerProfile, RunState } from "@/lib/game/types";

const KEYS = {
  profile: "pm.v1.profile",
  runs: "pm.v1.runs",
  activeRunId: "pm.v1.activeRunId",
  leads: "pm.v1.leads"
} as const;

function browser() {
  return typeof window !== "undefined";
}

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizePolicyComplexity(value: unknown) {
  switch (value) {
    case "tutorial":
    case "fiscal":
    case "monetary":
    case "combined":
    case "advanced":
      return value;
    case "core":
      return "combined";
    default:
      return DEFAULT_POLICY_COMPLEXITY;
  }
}

function normalizeMacroState(current: MacroState): MacroState {
  return {
    ...current,
    sovereignYield: current.sovereignYield ?? 3,
    currencyIndex: current.currencyIndex ?? 100,
    equityMarket: current.equityMarket ?? 90,
    bankingStress: current.bankingStress ?? 20,
    householdDebt: current.householdDebt ?? 70,
    defaultRisk: current.defaultRisk ?? 10
  };
}

function normalizeHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    ...entry,
    debtRatio: entry.debtRatio,
    sovereignYield: entry.sovereignYield ?? 3,
    currencyIndex: entry.currencyIndex ?? 100,
    equityMarket: entry.equityMarket ?? 90,
    bankingStress: entry.bankingStress ?? 20,
    householdDebt: entry.householdDebt ?? 70,
    defaultRisk: entry.defaultRisk ?? 10,
    briefing: entry.briefing
      ? {
          ...entry.briefing,
          policySummary:
            "policySummary" in entry.briefing
              ? entry.briefing.policySummary
              : entry.note,
          citizenSummary:
            "citizenSummary" in entry.briefing
              ? entry.briefing.citizenSummary
              : entry.citizenImpact,
          citizenGroups:
            "citizenGroups" in entry.briefing
              ? entry.briefing.citizenGroups
              : [
                  {
                    group: "General households",
                    effect: entry.citizenImpact,
                    tone: "mixed" as const
                  }
                ],
          criticismHeadline:
            "criticismHeadline" in entry.briefing
              ? entry.briefing.criticismHeadline
              : "Editorial boards found fresh reasons to doubt the administration.",
          criticismBody:
            "criticismBody" in entry.briefing
              ? entry.briefing.criticismBody
              : "The press treated the year as another reminder that confidence and competence do not always travel together."
        }
      : undefined,
    electionNight: entry.electionNight ?? null
  };
}

function normalizeRun(run: RunState): RunState {
  return {
    ...run,
    version: 2,
    policyComplexity: normalizePolicyComplexity(run.policyComplexity),
    learningMode: run.learningMode ?? "learning",
    current: normalizeMacroState(run.current),
    policies: {
      ...defaultPolicies(),
      ...run.policies
    },
    history: run.history.map(normalizeHistoryEntry)
  };
}

export function loadProfile(): PlayerProfile | null {
  if (!browser()) return null;
  return parse<PlayerProfile | null>(window.localStorage.getItem(KEYS.profile), null);
}

export function saveProfile(profile: PlayerProfile) {
  if (!browser()) return;
  window.localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function loadRuns(): RunState[] {
  if (!browser()) return [];
  return parse<RunState[]>(window.localStorage.getItem(KEYS.runs), []).map(normalizeRun);
}

export function getRun(runId: string) {
  return loadRuns().find((run) => run.runId === runId) ?? null;
}

export function saveRun(run: RunState) {
  if (!browser()) return;
  const current = loadRuns();
  const next = current.some((item) => item.runId === run.runId)
    ? current.map((item) => (item.runId === run.runId ? run : item))
    : [run, ...current];
  window.localStorage.setItem(KEYS.runs, JSON.stringify(next.slice(0, 50)));
}

export function getActiveRunId() {
  if (!browser()) return null;
  return window.localStorage.getItem(KEYS.activeRunId);
}

export function setActiveRunId(runId: string | null) {
  if (!browser()) return;
  if (!runId) {
    window.localStorage.removeItem(KEYS.activeRunId);
    return;
  }
  window.localStorage.setItem(KEYS.activeRunId, runId);
}

export function loadLeads(): LeadCapture[] {
  if (!browser()) return [];
  return parse<LeadCapture[]>(window.localStorage.getItem(KEYS.leads), []);
}

export function saveLead(lead: LeadCapture) {
  if (!browser()) return;
  const leads = loadLeads();
  leads.unshift(lead);
  window.localStorage.setItem(KEYS.leads, JSON.stringify(leads.slice(0, 100)));
}
