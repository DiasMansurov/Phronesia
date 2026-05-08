import { NextResponse } from "next/server";

import type { TeacherFeedbackMark } from "@/lib/game/types";
import {
  getClassroom,
  getDecisionAttempt,
  getProfileByClerkUserId,
  hasDataBackend,
  upsertTeacherDecisionFeedback
} from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

const marks: TeacherFeedbackMark[] = ["correct", "partial", "incorrect"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string; decisionId: string }> }
) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as { mark?: TeacherFeedbackMark; comment?: string };
  if (!body.mark || !marks.includes(body.mark)) {
    return NextResponse.json({ error: "A valid mark is required." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, feedback: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const { classId, decisionId } = await params;
  const classroom = await getClassroom(classId);
  if (!classroom || classroom.teacherProfileId !== profile.id) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const record = await getDecisionAttempt(decisionId);
  if (!record || record.attempt.classId !== classId) {
    return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  }

  const feedback = await upsertTeacherDecisionFeedback({
    decisionId,
    teacherProfileId: profile.id,
    mark: body.mark,
    comment: body.comment ?? ""
  });

  return NextResponse.json({ ok: true, feedback, persisted: true });
}
