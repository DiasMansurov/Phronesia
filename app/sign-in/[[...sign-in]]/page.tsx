import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Phronesia account with your email and password."
};

export default function SignInPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Account Access</p>
          <h1>Authentication is not configured yet</h1>
          <p className="muted">Add Clerk environment keys to enable email verification, passwords, and account sessions.</p>
          <Link className="button primary" href="/">
            Back Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell section auth-page">
      <div className="auth-shell">
        <div className="panel stack-md auth-copy">
          <p className="eyebrow">Phronesia Account</p>
          <h1>Welcome back.</h1>
          <p className="muted">
            Sign in with the same email and password you created after verifying your email code.
          </p>
          <div className="goal-list compact-list">
            <div className="goal-item">Save progress across devices.</div>
            <div className="goal-item">Access teacher classes and rankings.</div>
            <div className="goal-item">Keep learning history and achievements together.</div>
          </div>
        </div>
        <div className="auth-card">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/account"
          />
        </div>
      </div>
    </section>
  );
}
