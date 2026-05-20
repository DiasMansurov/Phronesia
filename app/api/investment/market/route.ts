import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { INVESTMENT_EDUCATIONAL_CARDS } from "@/lib/investment-challenge";
import { getMarketStatus, listInvestmentAssetQuotes } from "@/lib/server-investments";

export async function GET() {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const quotes = await listInvestmentAssetQuotes();
  return NextResponse.json({
    ok: true,
    marketStatus: getMarketStatus(),
    quotes,
    educationalCards: INVESTMENT_EDUCATIONAL_CARDS
  });
}
