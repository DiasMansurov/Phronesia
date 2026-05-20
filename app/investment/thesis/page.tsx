import type { Metadata } from "next";
import Link from "next/link";

import { InvestmentThesisExperience } from "@/components/investment/investment-thesis-experience";
import { getInvestmentAccess } from "@/lib/investment-access";

export const metadata: Metadata = {
  title: "Investment Thesis",
  description: "Explain the reasoning behind an Investment Challenge portfolio decision.",
  alternates: {
    canonical: "https://phronesia.org/investment/thesis"
  },
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function InvestmentThesisPage() {
  const access = await getInvestmentAccess();
  if (!access.allowed) {
    return (
      <section className="shell section">
        <div className="hero-band compact">
          <div className="stack-sm">
            <p className="eyebrow">Protected student area</p>
            <h1 className="display compact">Investment thesis is available after competition access.</h1>
            <p className="lede compact-lede">
              Thesis forms connect to private student portfolios, so they are shown only after a valid competition code,
              team name, and team password.
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
    <section className="shell section">
      <InvestmentThesisExperience />
    </section>
  );
}
