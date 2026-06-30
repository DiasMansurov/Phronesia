import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { saveInvestmentPriceOverride } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  try {
    const body = (await request.json()) as { symbol?: unknown; price?: unknown; note?: unknown };
    const saved = await saveInvestmentPriceOverride({
      symbol: String(body.symbol ?? ""),
      price: Number(body.price),
      note: typeof body.note === "string" ? body.note : null,
      createdBy: organizer.userEmail ?? "investment-admin"
    });
    return NextResponse.json({ ok: true, override: saved });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to save the emergency price override." },
      { status: 400 }
    );
  }
}
