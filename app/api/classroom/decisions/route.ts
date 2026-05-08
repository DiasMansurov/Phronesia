import { NextResponse } from "next/server";

import type { DifficultyId, MacroState, Policies, PolicyPrediction } from "@/lib/game/types";
import {
  getActiveStudentClassroom,
  getProfileByClerkUserId,
  hasDataBackend,
  upsertClassPolicyDecision,
  upsertClassRunAttempt
} from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

type DecisionPayload = {
  phase?: "begin" | "complete";
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
  finalScore?: number;
  rankTitle?: string;
  victory?: boolean;
  summary?: string;
  roundsCompleted?: number;
};

function validPrediction(prediction: PolicyPrediction | undefined) {
  const directions = ["increase", "decrease", "no_change"];
  return Boolean(
    prediction &&
      directions.includes(prediction.aggregateDemand) &&
      directions.includes(prediction.aggregateSupply) &&
      directions.includes(prediction.unemployment) &&
      directions.includes(prediction.inflation) &&
      prediction.explanation.trim().length > 0
  );
}

export async function POST(request: Request) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as DecisionPayload;
  if (
    !body.phase ||
    !body.runId ||
    !body.scenarioId ||
    !body.scenarioTitle ||
    !body.difficultyId ||
    typeof body.round !== "number" ||
    typeof body.year !== "number" ||
    !body.policies ||
    !body.beforeState ||
    !validPrediction(body.prediction)
  ) {
    return NextResponse.json({ error: "Missing required classroom decision fields." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ error: "Classroom persistence is not configured." }, { status: 503 });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "Student classroom access required." }, { status: 403 });
  }

  const context = await getActiveStudentClassroom(profile.id);
  if (!context) {
    return NextResponse.json({ error: "Join a class before submitting classroom decisions." }, { status: 403 });
  }

  const attempt = await upsertClassRunAttempt({
    runId: body.runId,
    classId: context.membership.classId,
    groupId: context.membership.groupId,
    studentProfileId: profile.id,
    scenarioId: body.scenarioId,
    scenarioTitle: body.scenarioTitle,
    difficultyId: body.difficultyId,
    status: body.runComplete ? "completed" : "active",
    finalScore: body.finalScore ?? null,
    rankTitle: body.rankTitle ?? null,
    victory: body.victory ?? null,
    summary: body.summary ?? null,
    roundsCompleted: body.roundsCompleted ?? null
  });

  if (!attempt) {
    return NextResponse.json({ error: "Unable to create classroom run attempt." }, { status: 500 });
  }

  const decision = await upsertClassPolicyDecision({
    attemptId: attempt.id,
    runId: body.runId,
    round: body.round,
    year: body.year,
    policies: body.policies,
    beforeState: body.beforeState,
    afterState: body.phase === "complete" ? body.afterState ?? null : null,
    prediction: body.prediction!,
    policySummary: body.phase === "complete" ? body.policySummary ?? null : null,
    citizenSummary: body.phase === "complete" ? body.citizenSummary ?? null : null,
    scoreAfter: body.phase === "complete" ? body.scoreAfter ?? null : null
  });

  return NextResponse.json({ ok: true, attempt, decision, context, persisted: true });
}
