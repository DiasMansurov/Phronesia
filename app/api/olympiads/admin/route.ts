import { NextResponse } from "next/server";

import { listActiveOlympiads } from "@/lib/olympiads";
import { listOlympiadAttemptsWithDecisions, olympiadBackendConfigured } from "@/lib/server-olympiads";

function readAdminCode() {
  return process.env.OLYMPIAD_ADMIN_CODE?.trim();
}

function validAdminCode(submittedCode: string | undefined, configuredCode: string) {
  return (submittedCode ?? "").trim() === configuredCode;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string; adminCode?: string };
  const configuredAdminCode = readAdminCode();
  const submittedCode = body.code ?? body.adminCode;

  if (!configuredAdminCode) {
    return NextResponse.json({ error: "Admin code is not configured." }, { status: 500 });
  }

  if (!validAdminCode(submittedCode, configuredAdminCode)) {
    return NextResponse.json({ error: "Invalid admin access code." }, { status: 403 });
  }

  if (!olympiadBackendConfigured()) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "missing_supabase_env",
      olympiads: listActiveOlympiads(),
      attempts: [],
      decisions: []
    });
  }

  const { attempts, decisions } = await listOlympiadAttemptsWithDecisions();
  return NextResponse.json({
    ok: true,
    persisted: true,
    olympiads: listActiveOlympiads(),
    attempts,
    decisions
  });
}
