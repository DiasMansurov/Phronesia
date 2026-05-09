import { NextResponse } from "next/server";

import { listActiveOlympiads } from "@/lib/olympiads";
import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { listOlympiadAttemptsWithDecisions, olympiadBackendConfigured } from "@/lib/server-olympiads";

export async function GET() {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

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

  try {
    const { attempts, decisions } = await listOlympiadAttemptsWithDecisions();
    return NextResponse.json({
      ok: true,
      persisted: true,
      olympiads: listActiveOlympiads(),
      attempts,
      decisions
    });
  } catch {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "database_error",
      olympiads: listActiveOlympiads(),
      attempts: [],
      decisions: []
    });
  }
}
