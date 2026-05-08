import { NextResponse } from "next/server";

import type { AgeBand } from "@/lib/game/types";
import {
  createClassroom,
  getProfileByClerkUserId,
  hasDataBackend,
  listTeacherClassrooms,
  upsertProfile
} from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

async function ensureTeacherProfile(userId: string) {
  let profile = await getProfileByClerkUserId(userId);
  if (profile) return profile;

  profile = await upsertProfile({
    clerkUserId: userId,
    displayName: "Teacher",
    role: "teacher",
    schoolName: null,
    countryCode: "US",
    jurisdiction: "US",
    ageBand: null,
    schoolManaged: true,
    onboardingCompleted: false
  });

  return profile;
}

export async function GET() {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, classes: [], persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await ensureTeacherProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Teacher profile unavailable." }, { status: 500 });
  }

  const classes = await listTeacherClassrooms(profile.id);
  return NextResponse.json({ ok: true, classes, profile, persisted: true });
}

export async function POST(request: Request) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as {
    name?: string;
    schoolName?: string;
    countryCode?: string;
    jurisdiction?: string;
    ageBandDefault?: AgeBand;
    displayName?: string;
  };

  if (!body.name || !body.countryCode || !body.jurisdiction || !body.ageBandDefault) {
    return NextResponse.json({ error: "Missing required classroom fields." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, classroom: null, persisted: false, reason: "missing_supabase_env" });
  }

  const baseProfile = await ensureTeacherProfile(userId);
  if (!baseProfile) {
    return NextResponse.json({ error: "Teacher profile unavailable." }, { status: 500 });
  }

  const profile = await upsertProfile({
    clerkUserId: userId,
    displayName: body.displayName ?? baseProfile.displayName,
    role: "teacher",
    schoolName: body.schoolName ?? baseProfile.schoolName,
    countryCode: body.countryCode,
    jurisdiction: body.jurisdiction,
    ageBand: null,
    schoolManaged: true,
    onboardingCompleted: true
  });

  if (!profile) {
    return NextResponse.json({ error: "Teacher profile unavailable." }, { status: 500 });
  }

  const classroom = await createClassroom({
    teacherProfileId: profile.id,
    name: body.name,
    schoolName: body.schoolName ?? null,
    countryCode: body.countryCode,
    jurisdiction: body.jurisdiction,
    ageBandDefault: body.ageBandDefault
  });

  return NextResponse.json({ ok: true, classroom, profile, persisted: true });
}
