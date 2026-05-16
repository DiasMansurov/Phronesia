import type { Metadata } from "next";
import Link from "next/link";

import { OptionsSimulator } from "@/components/investment/options-simulator";

export const metadata: Metadata = {
  title: "Phronesia Investment Challenge — Educational Options Simulator",
  description:
    "Learn call and put options with a safe buy-only virtual simulator. Explore premiums, breakeven, max loss, payoff charts, and options risk without real money.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge/options"
  },
  openGraph: {
    title: "Phronesia Educational Options Simulator",
    description:
      "A safe options education module for students: buy-only, no margin, no real money, and no financial advice.",
    url: "https://phronesia.org/investment-challenge/options",
    siteName: "Phronesia",
    type: "website"
  }
};

export default function InvestmentOptionsPage() {
  return (
    <section className="shell section stack-xl">
      <div className="cta-row">
        <Link className="button secondary" href="/investment-challenge">
          Back to Challenge
        </Link>
        <Link className="button secondary" href="/investment-challenge/rules">
          Read Rules
        </Link>
      </div>
      <OptionsSimulator />
    </section>
  );
}
