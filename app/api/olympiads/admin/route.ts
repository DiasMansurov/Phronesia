import { NextResponse } from "next/server";

import { listActiveOlympiads } from "@/lib/olympiads";
import { listOlympiadAttemptsWithDecisions, olympiadBackendConfigured } from "@/lib/server-olympiads";

function validAdminCode(code: string | undefined) {
  const configured = process.env.OLYMPIAD_ADMIN_CODE;
  if (!configured) {
    return process.env.NODE_ENV !== "production" && code === "local-admin";
  }
  return code === configured;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { adminCode?: string };

  if (!validAdminCode(body.adminCode)) {
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
