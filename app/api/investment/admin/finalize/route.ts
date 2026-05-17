import { NextResponse } from "next/server";

import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { finalizeInvestmentCompetition } from "@/lib/server-investments";

export async function POST(request: Request) {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

  const form = await request.formData().catch(() => null);
  const json = form ? null : ((await request.json().catch(() => ({}))) as Record<string, unknown>);
  const code = String(form?.get("code") ?? json?.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ ok: false, error: "Competition code is required." }, { status: 400 });
  }

  const result = await finalizeInvestmentCompetition(code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }

  if (form) {
    return NextResponse.redirect(new URL("/investment-challenge/admin", request.url));
  }

  return NextResponse.json(result);
}
