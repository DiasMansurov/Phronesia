import type { Metadata } from "next";

import { ScenarioLibrary } from "@/components/game/scenario-library";

export const metadata: Metadata = {
  title: "Finance Scenarios",
  description: "Browse Phronesia finance simulations by level, difficulty, time, and topic.",
  alternates: {
    canonical: "/scenarios"
  }
};

export default function ScenariosPage() {
  return (
    <section className="shell section">
      <ScenarioLibrary />
    </section>
  );
}
