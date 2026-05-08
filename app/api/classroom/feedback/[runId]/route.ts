import { NextResponse } from "next/server";

import { getProfileByClerkUserId, hasDataBackend, listStudentRunFeedback } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, decisions: [], persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "Student access required." }, { status: 403 });
  }

  const { runId } = await params;
  const decisions = await listStudentRunFeedback({ profileId: profile.id, runId });
  return NextResponse.json({ ok: true, decisions, persisted: true });
}
