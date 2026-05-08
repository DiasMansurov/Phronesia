import { NextResponse } from "next/server";

import {
  getClassroom,
  getClassRunAttemptWithDecisions,
  getProfileByClerkUserId,
  hasDataBackend
} from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ classId: string; attemptId: string }> }
) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, attempt: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const { classId, attemptId } = await params;
  const classroom = await getClassroom(classId);
  if (!classroom || classroom.teacherProfileId !== profile.id) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const attempt = await getClassRunAttemptWithDecisions({ classId, attemptId });
  if (!attempt) {
    return NextResponse.json({ error: "Run attempt not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, attempt, persisted: true });
}
