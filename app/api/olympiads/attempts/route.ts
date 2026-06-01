import { NextResponse } from "next/server";

import { getOlympiadByAccessCode } from "@/lib/olympiads";
import { olympiadBackendConfigured, upsertOlympiadAttempt } from "@/lib/server-olympiads";
import type { DifficultyId, MacroState } from "@/lib/game/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    olympiadSlug?: string;
    olympiadTitle?: string;
    accessCode?: string;
    participantLogin?: string;
    teamName?: string;
    runId?: string;
    scenarioId?: string;
    scenarioTitle?: string;
    difficultyId?: DifficultyId;
    status?: "active" | "completed";
    finalScore?: number | null;
    rankTitle?: string | null;
    victory?: boolean | null;
    summary?: string | null;
    roundsCompleted?: number | null;
    scoreBreakdown?: unknown;
    finalState?: MacroState | null;
  };

  if (
    !body.accessCode ||
    !body.participantLogin ||
    !body.teamName ||
    !body.runId ||
    !body.scenarioId ||
    !body.scenarioTitle ||
    !body.difficultyId
  ) {
    return NextResponse.json({ error: "Missing required competition attempt fields." }, { status: 400 });
  }

  const olympiad = getOlympiadByAccessCode(body.accessCode);
  if (!olympiad || olympiad.slug !== body.olympiadSlug) {
    return NextResponse.json({ error: "Invalid competition login for this attempt." }, { status: 403 });
  }

  if (!olympiadBackendConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env", attempt: null });
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
    status: body.status ?? "active",
    finalScore: body.finalScore ?? null,
    rankTitle: body.rankTitle ?? null,
    victory: body.victory ?? null,
    summary: body.summary ?? null,
    roundsCompleted: body.roundsCompleted ?? null,
    scoreBreakdown: body.scoreBreakdown ?? null,
    finalState: body.finalState ?? null
  });

  return NextResponse.json({ ok: true, persisted: true, attempt });
}
