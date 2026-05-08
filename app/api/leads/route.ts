import { NextResponse } from "next/server";

import { insertRow, supabaseConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      name?: string;
      email?: string;
      organization?: string;
      note?: string;
    };

    if (!body.type || !body.name || !body.email) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env" });
    }

    await insertRow("leads", {
      type: body.type,
      name: body.name,
      email: body.email,
      organization: body.organization ?? null,
      note: body.note ?? null
    });

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
