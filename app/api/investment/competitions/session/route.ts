import { NextResponse } from "next/server";

import {
  clearInvestmentCompetitionCookie,
  getInvestmentAccess,
  setInvestmentCompetitionCookie
} from "@/lib/investment-access";
import { resolveInvestmentCompetition } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const access = await getInvestmentAccess();
  return NextResponse.json({
    ok: access.allowed,
    accessType: access.allowed ? access.reason : null,
    competition: access.allowed ? access.competition : null,
    competitionCode: access.allowed ? access.competitionCode : null
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim() ?? "";

  if (!code) {
    return NextResponse.json({ ok: false, reason: "Competition code is required." }, { status: 400 });
  }

  const competition = await resolveInvestmentCompetition(code);
  if (!competition) {
    return NextResponse.json({ ok: false, reason: "Competition code was not found." }, { status: 404 });
  }

  await setInvestmentCompetitionCookie(competition.code);

  return NextResponse.json({
    ok: true,
    competition,
    redirectTo: "/investment-challenge/app"
  });
}

export async function DELETE() {
  await clearInvestmentCompetitionCookie();
  return NextResponse.json({ ok: true });
}
