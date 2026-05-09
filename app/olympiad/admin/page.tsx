import type { Metadata } from "next";

import { OlympiadAdmin } from "@/components/olympiad/olympiad-admin";

export const metadata: Metadata = {
  title: "Olympiad Admin",
  description: "Admin dashboard for Phronesia olympiad team scores, rankings, and policy decisions.",
  alternates: {
    canonical: "/olympiad/admin"
  }
};

export default function OlympiadAdminPage() {
  return <OlympiadAdmin />;
}
