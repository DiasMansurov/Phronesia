import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { getInvestmentAdminTeamDetail } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ teamId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const { teamId } = await context.params;
  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  const detail = await getInvestmentAdminTeamDetail(teamId, competitionCode);

  if (!detail.overview) {
    return NextResponse.json({ ok: false, error: "Team was not found in this competition." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...detail });
}
