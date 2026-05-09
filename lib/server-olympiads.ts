import { selectRows, supabaseConfigured, upsertRow } from "@/lib/supabase-rest";
import type { DifficultyId, MacroState, Policies, PolicyPrediction } from "@/lib/game/types";

type Payload = Record<string, unknown>;

export type OlympiadAttemptRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  olympiadSlug: string;
  olympiadTitle: string;
  accessCode: string;
  participantLogin: string;
  teamName: string;
  runId: string;
  scenarioId: string;
  scenarioTitle: string;
  difficultyId: string;
  status: "active" | "completed";
  finalScore: number | null;
  rankTitle: string | null;
  victory: boolean | null;
  summary: string | null;
  roundsCompleted: number | null;
  scoreBreakdown: unknown | null;
  finalState: unknown | null;
};

export type OlympiadDecisionRecord = {
  id: string;
  createdAt: string;
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: unknown;
  beforeState: unknown;
  afterState: unknown | null;
  prediction: unknown | null;
  policySummary: string | null;
  citizenSummary: string | null;
  scoreAfter: number | null;
};

function rowString(row: Payload, key: string) {
  return String(row[key] ?? "");
}

function rowNumber(row: Payload, key: string) {
  const value = row[key];
  return typeof value === "number" ? value : value === null || value === undefined ? null : Number(value);
}

function rowBool(row: Payload, key: string) {
  const value = row[key];
  return typeof value === "boolean" ? value : value === null || value === undefined ? null : Boolean(value);
}

function mapAttempt(row: Payload): OlympiadAttemptRecord {
  return {
    id: rowString(row, "id"),
    createdAt: rowString(row, "created_at"),
    updatedAt: rowString(row, "updated_at"),
    olympiadSlug: rowString(row, "olympiad_slug"),
    olympiadTitle: rowString(row, "olympiad_title"),
    accessCode: rowString(row, "access_code"),
    participantLogin: rowString(row, "participant_login"),
    teamName: rowString(row, "team_name"),
    runId: rowString(row, "run_id"),
    scenarioId: rowString(row, "scenario_id"),
    scenarioTitle: rowString(row, "scenario_title"),
    difficultyId: rowString(row, "difficulty_id"),
    status: rowString(row, "status") === "completed" ? "completed" : "active",
    finalScore: rowNumber(row, "final_score"),
    rankTitle: (row.rank_title as string | null | undefined) ?? null,
    victory: rowBool(row, "victory"),
    summary: (row.summary as string | null | undefined) ?? null,
    roundsCompleted: rowNumber(row, "rounds_completed"),
    scoreBreakdown: row.score_breakdown ?? null,
    finalState: row.final_state ?? null
  };
}

function mapDecision(row: Payload): OlympiadDecisionRecord {
  return {
    id: rowString(row, "id"),
    createdAt: rowString(row, "created_at"),
    attemptId: rowString(row, "attempt_id"),
    runId: rowString(row, "run_id"),
    round: Number(row.round ?? 0),
    year: Number(row.year ?? 0),
    policies: row.policies ?? null,
    beforeState: row.before_state ?? null,
    afterState: row.after_state ?? null,
    prediction: row.prediction ?? null,
    policySummary: (row.policy_summary as string | null | undefined) ?? null,
    citizenSummary: (row.citizen_summary as string | null | undefined) ?? null,
    scoreAfter: rowNumber(row, "score_after")
  };
}

export function olympiadBackendConfigured() {
  return supabaseConfigured();
}

export async function upsertOlympiadAttempt(input: {
  olympiadSlug: string;
  olympiadTitle: string;
  accessCode: string;
  participantLogin: string;
  teamName: string;
  runId: string;
  scenarioId: string;
  scenarioTitle: string;
  difficultyId: DifficultyId;
  status: "active" | "completed";
  finalScore?: number | null;
  rankTitle?: string | null;
  victory?: boolean | null;
  summary?: string | null;
  roundsCompleted?: number | null;
  scoreBreakdown?: unknown;
  finalState?: MacroState | null;
}) {
  if (!supabaseConfigured()) return null;
  const rows = await upsertRow(
    "olympiad_attempts",
    {
      olympiad_slug: input.olympiadSlug,
      olympiad_title: input.olympiadTitle,
      access_code: input.accessCode,
      participant_login: input.participantLogin,
      team_name: input.teamName,
      run_id: input.runId,
      scenario_id: input.scenarioId,
      scenario_title: input.scenarioTitle,
      difficulty_id: input.difficultyId,
      status: input.status,
      final_score: input.finalScore ?? null,
      rank_title: input.rankTitle ?? null,
      victory: input.victory ?? null,
      summary: input.summary ?? null,
      rounds_completed: input.roundsCompleted ?? null,
      score_breakdown: input.scoreBreakdown ?? null,
      final_state: input.finalState ?? null,
      updated_at: new Date().toISOString()
    },
    "run_id"
  );
  if (!Array.isArray(rows)) return null;
  return rows[0] ? mapAttempt(rows[0]) : null;
}

export async function upsertOlympiadDecision(input: {
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: Policies;
  beforeState: MacroState;
  afterState?: MacroState | null;
  prediction?: PolicyPrediction | null;
  policySummary?: string | null;
  citizenSummary?: string | null;
  scoreAfter?: number | null;
}) {
  if (!supabaseConfigured()) return null;
  const rows = await upsertRow(
    "olympiad_decisions",
    {
      attempt_id: input.attemptId,
      run_id: input.runId,
      round: input.round,
      year: input.year,
      policies: input.policies,
      before_state: input.beforeState,
      after_state: input.afterState ?? null,
      prediction: input.prediction ?? null,
      policy_summary: input.policySummary ?? null,
      citizen_summary: input.citizenSummary ?? null,
      score_after: input.scoreAfter ?? null
    },
    "run_id,round"
  );
  if (!Array.isArray(rows)) return null;
  return rows[0] ? mapDecision(rows[0]) : null;
}

export async function listOlympiadAttemptsWithDecisions() {
  if (!supabaseConfigured()) {
    return { attempts: [], decisions: [] };
  }

  const attemptRows = await selectRows("olympiad_attempts", {
    select: "*",
    order: "final_score.desc.nullslast,updated_at.desc",
    limit: "500"
  });

  if (!Array.isArray(attemptRows)) {
    return { attempts: [], decisions: [] };
  }

  const attempts = attemptRows.map(mapAttempt);
  if (!attempts.length) return { attempts, decisions: [] };

  const runIds = attempts.map((attempt) => attempt.runId).join(",");
  const decisionRows = await selectRows("olympiad_decisions", {
    select: "*",
    run_id: `in.(${runIds})`,
    order: "round.asc"
  });

  if (!Array.isArray(decisionRows)) {
    return { attempts, decisions: [] };
  }

  return {
    attempts,
    decisions: decisionRows.map(mapDecision)
  };
}
