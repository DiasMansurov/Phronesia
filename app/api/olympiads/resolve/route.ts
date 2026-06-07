import { NextResponse } from "next/server";

import { setInvestmentTeamSessionCookie } from "@/lib/investment-access";
import {
  OFFICIAL_TEENVESTOR_COMPETITION_LOGIN,
  getOlympiadByAccessCode,
  getOlympiadByAccessCodeIncludingInactive,
  getOlympiadScenario,
  isOfficialTeenvestorCompetitionLogin
} from "@/lib/olympiads";
import { createOrGetInvestmentAccount } from "@/lib/server-investments";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string; teamName?: string };
  const login = body.login?.trim() ?? "";
  const teamName = body.teamName?.trim() ?? "";

  if (login && isOfficialTeenvestorCompetitionLogin(login)) {
    if (!teamName) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    if (!process.env.INVESTMENT_TEAM_SESSION_SECRET?.trim()) {
      return NextResponse.json({ error: "Team session secret is not configured." }, { status: 500 });
    }

    const account = await createOrGetInvestmentAccount({
      competitionCode: OFFICIAL_TEENVESTOR_COMPETITION_LOGIN,
      participantLogin: login,
      teamName
    });

    if (!account) {
      return NextResponse.json({ error: "Competition access is temporarily unavailable." }, { status: 503 });
    }

    const cookieResult = await setInvestmentTeamSessionCookie(account);
    if (!cookieResult.ok) {
      return NextResponse.json({ error: cookieResult.reason }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      mode: "investment",
      redirectTo: "/investment-challenge/app",
      competition: account.competition,
      account
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
