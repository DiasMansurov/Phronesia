import { NextResponse } from "next/server";

import { checkInvestmentAdminAccess } from "@/lib/server-investment-admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const access = await checkInvestmentAdminAccess();
  return NextResponse.json({ ok: true, isAdmin: access.ok });
}
