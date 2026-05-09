import { getScenario } from "@/lib/game/content";
import type { DifficultyId, LearningMode, PolicyComplexity } from "@/lib/game/types";

export type OlympiadConfig = {
  slug: string;
  title: string;
  partner: string;
  accessCode: string;
  scenarioId: string;
  difficultyId: DifficultyId;
  policyComplexity: PolicyComplexity;
  learningMode: LearningMode;
  status: "draft" | "active" | "closed";
  briefing: string;
  rules: string[];
};

export const OLYMPIADS: OlympiadConfig[] = [
  {
    slug: "american-financial-crisis-2008",
    title: "American Financial Crisis 2008",
    partner: "Partner Olympiad",
    accessCode: "PHRONESIA-2008",
    scenarioId: "finance-2008-banking-crisis",
    difficultyId: "summit",
    policyComplexity: "advanced",
    learningMode: "challenge",
    status: "active",
    briefing:
      "Banks issued too many risky loans. Trust is collapsing, defaults are rising, and credit is freezing. Teams must restore financial stability while protecting households and avoiding unsustainable debt.",
    rules: [
      "Teams enter with the official olympiad login code and team name.",
      "Each team plays the same scenario and pressure level.",
      "The admin dashboard ranks teams by final policy score and stores their round-by-round decisions."
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
  const normalized = code.trim().toUpperCase();
  return OLYMPIADS.find((olympiad) => olympiad.accessCode.toUpperCase() === normalized && olympiad.status === "active") ?? null;
}

export function getOlympiadScenario(olympiad: OlympiadConfig) {
  return getScenario(olympiad.scenarioId);
}
