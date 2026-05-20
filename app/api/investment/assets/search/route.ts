import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { searchAssets } from "@/lib/server-investments";

export async function GET(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await searchAssets(query);
  return NextResponse.json({ ok: true, results });
}
