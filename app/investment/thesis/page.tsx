import type { Metadata } from "next";

import { InvestmentThesisExperience } from "@/components/investment/investment-thesis-experience";

export const metadata: Metadata = {
  title: "Investment Thesis",
  description: "Explain the reasoning behind an Investment Challenge portfolio decision.",
  alternates: {
    canonical: "https://phronesia.org/investment/thesis"
  }
};

export default function InvestmentThesisPage() {
  return (
    <section className="shell section">
      <InvestmentThesisExperience />
    </section>
  );
}
