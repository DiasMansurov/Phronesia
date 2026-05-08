import type { Metadata } from "next";

import { SetupExperience } from "@/components/game/setup-experience";

export const metadata: Metadata = {
  title: "Play the Economics Simulation",
  description: "Choose a scenario and start playing Phronesia, a browser-based macroeconomics simulation game for revision, lessons, and debate.",
  alternates: {
    canonical: "/play/setup"
  }
};

export default function PlaySetupPage() {
  return <SetupExperience />;
}
