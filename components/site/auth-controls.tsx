"use client";

import Link from "next/link";
import { Show, UserButton, useUser } from "@clerk/nextjs";

import { isDefaultResultsAdminEmail } from "@/lib/results-access";

function SignedInControls() {
  const { user } = useUser();
  const canViewResults = isDefaultResultsAdminEmail(user?.primaryEmailAddress?.emailAddress);

  return (
    <div className="auth-user">
      {canViewResults ? (
        <Link className="button secondary account-link" href="/results">
          Results
        </Link>
      ) : null}
      <Link className="button secondary account-link" href="/account">
        Account
      </Link>
      <UserButton />
    </div>
  );
}

export function AuthControls() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <div className="auth-controls">
        <div className="auth-disabled">Auth coming soon</div>
      </div>
    );
  }

  return (
    <div className="auth-controls">
      <Show when="signed-out">
        <div className="auth-actions">
          <Link className="button secondary" href="/sign-in">
            Sign In
          </Link>
          <Link className="button primary" href="/sign-up">
            Sign Up
          </Link>
        </div>
      </Show>
      <Show when="signed-in">
        <SignedInControls />
      </Show>
    </div>
  );
}
