import { NextResponse } from "next/server";

import { resolveExistingInvestmentCompetition } from "@/lib/server-investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const competition = await resolveExistingInvestmentCompetition(code);
  if (!competition) {
    return NextResponse.json({ ok: false, reason: "Competition not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, competition });
}
