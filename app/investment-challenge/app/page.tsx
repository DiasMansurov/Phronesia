import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InvestmentChallengeDashboard } from "@/components/investment/investment-challenge-dashboard";
import { getInvestmentAccess } from "@/lib/investment-access";

export const metadata: Metadata = {
  title: "Investment Challenge Student Area",
  description: "Protected Phronesia student competition area for the educational virtual portfolio simulation.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function InvestmentChallengeAppPage() {
  const access = await getInvestmentAccess();

  if (!access.allowed) {
    if (access.reason !== "missing_secret") {
      redirect("/investment-challenge/join");
    }
    return (
      <section className="investment-section shell section stack-xl">
        <div className="investment-dashboard-hero">
          <div className="investment-hero-copy stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1 className="display compact">
              {access.reason === "missing_secret" ? "Team session secret is not configured." : "Enter your team access before opening the simulation."}
            </h1>
            <p className="lede compact-lede">
              {access.reason === "missing_secret"
                ? "Add TEAM_SESSION_SECRET or INVESTMENT_TEAM_SESSION_SECRET in the deployment environment before students can enter protected team portfolios."
                : "Market prices, your team portfolio, trade tickets, and your own activity are available only after a valid competition code, team name, and team password."}
            </p>
            <div className="cta-row">
              <Link className="button primary" href="/investment-challenge/join">
                Join Competition
              </Link>
              <Link className="button secondary" href="/investment-challenge">
                Overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#0a0f1a" }}>
      <InvestmentChallengeDashboard
        initialCompetitionCode={access.competitionCode}
        initialAccountId={access.accountId}
        initialAccount={access.account}
      />
    </div>
  );
}
