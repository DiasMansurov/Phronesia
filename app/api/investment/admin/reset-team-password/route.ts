import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { resetInvestmentTeamPassword } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return noStoreJson({ ok: false, error: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const teamId = typeof payload.teamId === "string" ? payload.teamId.trim() : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  const result = await resetInvestmentTeamPassword({
    teamId,
    newPassword,
    adminEmail: organizer.userEmail
  });

  if (!result.ok) {
    return noStoreJson({ ok: false, error: result.reason }, { status: result.status });
  }

  return noStoreJson({
    ok: true,
    message: "Team password reset successfully.",
    teamId: result.teamId,
    teamName: result.teamName,
    invalidatedSessions: result.invalidatedSessions
  });
}
