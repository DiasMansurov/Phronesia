import { NextResponse } from "next/server";

import { listInvestmentLeaderboard } from "@/lib/server-investments";

export async function GET() {
  const leaderboard = await listInvestmentLeaderboard();
  return NextResponse.json({ ok: true, ...leaderboard });
}
