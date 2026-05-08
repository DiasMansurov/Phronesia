import { SCENARIOS } from "@/lib/game/content";
import type { Challenge, DifficultyId } from "@/lib/game/types";

function dayOfYear(now: Date) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function weekOfYear(now: Date) {
  return Math.ceil(dayOfYear(now) / 7);
}

function difficultyByIndex(index: number): DifficultyId {
  return ["foundation", "summit", "gauntlet"][index % 3] as DifficultyId;
}

export function getDailyChallenge(now = new Date()): Challenge {
  const scenario = SCENARIOS[dayOfYear(now) % SCENARIOS.length];
  const difficultyId = difficultyByIndex(dayOfYear(now));

  return {
    id: `daily-${now.toISOString().slice(0, 10)}`,
    label: "Daily Mandate",
    summary: "A fresh strategic run that rotates each day.",
    kind: "daily",
    scenarioId: scenario.id,
    difficultyId,
    objective: `Finish ${scenario.title} on ${difficultyId} while beating your best score.`
  };
}

export function getWeeklyFeatured(now = new Date()): Challenge {
  const scenario = SCENARIOS[weekOfYear(now) % SCENARIOS.length];
  const difficultyId = difficultyByIndex(weekOfYear(now) + 1);

  return {
    id: `weekly-${now.getFullYear()}-${weekOfYear(now)}`,
    label: "Weekly Featured Run",
    summary: "The prestige scenario of the week for leaderboards and creator playthroughs.",
    kind: "weekly",
    scenarioId: scenario.id,
    difficultyId,
    objective: `Master ${scenario.subtitle} and hold approval above 50 through the final round.`
  };
}
