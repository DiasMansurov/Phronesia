import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_RESULTS_ADMIN_EMAIL, normalizeEmail } from "@/lib/results-access";

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
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Authentication is not configured." }, { status: 401 })
    };
  }

  const user = await currentUser();
  const userEmail = normalizeEmail(user?.primaryEmailAddress?.emailAddress);

  if (!user || !userEmail) {
    return {
      ok: false as const,
      userEmail: null,
      errorResponse: NextResponse.json({ error: "Sign in to view results." }, { status: 401 })
    };
  }

  if (!configuredResultsAdminEmails().includes(userEmail)) {
    return {
      ok: false as const,
      userEmail,
      errorResponse: NextResponse.json({ error: "Results are available only for the organizer account." }, { status: 403 })
    };
  }

  return { ok: true as const, userEmail, errorResponse: null };
}
