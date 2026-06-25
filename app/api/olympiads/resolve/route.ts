import { NextResponse } from "next/server";

import {
  getOlympiadByAccessCode,
  getOlympiadByAccessCodeIncludingInactive,
  getOlympiadScenario,
  isOfficialTeenvestorCompetitionLogin
} from "@/lib/olympiads";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string; teamName?: string };
  const login = body.login?.trim() ?? "";
  const teamName = body.teamName?.trim() ?? "";

  if (login && isOfficialTeenvestorCompetitionLogin(login)) {
    // Send to the password-protected join flow — never bypass authentication here.
    return NextResponse.json({
      ok: true,
      mode: "investment",
      redirectTo: "/investment-challenge/join"
    });
  }

  const olympiad = login ? getOlympiadByAccessCode(login) : null;

  if (!olympiad) {
    const inactiveOlympiad = login ? getOlympiadByAccessCodeIncludingInactive(login) : null;
    if (inactiveOlympiad) {
      return NextResponse.json({ error: "Competition access is not open yet." }, { status: 403 });
    }
    return NextResponse.json({ error: "Competition login was not found." }, { status: 404 });
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
