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
  const rawSymbol = (searchParams.get("symbol") ?? "").trim();
  const symbol = rawSymbol.toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9.-]{0,9}$/.test(symbol)) {
    return NextResponse.json(
      { ok: false, error: "Invalid ticker format. Use one ticker only, for example AAPL." },
      { status: 400 }
    );
  }

  return NextResponse.json(await debugMarketDataAppPrice(symbol));
}
