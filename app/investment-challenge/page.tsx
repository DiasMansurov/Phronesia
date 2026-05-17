import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

import { InvestmentChallengeDashboard } from "@/components/investment/investment-challenge-dashboard";

export const metadata: Metadata = {
  title: "Phronesia Investment Challenge — Virtual Stock Market Competition",
  description:
    "Join a virtual investment competition, build a $100,000 portfolio, trade simulated stocks and ETFs, and learn finance through real market data.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge"
  },
  openGraph: {
    title: "Phronesia Investment Challenge — Virtual Stock Market Competition",
    description:
      "Manage a $100,000 virtual portfolio using daily market data and learn stocks, ETFs, options, diversification, risk, and financial decision-making.",
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
      "Students manage a $100,000 virtual portfolio using real market data to learn investing, diversification, risk, and finance.",
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
            This is an educational simulation. No real money is used. This is not financial advice. Trading uses
            virtual cash, server-validated orders, and daily closing prices for learning purposes.
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
