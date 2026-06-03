import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/results-access";

type ClaimMap = Record<string, unknown>;

function configuredInvestmentAdminEmails() {
  return (process.env.INVESTMENT_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export async function checkInvestmentAdminAccess() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return { ok: false as const, reason: "auth_unconfigured" as const, userEmail: null };
  }

  let session;
  try {
    session = await auth();
  } catch {
    return { ok: false as const, reason: "auth_error" as const, userEmail: null };
  }

  if (!session.userId) {
    return { ok: false as const, reason: "signed_out" as const, userEmail: null };
  }

  const adminEmails = configuredInvestmentAdminEmails();
  if (!adminEmails.length) {
    return { ok: false as const, reason: "admin_not_configured" as const, userEmail: null };
  }

  const claims = (session.sessionClaims ?? {}) as ClaimMap;
  const userEmail = extractEmailFromClaims(claims) || (await resolveEmailFromClerkUser(session.userId));

  if (!userEmail) {
    return { ok: false as const, reason: "missing_email" as const, userEmail: null };
  }

  if (!adminEmails.includes(userEmail)) {
    return { ok: false as const, reason: "not_admin" as const, userEmail };
  }

  return { ok: true as const, reason: null, userEmail };
}

export async function requireInvestmentAdmin() {
  const access = await checkInvestmentAdminAccess();
  if (access.ok) return { ...access, errorResponse: null };

  return {
    ...access,
    errorResponse: NextResponse.json({ error: adminAccessMessage(access.reason) }, { status: 403 })
  };
}

export function adminAccessMessage(reason: string | null) {
  if (reason === "admin_not_configured") return "Investment admin emails are not configured.";
  if (reason === "missing_email") return "Your signed-in session does not include an email address.";
  return "Admin access required.";
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
