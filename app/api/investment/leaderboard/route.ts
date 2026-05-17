import { NextResponse } from "next/server";

import { listInvestmentLeaderboard } from "@/lib/server-investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") ?? searchParams.get("competition") ?? undefined;
  const leaderboard = await listInvestmentLeaderboard(competitionCode);
  return NextResponse.json({ ok: true, ...leaderboard });
}
