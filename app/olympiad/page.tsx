import type { Metadata } from "next";

import { OlympiadPortal } from "@/components/olympiad/olympiad-portal";

export const metadata: Metadata = {
  title: "Teenvestor Investment Competition",
  description:
    "An international investment competition for students in Grades 7–12, focused on virtual portfolio management, company analysis, strategic investing, and financial thinking.",
  alternates: {
    canonical: "/olympiad"
  }
};

export default function OlympiadPage() {
  return <OlympiadPortal />;
}
