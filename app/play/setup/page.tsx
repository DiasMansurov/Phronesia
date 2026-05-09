import type { Metadata } from "next";

import { SetupExperience } from "@/components/game/setup-experience";

export const metadata: Metadata = {
  title: "Start a Finance Simulation",
  description: "Choose your level, get recommended finance scenarios, and start a Phronesia simulation with markets, money, debt, and policy decisions.",
  alternates: {
    canonical: "/play/setup"
  }
};

export default function PlaySetupPage() {
  return <SetupExperience />;
}
