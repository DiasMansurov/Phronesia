import type { Metadata } from "next";
import Link from "next/link";

import { OptionsSimulator } from "@/components/investment/options-simulator";

export const metadata: Metadata = {
  title: "Phronesia Investment Challenge — Educational Options Simulator",
  description:
    "Learn call and put options with simplified educational estimates. Real options market data is not used, and no real money is involved.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge/options"
  },
  openGraph: {
    title: "Phronesia Educational Options Simulator",
    description:
      "A safe options education module for students: simplified estimates only, no margin, no real money, and no financial advice.",
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
