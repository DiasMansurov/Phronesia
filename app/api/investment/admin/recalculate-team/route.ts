import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST() {
  const admin = await requireInvestmentAdmin();
  if (admin.errorResponse) return admin.errorResponse;

  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      error: "Legacy team recalculation is temporarily disabled while legacy trade classification is under review."
    },
    {
      status: 423,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
