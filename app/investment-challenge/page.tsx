import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

import { InvestmentChallengeDashboard } from "@/components/investment/investment-challenge-dashboard";

export const metadata: Metadata = {
  title: "Phronesia Investment Challenge — Educational Virtual Portfolio Simulation",
  description:
    "Build a virtual portfolio, learn stocks, ETFs, diversification, risk, and financial decision-making through an educational simulation. No real money is used.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge"
  },
  openGraph: {
    title: "Phronesia Investment Challenge — Educational Virtual Portfolio Simulation",
    description:
      "Build a virtual portfolio, learn stocks, ETFs, diversification, risk, and financial decision-making through an educational simulation. No real money is used.",
    url: "https://phronesia.org/investment-challenge",
    siteName: "Phronesia",
    type: "website"
  }
};

export default function InvestmentChallengePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    name: "Phronesia Investment Challenge",
    url: "https://phronesia.org/investment-challenge",
    applicationCategory: "EducationalApplication",
    description:
      "Students manage a free virtual portfolio simulation to learn investing, diversification, risk, and finance. No real money is used.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  return (
    <>
      <Script
        id="investment-challenge-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="shell section stack-xl">
        <InvestmentChallengeDashboard />
        <section className="panel investment-disclaimer stack-sm">
          <p className="eyebrow">Important disclaimer</p>
          <h2>Educational simulation only.</h2>
          <p>
            Phronesia is free. This is an educational simulation only: no real money is used, this is not financial
            advice, no brokerage execution happens, and market data is not resold as a standalone product. Simulated
            orders use virtual cash, server validation, and cached stock prices for learning purposes.
          </p>
          <div className="cta-row">
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Full Rules
            </Link>
            <Link className="button secondary" href="/investment-challenge/leaderboard">
              Public Leaderboard
            </Link>
            <Link className="button secondary" href="/investment-challenge/options">
              Options Simulator
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}
