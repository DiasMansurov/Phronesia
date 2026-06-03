import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { debugMarketDataAppPrice } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required." }, { status: 400 });
  }

  return NextResponse.json(await debugMarketDataAppPrice(symbol));
}
