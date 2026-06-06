import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { adminAccessMessage, requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";

export const metadata: Metadata = {
  title: "Investment Challenge Results",
  description: "Private admin-only investment competition results for Phronesia.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvestmentChallengeLeaderboardPage() {
  const admin = await requireInvestmentAdmin();
  if (admin.ok) redirect("/investment-challenge/admin/results");
  if (!admin.ok && admin.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/investment-challenge/admin/results");
  }

  return (
    <section className="shell section auth-page">
      <div className="panel stack-md">
        <p className="eyebrow">Private Results</p>
        <h1>Admin access required.</h1>
        <p className="muted">
          Investment competition rankings, team balances, and portfolio values are visible only in the private admin Results tab.
        </p>
        <p className="muted small">{adminAccessMessage(admin.reason)}</p>
        <Link className="button primary" href="/investment-challenge/app">
          Back to Team Dashboard
        </Link>
      </div>
    </section>
  );
}
