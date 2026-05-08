import { LegalPage } from "@/components/site/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="This page explains which cookies or similar technologies Phronesia uses, which are essential, and when consent is required."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" }
      ]}
      sections={[
        {
          title: "Essential technologies",
          body: [
            "Phronesia uses essential technologies for authentication, session continuity, security, fraud prevention, and basic product functionality. These are required for the service to work.",
            "Where Clerk authentication is enabled, authentication cookies are used to maintain signed-in sessions securely."
          ]
        },
        {
          title: "Analytics and consent",
          body: [
            "Phronesia does not enable non-essential analytics by default in UK or EU contexts. Visitors in those regions are shown a consent banner before non-essential analytics are stored.",
            "Classroom accounts are never used for targeted advertising or behavioral profiling, regardless of consent status."
          ]
        },
        {
          title: "Managing choices",
          body: [
            "You can choose essential-only mode from the cookie banner where required. Browser controls may also allow you to clear local storage and cookies after use.",
            "For school accounts, teachers and schools should review this policy alongside the School & Student Privacy Notice and DPA materials."
          ]
        }
      ]}
    />
  );
}
