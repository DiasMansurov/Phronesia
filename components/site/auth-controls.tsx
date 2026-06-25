"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

function SignedInControls() {
  return (
    <div className="auth-user">
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
        </div>
      </Show>
      <Show when="signed-in">
        <SignedInControls />
      </Show>
    </div>
  );
}
