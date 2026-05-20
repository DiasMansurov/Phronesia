import type { Metadata } from "next";
import Link from "next/link";

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
    return (
      <section className="shell section stack-xl">
        <div className="hero-band compact">
          <div className="stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1 className="display compact">Enter a competition code before opening the simulation.</h1>
            <p className="lede compact-lede">
              Market prices, portfolios, trade tickets, and live rankings are available only after sign-in or a valid
              student competition code.
            </p>
            <div className="cta-row">
              <Link className="button primary" href="/investment-challenge#join-investment-challenge">
                Enter competition code
              </Link>
              <Link className="button secondary" href="/sign-in">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="shell section stack-xl">
      <InvestmentChallengeDashboard initialCompetitionCode={access.competitionCode ?? access.competition?.code ?? ""} />
      <section className="panel investment-disclaimer stack-sm">
        <p className="eyebrow">Important disclaimer</p>
        <h2>Educational simulation only.</h2>
        <p>
          Phronesia is a free educational simulation. No real money is used. This is not financial advice. Market data
          is used only inside the student competition area.
        </p>
      </section>
    </section>
  );
}
