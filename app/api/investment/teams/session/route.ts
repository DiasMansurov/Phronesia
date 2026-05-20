import { NextResponse } from "next/server";

import {
  clearInvestmentTeamSessionCookie,
  getInvestmentAccess,
  setInvestmentTeamSessionCookie
} from "@/lib/investment-access";
import { createOrEnterInvestmentTeam } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const access = await getInvestmentAccess();
  return NextResponse.json({
    ok: access.allowed,
    accountId: access.allowed ? access.accountId : null,
    teamName: access.allowed ? access.teamName : null,
    competition: access.allowed ? access.competition : null,
    account: access.allowed ? access.account : null
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    competitionCode?: string;
    teamName?: string;
    password?: string;
  };

  const result = await createOrEnterInvestmentTeam({
    competitionCode: body.competitionCode ?? "",
    teamName: body.teamName ?? "",
    password: body.password ?? ""
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: result.status });
  }

  await setInvestmentTeamSessionCookie(result.session.token, result.session.expiresAt);

  return NextResponse.json({
    ok: true,
    message: result.session.message,
    created: result.session.created,
    competition: result.session.competition,
    account: result.session.account,
    redirectTo: "/investment-challenge/app"
  });
}

export async function DELETE() {
  await clearInvestmentTeamSessionCookie();
  return NextResponse.json({ ok: true });
}
