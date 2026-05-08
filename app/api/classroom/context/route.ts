import { NextResponse } from "next/server";

import { getActiveStudentClassroom, getProfileByClerkUserId, hasDataBackend } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET() {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, context: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ ok: true, context: null, persisted: true });
  }

  const context = await getActiveStudentClassroom(profile.id);
  return NextResponse.json({ ok: true, context, profile, persisted: true });
}
