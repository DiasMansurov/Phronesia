import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { getInvestmentAccountView } from "@/lib/server-investments";
import { supabaseConfigured } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId")?.trim();
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required." }, { status: 400 });
  }
  if (access.access.allowed && accountId !== access.access.accountId) {
    return NextResponse.json({ error: "You can only open the current team portfolio." }, { status: 403 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env", account: null });
  }

  const account = await getInvestmentAccountView(accountId);
  if (!account) {
    return NextResponse.json({ error: "Investment account was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, persisted: true, account });
}

export async function POST(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  return NextResponse.json({
    ok: true,
    persisted: true,
    account: access.access.allowed ? access.access.account : null,
    message: "Team portfolios are created through /investment-challenge/join."
  });
}
