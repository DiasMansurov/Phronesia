import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { listInvestmentAdminResults } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const { searchParams } = new URL(request.url);
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  const bundle = await listInvestmentAdminResults(competitionCode);

  return NextResponse.json({ ok: true, ...bundle });
}
