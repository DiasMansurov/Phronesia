import { NextResponse } from "next/server";

import { getOlympiadByAccessCode, getOlympiadScenario } from "@/lib/olympiads";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string };
  const olympiad = body.login ? getOlympiadByAccessCode(body.login) : null;

  if (!olympiad) {
    return NextResponse.json({ error: "Olympiad login was not found or is not active." }, { status: 404 });
  }

  const scenario = getOlympiadScenario(olympiad);
  return NextResponse.json({
    ok: true,
    olympiad: {
      slug: olympiad.slug,
      title: olympiad.title,
      partner: olympiad.partner,
      accessCode: olympiad.accessCode,
      scenarioId: olympiad.scenarioId,
      difficultyId: olympiad.difficultyId,
      policyComplexity: olympiad.policyComplexity,
      learningMode: olympiad.learningMode,
      briefing: olympiad.briefing,
      rules: olympiad.rules,
      scenarioTitle: scenario.title,
      scenarioSummary: scenario.summary
    }
  });
}
