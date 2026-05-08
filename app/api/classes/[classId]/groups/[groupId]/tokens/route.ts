import { NextResponse } from "next/server";

import { createJoinToken, getClassroom, getProfileByClerkUserId, hasDataBackend } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string; groupId: string }> }
) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, token: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const { classId, groupId } = await params;
  const classroom = await getClassroom(classId);
  if (!classroom || classroom.teacherProfileId !== profile.id) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const token = await createJoinToken({
    classId,
    groupId,
    createdByProfileId: profile.id,
    origin: new URL(request.url).origin
  });

  return NextResponse.json({ ok: true, token, persisted: true });
}
