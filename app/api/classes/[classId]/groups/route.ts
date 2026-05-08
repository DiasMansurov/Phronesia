import { NextResponse } from "next/server";

import { createGroup, getClassroom, getProfileByClerkUserId, hasDataBackend } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as { name?: string };
  if (!body.name) {
    return NextResponse.json({ error: "Group name is required." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, group: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const { classId } = await params;
  const classroom = await getClassroom(classId);
  if (!classroom || classroom.teacherProfileId !== profile.id) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const group = await createGroup(classId, body.name);
  return NextResponse.json({ ok: true, group, persisted: true });
}
