import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ResultsDashboard } from "@/components/olympiad/results-dashboard";
import { listActiveOlympiads } from "@/lib/olympiads";
import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { listOlympiadAttemptsWithDecisions, olympiadBackendConfigured } from "@/lib/server-olympiads";

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

  const organizer = await requireResultsOrganizer();
  if (!organizer.ok && organizer.reason === "signed_out") {
    redirect("/sign-in?redirect_url=/results");
  }

  if (organizer.errorResponse) {
    return (
      <section className="shell section auth-page">
        <div className="panel stack-md">
          <p className="eyebrow">Results</p>
          <h1>Organizer access only</h1>
          <p className="muted">
            {organizer.reason === "missing_email"
              ? "Your signed-in session does not include an email address. Please sign out and sign in again with dias280608@mail.ru."
              : "This results dashboard is available only for the organizer account."}
          </p>
          <Link className="button primary" href="/account">
            Open Account
          </Link>
        </div>
      </section>
    );
  }

  const olympiads = listActiveOlympiads().map((olympiad) => ({
    slug: olympiad.slug,
    title: olympiad.title,
    partner: olympiad.partner,
    status: olympiad.status,
    scenarioId: olympiad.scenarioId
  }));

  const backendReady = olympiadBackendConfigured();
  let data: Awaited<ReturnType<typeof listOlympiadAttemptsWithDecisions>> = { attempts: [], decisions: [] };
  let loadError: string | undefined;

  if (backendReady) {
    try {
      data = await listOlympiadAttemptsWithDecisions();
    } catch {
      loadError = "Results database is not ready yet. Apply the olympiad Supabase migration and check Supabase environment variables.";
    }
  }

  return (
    <ResultsDashboard
      initialData={{
        persisted: backendReady && !loadError,
        reason: loadError ? "database_error" : backendReady ? undefined : "missing_supabase_env",
        loadError,
        olympiads,
        attempts: data.attempts,
        decisions: data.decisions
      }}
    />
  );
}
