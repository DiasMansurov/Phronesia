import { SCENARIOS } from "@/lib/game/content";
import { loadProfile, saveProfile } from "@/lib/game/storage";
import type {
  Badge,
  BestRun,
  PlayerProfile,
  RunState,
  Scenario
} from "@/lib/game/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function hasRequirements(profile: PlayerProfile, scenario: Scenario) {
  if (!scenario.unlockRequirement) return true;
  const runCheck = scenario.unlockRequirement.completedRuns ?? 0;
  const badgeCheck = scenario.unlockRequirement.badges ?? [];
  return profile.completedRuns >= runCheck && badgeCheck.every((badge) => profile.badges.includes(badge as Badge));
}

export function createDefaultProfile(): PlayerProfile {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    displayName: "Policy Strategist",
    premium: true,
    unlockedScenarioIds: SCENARIOS.map((scenario) => scenario.id),
    completedRuns: 0,
    streakCount: 0,
    completedChallengeIds: [],
    badges: [],
    bestRuns: [],
    xp: 0,
    level: 1
  };
}

export function getProfile(): PlayerProfile {
  const stored = loadProfile();
  if (stored) {
    return {
      ...stored,
      xp: stored.xp ?? stored.completedRuns * 120,
      level: stored.level ?? Math.max(1, Math.floor((stored.xp ?? stored.completedRuns * 120) / 500) + 1)
    };
  }
  const fresh = createDefaultProfile();
  saveProfile(fresh);
  return fresh;
}

function evaluateRunBadges(run: RunState): Badge[] {
  const avgInflation = average(run.history.map((item) => item.inflation));
  const avgUnemployment = average(run.history.map((item) => item.unemployment));
  const avgBudget = average(run.history.map((item) => item.budgetBalance));
  const avgApproval = average(run.history.map((item) => item.approval));
  const lastNetExports = run.current.netExports;
  const badges: Badge[] = [];

  if (run.victory) badges.push("First Mandate");
  if (avgInflation <= 3.5) badges.push("Inflation Tamer");
  if (avgUnemployment <= 5.5) badges.push("Jobs Machine");
  if (avgBudget >= -3.5) badges.push("Balanced Ledger");
  if (lastNetExports >= -1.5) badges.push("External Hawk");
  if (avgApproval >= 62) badges.push("Legendary Approval");
  if (run.current.equityMarket >= 95 && run.current.bankingStress <= 35) badges.push("Market Confidence");
  if (run.victory && (run.learningLevelId === "crisis" || run.current.bankingStress <= 45)) badges.push("Crisis Manager");
  if (run.learningMode === "learning") badges.push("Theory Learner");
  if (avgInflation <= 3.8 && run.current.inflation <= 4.5) badges.push("Inflation Defender");
  if (run.current.equityMarket >= 92 && run.current.currencyIndex >= 92 && run.current.bankingStress <= 42) badges.push("Market Stabilizer");
  if (avgBudget >= -3.8 && run.current.debtRatio <= 92) badges.push("Debt Manager");
  if (run.victory && run.current.bankingStress <= 48 && (run.learningLevelId === "crisis" || run.learningLevelId === "competitive")) {
    badges.push("Banking Crisis Survivor");
  }
  if (run.current.policyCredibility >= 58 && run.current.sovereignYield <= 5.5 && run.current.currencyIndex >= 90) {
    badges.push("Investor Confidence Builder");
  }
  if (run.learningMode === "learning") badges.push("Financial Literacy Beginner");
  if (run.current.equityMarket >= 90 && run.current.defaultRisk <= 18 && run.current.householdDebt <= 95) badges.push("Portfolio Strategist");
  if (run.victory && (run.learningLevelId === "crisis" || run.learningLevelId === "competitive")) badges.push("Crisis President");
  if (run.score >= 112) badges.push("Top 10% President");

  return unique(badges);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function updateUnlockedScenarios(profile: PlayerProfile) {
  const unlocked = SCENARIOS.map((scenario) => scenario.id);
  profile.unlockedScenarioIds = unique(unlocked);
}

function toBestRun(run: RunState): BestRun {
  return {
    runId: run.runId,
    scenarioId: run.scenarioId,
    scenarioTitle: run.scenarioTitle,
    score: run.score,
    rankTitle: run.rankTitle,
    completedAt: run.updatedAt,
    difficultyId: run.difficultyId
  };
}

export function registerCompletedRun(run: RunState) {
  const profile = getProfile();
  profile.completedRuns += 1;
  profile.xp = (profile.xp ?? 0) + (run.learningMode === "challenge" ? 240 : 160) + Math.max(0, Math.round(run.score));
  profile.level = Math.max(1, Math.floor(profile.xp / 500) + 1);
  profile.badges = unique([...profile.badges, ...evaluateRunBadges(run)]) as Badge[];
  if (run.challengeId) {
    profile.completedChallengeIds = unique([...profile.completedChallengeIds, run.challengeId]);
  }

  const best = profile.bestRuns.filter((item) => item.runId !== run.runId);
  best.push(toBestRun(run));
  best.sort((a, b) => b.score - a.score);
  profile.bestRuns = best.slice(0, 12);

  const streakMarkerKey = "pm.v1.lastCompleteDay";
  const lastDay = typeof window !== "undefined" ? window.localStorage.getItem(streakMarkerKey) : null;
  const today = todayKey();
  profile.streakCount = lastDay === today ? profile.streakCount : profile.streakCount + 1;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(streakMarkerKey, today);
  }

  updateUnlockedScenarios(profile);
  saveProfile(profile);
  return profile;
}

export function canAccessScenario(profile: PlayerProfile, scenario: Scenario) {
  const unlocked = profile.unlockedScenarioIds.includes(scenario.id);
  const paywalled = false;

  return {
    unlocked,
    paywalled,
    playable: unlocked
  };
}
