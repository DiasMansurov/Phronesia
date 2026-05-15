import { NextResponse } from "next/server";

import {
  createOrGetInvestmentAccount,
  getInvestmentAccountView
} from "@/lib/server-investments";
import { supabaseConfigured } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId")?.trim();
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required." }, { status: 400 });
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
  const body = (await request.json().catch(() => ({}))) as {
    teamName?: string;
    participantLogin?: string;
    competitionSlug?: string;
  };

  if (!body.teamName?.trim()) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env", account: null });
  }

  const account = await createOrGetInvestmentAccount({
    teamName: body.teamName,
    participantLogin: body.participantLogin,
    competitionSlug: body.competitionSlug
  });

  return NextResponse.json({ ok: true, persisted: true, account });
}
