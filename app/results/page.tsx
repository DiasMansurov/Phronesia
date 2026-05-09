import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ResultsDashboard } from "@/components/olympiad/results-dashboard";

export const metadata: Metadata = {
  title: "Results",
  description: "Organizer results dashboard for Phronesia olympiad teams, scores, rankings, and decisions.",
  alternates: {
    canonical: "/results"
  }
};

export default async function ResultsPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Results</p>
          <h1>Authentication is not configured yet</h1>
          <p className="muted">Add Clerk environment keys to enable organizer results.</p>
          <Link className="button primary" href="/">
            Back Home
          </Link>
        </div>
      </section>
    );
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/results");
  }

  return <ResultsDashboard />;
}
