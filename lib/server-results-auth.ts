import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_RESULTS_ADMIN_EMAIL, normalizeEmail } from "@/lib/results-access";

type ClaimMap = Record<string, unknown>;

function configuredResultsAdminEmails() {
  const configured = process.env.RESULTS_ADMIN_EMAILS;
  if (!configured) return [DEFAULT_RESULTS_ADMIN_EMAIL];

  const emails = configured
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  return emails.length ? emails : [DEFAULT_RESULTS_ADMIN_EMAIL];
}

export async function requireResultsOrganizer() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      ok: false as const,
      reason: "auth_unconfigured" as const,
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Authentication is not configured." }, { status: 401 })
    };
  }

  let session;
  try {
    session = await auth();
  } catch {
    return {
      ok: false as const,
      reason: "auth_error" as const,
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Unable to verify organizer account." }, { status: 401 })
    };
  }

  if (!session.userId) {
    return {
      ok: false as const,
      reason: "signed_out" as const,
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Sign in to view results." }, { status: 401 })
    };
  }

  const claims = (session.sessionClaims ?? {}) as ClaimMap;
  const userEmail = extractEmailFromClaims(claims) || (await resolveEmailFromClerkUser(session.userId));

  if (!userEmail) {
    return {
      ok: false as const,
      reason: "missing_email" as const,
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Your signed-in session does not include an email address." }, { status: 403 })
    };
  }

  if (!configuredResultsAdminEmails().includes(userEmail)) {
    return {
      ok: false as const,
      reason: "not_organizer" as const,
      userEmail,
      errorResponse: NextResponse.json({ error: "Results are available only for the organizer account." }, { status: 403 })
    };
  }

  return { ok: true as const, reason: null, userEmail, errorResponse: null };
}

async function resolveEmailFromClerkUser(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return normalizeEmail(user.primaryEmailAddress?.emailAddress);
  } catch {
    return "";
  }
}

function extractEmailFromClaims(claims: ClaimMap) {
  const candidates = [
    claims.email,
    claims.email_address,
    claims.primary_email_address,
    claims.primaryEmailAddress,
    claims.preferred_email
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") return normalizeEmail(candidate);
    if (candidate && typeof candidate === "object") {
      const nested = candidate as ClaimMap;
      if (typeof nested.emailAddress === "string") return normalizeEmail(nested.emailAddress);
      if (typeof nested.email_address === "string") return normalizeEmail(nested.email_address);
    }
  }

  return "";
}
