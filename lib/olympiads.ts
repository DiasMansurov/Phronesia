import { getScenario } from "@/lib/game/content";
import type { DifficultyId, LearningMode, PolicyComplexity } from "@/lib/game/types";

export type OlympiadConfig = {
  slug: string;
  title: string;
  partner: string;
  accessCode: string;
  accessAliases?: string[];
  scenarioId: string;
  difficultyId: DifficultyId;
  policyComplexity: PolicyComplexity;
  learningMode: LearningMode;
  status: "draft" | "active" | "closed";
  briefing: string;
  rules: string[];
};

export const OFFICIAL_TEENVESTOR_COMPETITION_LOGIN = "Teenvestor.school";

export const OLYMPIADS: OlympiadConfig[] = [
  {
    slug: "american-financial-crisis-2008",
    title: "Teenvestor Investment Competition",
    partner: "Official Competition",
    accessCode: OFFICIAL_TEENVESTOR_COMPETITION_LOGIN,
    accessAliases: ["teenvestor.school"],
    scenarioId: "finance-2008-banking-crisis",
    difficultyId: "summit",
    policyComplexity: "advanced",
    learningMode: "challenge",
    status: "active",
    briefing:
      "Teams join an online investment simulation, build and manage a virtual portfolio, analyze real companies, and make strategic investment decisions.",
    rules: [
      "Teams enter with the official competition login and team name.",
      "Each team competes under the same online simulation conditions.",
      "The organizer Results page stores team scores, selected decisions, and completion details."
    ]
  }
];

export function listActiveOlympiads() {
  return OLYMPIADS.filter((olympiad) => olympiad.status === "active");
}

export function getOlympiadBySlug(slug: string) {
  return OLYMPIADS.find((olympiad) => olympiad.slug === slug) ?? null;
}

export function getOlympiadByAccessCode(code: string) {
  const olympiad = getOlympiadByAccessCodeIncludingInactive(code);
  return olympiad?.status === "active" ? olympiad : null;
}

export function getOlympiadByAccessCodeIncludingInactive(code: string) {
  const normalized = normalizeOlympiadAccessCode(code);
  return (
    OLYMPIADS.find((olympiad) => {
      const codes = [olympiad.accessCode, ...(olympiad.accessAliases ?? [])].map(normalizeOlympiadAccessCode);
      return codes.includes(normalized);
    }) ?? null
  );
}

export function isOfficialTeenvestorCompetitionLogin(code: string) {
  return normalizeOlympiadAccessCode(code) === normalizeOlympiadAccessCode(OFFICIAL_TEENVESTOR_COMPETITION_LOGIN);
}

export function getOlympiadScenario(olympiad: OlympiadConfig) {
  return getScenario(olympiad.scenarioId);
}

function normalizeOlympiadAccessCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
