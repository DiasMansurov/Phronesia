import type { Metadata } from "next";

import { OlympiadPortal } from "@/components/olympiad/olympiad-portal";

export const metadata: Metadata = {
  title: "Teenvestor Investment Olympiad",
  description:
    "Official Teenvestor Investment Olympiad landing page and Phronesia team access portal for registered competition teams.",
  alternates: {
    canonical: "/olympiad"
  }
};

export default function OlympiadPage() {
  return <OlympiadPortal />;
}
