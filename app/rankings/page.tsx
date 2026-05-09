import type { Metadata } from "next";

import { RankingsBoard } from "@/components/game/rankings-board";

export const metadata: Metadata = {
  title: "Finance Simulation Rankings",
  description: "See Phronesia finance simulation rankings, scenario ladders, school leaderboards, and policy score comparisons.",
  alternates: {
    canonical: "/rankings"
  }
};

export default function RankingsPage() {
  return <RankingsBoard />;
}
