import { NextResponse } from "next/server";

import { findJoinToken, hasDataBackend } from "@/lib/server-classrooms";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  if (!body.code) {
    return NextResponse.json({ error: "Join code is required." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, join: null, persisted: false, reason: "missing_supabase_env" });
  }

  const join = await findJoinToken({ code: body.code });
  if (!join) {
    return NextResponse.json({ error: "Join code not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, join, persisted: true });
}
