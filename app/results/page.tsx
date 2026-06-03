import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { adminAccessMessage, requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";

export const metadata: Metadata = {
  title: "Competition Results Admin",
  description: "Private admin-only results dashboard for the Teenvestor.school Investment Competition.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResultsPage() {
  const admin = await requireInvestmentAdmin();

  if (!admin.ok && admin.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/results");
  }

  if (admin.errorResponse) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Competition Results Admin</p>
          <h1>Admin access required.</h1>
          <p className="muted">{adminAccessMessage(admin.reason)}</p>
          <Link className="button primary" href="/investment-challenge">
            Back to Investment Challenge
          </Link>
        </div>
      </section>
    );
  }

  redirect("/investment-challenge/admin/results");
}
