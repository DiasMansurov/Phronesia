import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { listInvestmentLeaderboard } from "@/lib/server-investments";

export async function GET(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") ?? searchParams.get("competition") ?? undefined;
  const leaderboard = await listInvestmentLeaderboard(competitionCode);
  return NextResponse.json({ ok: true, ...leaderboard });
}
