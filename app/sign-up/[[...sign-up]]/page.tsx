import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Phronesia account with email verification and a password."
};

export default function SignUpPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Create Account</p>
          <h1>Authentication is not configured yet</h1>
          <p className="muted">Add Clerk environment keys to enable email codes, passwords, and account sessions.</p>
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
          <p className="eyebrow">Join Phronesia</p>
          <h1>Create your learning account.</h1>
          <p className="muted">
            Register with email, confirm the code sent by Clerk, then set a password for future sign-ins.
          </p>
          <div className="goal-list compact-list">
            <div className="goal-item">Use verified email accounts for classroom and challenge access.</div>
            <div className="goal-item">Return later with email and password.</div>
            <div className="goal-item">Build a persistent finance and economics learning profile.</div>
          </div>
        </div>
        <div className="auth-card">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/account"
          />
        </div>
      </div>
    </section>
  );
}
