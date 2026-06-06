import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireInvestmentAdmin();
  if (admin.errorResponse) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedCode = searchParams.get("competitionCode") ?? searchParams.get("competition") ?? undefined;
  const bundle = await listInvestmentAdminResults(requestedCode ?? "Teenvestor.school");
  return NextResponse.json({
    ok: true,
    persisted: bundle.persisted,
    competition: bundle.competition,
    rows: bundle.teams,
    summary: bundle.stats
  });
}
