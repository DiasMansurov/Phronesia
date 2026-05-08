import type { Metadata } from "next";
import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Phronesia account, email, password, and profile settings."
};

export default async function AccountPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Personal Cabinet</p>
          <h1>Authentication is not configured yet</h1>
          <p className="muted">Add Clerk environment keys to enable account management.</p>
          <Link className="button primary" href="/">
            Back Home
          </Link>
        </div>
      </section>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <section className="shell section auth-page">
      <div className="auth-shell account-shell">
        <div className="panel stack-md auth-copy">
          <p className="eyebrow">Personal Cabinet</p>
          <h1>Your Phronesia account.</h1>
          <p className="muted">
            Manage your email, password, profile information, and security settings through Clerk.
          </p>
          <div className="goal-list compact-list">
            <div className="goal-item">Verified email identity.</div>
            <div className="goal-item">Password-based future sign-in.</div>
            <div className="goal-item">Ready for saved progress, classes, and rankings.</div>
          </div>
        </div>
        <div className="auth-card account-card">
          <UserProfile routing="path" path="/account" />
        </div>
      </div>
    </section>
  );
}
