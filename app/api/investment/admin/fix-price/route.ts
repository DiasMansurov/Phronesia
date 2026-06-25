import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { deleteInvalidDailyPrice, refreshPriceCache } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireInvestmentAdmin();
  if (admin.errorResponse) return admin.errorResponse;

  const body = (await request.json().catch(() => ({}))) as { symbol?: unknown; minPrice?: unknown; maxPrice?: unknown };
  const symbol = String(body.symbol ?? "").toUpperCase();
  const minPrice = Number(body.minPrice ?? 0);
  const maxPrice = Number(body.maxPrice ?? 999999);

  if (!symbol) return NextResponse.json({ ok: false, error: "symbol required" }, { status: 400 });

  await deleteInvalidDailyPrice(symbol, maxPrice, minPrice);
  await refreshPriceCache([symbol]);

  return NextResponse.json({ ok: true, message: `Deleted bad prices for ${symbol} outside [${minPrice}, ${maxPrice}] and refreshed.` });
}
