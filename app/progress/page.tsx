import type { Metadata } from "next";

import { ProgressDashboard } from "@/components/game/progress-dashboard";

export const metadata: Metadata = {
  title: "Progress",
  description: "Track Phronesia finance learning progress, achievements, best scores, and recommended next scenarios.",
  alternates: {
    canonical: "/progress"
  }
};

export default function ProgressPage() {
  return <ProgressDashboard />;
}
