import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { createOrUpdateInvestmentCompetition } from "@/lib/server-investments";

export async function POST(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) return organizer.errorResponse;

  const form = await request.formData().catch(() => null);
  const json = form ? null : ((await request.json().catch(() => ({}))) as Record<string, unknown>);
  const read = (key: string) => String(form?.get(key) ?? json?.[key] ?? "").trim();
  const startingCash = Number(read("startingCash") || read("starting_cash") || 100000);

  const competition = await createOrUpdateInvestmentCompetition({
    code: read("code"),
    name: read("name"),
    description: read("description"),
    startingCash,
    startAt: read("startAt") || read("start_at"),
    endAt: read("endAt") || read("end_at"),
    status: read("status"),
    rankingMethod: read("rankingMethod") || read("ranking_method"),
    allowedAssets: read("allowedAssets") || read("allowed_assets"),
    tradingRules: read("tradingRules") || read("trading_rules")
  });

  if (!competition) {
    return NextResponse.json({ ok: false, error: "Competition could not be saved." }, { status: 400 });
  }

  if (form) {
    return NextResponse.redirect(new URL("/investment-challenge/admin", request.url));
  }

  return NextResponse.json({ ok: true, competition });
}
