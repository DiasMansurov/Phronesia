import type { Metadata } from "next";

import { OlympiadPortal } from "@/components/olympiad/olympiad-portal";

export const metadata: Metadata = {
  title: "Olympiad Portal",
  description: "Enter a Phronesia olympiad login, join as a team, and open the official competition case.",
  alternates: {
    canonical: "/olympiad"
  }
};

export default function OlympiadPage() {
  return <OlympiadPortal />;
}
