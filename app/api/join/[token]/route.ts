import { NextResponse } from "next/server";

import type { AgeBand } from "@/lib/game/types";
import { consentRequirement } from "@/lib/policy";
import {
  createLegalAcceptances,
  findJoinToken,
  getProfileByClerkUserId,
  hasDataBackend,
  joinClassroom,
  upsertProfile
} from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, join: null, persisted: false, reason: "missing_supabase_env" });
  }

  const { token } = await params;
  const join = await findJoinToken({ token });
  if (!join) {
    return NextResponse.json({ error: "Join link not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, join, persisted: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as {
    displayName?: string;
    schoolName?: string;
    countryCode?: string;
    jurisdiction?: string;
    ageBand?: AgeBand;
  };

  if (!body.displayName || !body.countryCode || !body.jurisdiction || !body.ageBand) {
    return NextResponse.json({ error: "Missing required join fields." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env" });
  }

  const { token } = await params;
  const join = await findJoinToken({ token });
  if (!join) {
    return NextResponse.json({ error: "Join link not found." }, { status: 404 });
  }

  if (join.isExpired || !join.group) {
    return NextResponse.json({ error: "This join link is no longer active." }, { status: 410 });
  }

  const existing = await getProfileByClerkUserId(userId);
  const profile = await upsertProfile({
    clerkUserId: userId,
    displayName: body.displayName,
    role: "student",
    schoolName: body.schoolName ?? join.classroom.schoolName,
    countryCode: body.countryCode,
    jurisdiction: body.jurisdiction,
    ageBand: body.ageBand,
    schoolManaged: true,
    onboardingCompleted: true
  });

  if (!profile) {
    return NextResponse.json({ error: "Student profile unavailable." }, { status: 500 });
  }

  const consent = consentRequirement(body.ageBand, body.jurisdiction);
  if (!consent.canSelfServe && body.ageBand !== "under_13") {
    return NextResponse.json(
      { error: "This account requires a separate parental consent path before direct student activation." },
      { status: 403 }
    );
  }

  const membership = await joinClassroom({
    profileId: profile.id,
    classId: join.classroom.id,
    groupId: join.group.id,
    joinedViaTokenId: join.joinToken.id
  });

  await createLegalAcceptances({
    profileId: profile.id,
    jurisdiction: body.jurisdiction,
    acceptedBy: consent.acceptedBy,
    classId: join.classroom.id,
    groupId: join.group.id
  });

  return NextResponse.json({
    ok: true,
    profile,
    existingProfile: Boolean(existing),
    membership,
    classroom: join.classroom,
    group: join.group,
    consentSummary: consent.summary,
    persisted: true
  });
}
