import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { recalculateOfficialInvestmentTeamPortfolio } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return noStoreJson({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const teamId = typeof body?.teamId === "string" ? body.teamId.trim() : "";
    if (!teamId) {
      return noStoreJson({ ok: false, error: "teamId is required." }, { status: 400 });
    }
    const competitionCode = typeof body?.competitionCode === "string" && body.competitionCode.trim()
      ? body.competitionCode.trim()
      : "Teenvestor.school";
    const result = await recalculateOfficialInvestmentTeamPortfolio(teamId, competitionCode);
    return noStoreJson(result.ok ? result : { ...result, error: result.reason }, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error ?? "Failed to recalculate official team portfolio.")
      },
      { status: 500 }
    );
  }
}
