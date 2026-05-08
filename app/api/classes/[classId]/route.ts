import { NextResponse } from "next/server";

import { getClassroomBundle, getProfileByClerkUserId, hasDataBackend } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET(_: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, bundle: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const { classId } = await params;
  const bundle = await getClassroomBundle(classId);
  if (!bundle) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  if (bundle.classroom.teacherProfileId !== profile.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, bundle, persisted: true });
}
