import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { getInvestmentAdminTeamDetail } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

type RouteContext = {
  params: Promise<{ teamId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return noStoreJson({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { teamId } = await context.params;
  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  try {
    const detail = await getInvestmentAdminTeamDetail(teamId, competitionCode);

    if (!detail.overview) {
      return noStoreJson({ ok: false, error: "Team was not found in this competition." }, { status: 404 });
    }

    return noStoreJson({ ok: true, ...detail });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error ?? "Failed to load team details.")
      },
      { status: 500 }
    );
  }
}
