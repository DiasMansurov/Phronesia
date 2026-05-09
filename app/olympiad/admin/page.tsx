import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Organizer Results",
  description: "Redirect to the organizer results dashboard for Phronesia olympiad team scores, rankings, and policy decisions.",
  alternates: {
    canonical: "/results"
  }
};

export default function OlympiadAdminPage() {
  redirect("/results");
}
