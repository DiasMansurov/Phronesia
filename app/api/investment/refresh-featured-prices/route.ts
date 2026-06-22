import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { listInvestmentAssetQuotes } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST() {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  try {
    const quotes = await listInvestmentAssetQuotes();

    return NextResponse.json({
      ok: false,
      providerCalled: false,
      error: "Student price refresh is disabled. Prices are updated automatically every 15 minutes during market hours.",
      quotes
    }, { status: 403 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to refresh featured prices."
      },
      { status: 500 }
    );
  }
}
