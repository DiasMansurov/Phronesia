import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  try {
    const bundle = await listInvestmentAdminResults(competitionCode);
    return NextResponse.json({
      ok: true,
      persisted: bundle.persisted,
      competition: bundle.competition,
      summary: bundle.stats,
      stats: bundle.stats,
      teams: bundle.teams
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error ?? "Failed to load admin results.")
      },
      { status: 500 }
    );
  }
}
