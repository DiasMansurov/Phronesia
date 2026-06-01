import { NextResponse } from "next/server";

import { getOlympiadByAccessCode } from "@/lib/olympiads";
import { olympiadBackendConfigured, upsertOlympiadAttempt, upsertOlympiadDecision } from "@/lib/server-olympiads";
import type { DifficultyId, MacroState, Policies, PolicyPrediction } from "@/lib/game/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    phase?: "begin" | "complete";
    olympiadSlug?: string;
    olympiadTitle?: string;
    accessCode?: string;
    participantLogin?: string;
    teamName?: string;
    runId?: string;
    scenarioId?: string;
    scenarioTitle?: string;
    difficultyId?: DifficultyId;
    round?: number;
    year?: number;
    policies?: Policies;
    beforeState?: MacroState;
    afterState?: MacroState;
    prediction?: PolicyPrediction;
    policySummary?: string;
    citizenSummary?: string;
    scoreAfter?: number;
    runComplete?: boolean;
    finalScore?: number | null;
    rankTitle?: string | null;
    victory?: boolean | null;
    summary?: string | null;
    roundsCompleted?: number | null;
    scoreBreakdown?: unknown;
    finalState?: MacroState | null;
  };

  if (
    !body.phase ||
    !body.accessCode ||
    !body.participantLogin ||
    !body.teamName ||
    !body.runId ||
    !body.scenarioId ||
    !body.scenarioTitle ||
    !body.difficultyId ||
    typeof body.round !== "number" ||
    typeof body.year !== "number" ||
    !body.policies ||
    !body.beforeState
  ) {
    return NextResponse.json({ error: "Missing required competition decision fields." }, { status: 400 });
  }

  const olympiad = getOlympiadByAccessCode(body.accessCode);
  if (!olympiad || olympiad.slug !== body.olympiadSlug) {
    return NextResponse.json({ error: "Invalid competition login for this decision." }, { status: 403 });
  }

  if (!olympiadBackendConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env" });
  }

  const attempt = await upsertOlympiadAttempt({
    olympiadSlug: olympiad.slug,
    olympiadTitle: olympiad.title,
    accessCode: olympiad.accessCode,
    participantLogin: body.participantLogin,
    teamName: body.teamName,
    runId: body.runId,
    scenarioId: body.scenarioId,
    scenarioTitle: body.scenarioTitle,
    difficultyId: body.difficultyId,
    status: body.runComplete ? "completed" : "active",
    finalScore: body.finalScore ?? null,
    rankTitle: body.rankTitle ?? null,
    victory: body.victory ?? null,
    summary: body.summary ?? null,
    roundsCompleted: body.roundsCompleted ?? null,
    scoreBreakdown: body.scoreBreakdown ?? null,
    finalState: body.finalState ?? null
  });

  if (!attempt) {
    return NextResponse.json({ error: "Unable to create competition attempt." }, { status: 500 });
  }

  const decision = await upsertOlympiadDecision({
    attemptId: attempt.id,
    runId: body.runId,
    round: body.round,
    year: body.year,
    policies: body.policies,
    beforeState: body.beforeState,
    afterState: body.phase === "complete" ? body.afterState ?? null : null,
    prediction: body.prediction ?? null,
    policySummary: body.phase === "complete" ? body.policySummary ?? null : null,
    citizenSummary: body.phase === "complete" ? body.citizenSummary ?? null : null,
    scoreAfter: body.phase === "complete" ? body.scoreAfter ?? null : null
  });

  return NextResponse.json({ ok: true, persisted: true, attempt, decision });
}
