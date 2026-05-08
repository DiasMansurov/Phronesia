import type { Metadata } from "next";

import { RankingsBoard } from "@/components/game/rankings-board";

export const metadata: Metadata = {
  title: "Economics Game Rankings",
  description: "See ranking ladders, benchmark runs, and classroom-friendly leaderboard results from Phronesia economics simulation.",
  alternates: {
    canonical: "/rankings"
  }
};

export default function RankingsPage() {
  return <RankingsBoard />;
}
