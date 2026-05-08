import { NextResponse } from "next/server";

import type { AgeBand, UserRole } from "@/lib/game/types";
import { getProfileByClerkUserId, hasDataBackend, upsertProfile } from "@/lib/server-classrooms";
import { requireUserId } from "@/lib/server-auth";

export async function GET() {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, profile: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await getProfileByClerkUserId(userId);
  return NextResponse.json({ ok: true, profile, persisted: true });
}

export async function POST(request: Request) {
  const { userId, errorResponse } = await requireUserId();
  if (errorResponse) return errorResponse;

  const body = (await request.json()) as {
    displayName?: string;
    role?: UserRole;
    schoolName?: string;
    countryCode?: string;
    jurisdiction?: string;
    ageBand?: AgeBand | null;
    schoolManaged?: boolean;
    onboardingCompleted?: boolean;
  };

  if (!body.displayName || !body.role || !body.countryCode || !body.jurisdiction) {
    return NextResponse.json({ error: "Missing required profile fields." }, { status: 400 });
  }

  if (!hasDataBackend()) {
    return NextResponse.json({ ok: true, profile: null, persisted: false, reason: "missing_supabase_env" });
  }

  const profile = await upsertProfile({
    clerkUserId: userId,
    displayName: body.displayName,
    role: body.role,
    schoolName: body.schoolName ?? null,
    countryCode: body.countryCode,
    jurisdiction: body.jurisdiction,
    ageBand: body.ageBand ?? null,
    schoolManaged: Boolean(body.schoolManaged),
    onboardingCompleted: Boolean(body.onboardingCompleted)
  });

  return NextResponse.json({ ok: true, profile, persisted: true });
}
