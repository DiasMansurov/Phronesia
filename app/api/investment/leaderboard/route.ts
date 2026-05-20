import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { listInvestmentLeaderboard } from "@/lib/server-investments";

export async function GET(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { searchParams } = new URL(request.url);
  const requestedCode = searchParams.get("competitionCode") ?? searchParams.get("competition") ?? undefined;
  const competitionCode =
    access.access.allowed && (!requestedCode || requestedCode === access.access.competitionCode)
      ? access.access.competitionCode
      : requestedCode;
  if (access.access.allowed && requestedCode && requestedCode !== access.access.competitionCode) {
    return NextResponse.json({ ok: false, error: "You can only view the current competition leaderboard." }, { status: 403 });
  }
  const leaderboard = await listInvestmentLeaderboard(competitionCode);
  return NextResponse.json({ ok: true, ...leaderboard });
}
