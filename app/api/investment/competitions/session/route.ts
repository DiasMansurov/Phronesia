import { NextResponse } from "next/server";

import { clearInvestmentTeamSessionCookie, getInvestmentAccess } from "@/lib/investment-access";
import { resolveExistingInvestmentCompetition } from "@/lib/server-investments";

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

  const competition = await resolveExistingInvestmentCompetition(code);
  if (!competition) {
    return NextResponse.json({ ok: false, reason: "Competition not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    competition,
    redirectTo: "/investment-challenge/join"
  });
}

export async function DELETE() {
  await clearInvestmentTeamSessionCookie();
  return NextResponse.json({ ok: true });
}
