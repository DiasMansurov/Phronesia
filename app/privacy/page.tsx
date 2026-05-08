import { LegalPage } from "@/components/site/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what Phronesia collects, why we collect it, how school accounts are handled, and what rights users and schools can exercise."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/terms", label: "Terms of Use" },
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/schools/privacy", label: "School & Student Privacy Notice" }
      ]}
      sections={[
        {
          title: "What we collect",
          body: [
            "We collect account details such as name, email address, role, class membership, school name, country or region, age band, gameplay progress, and legal acceptance records. Teachers may also create classroom metadata such as class names, groups, and join codes.",
            "We do not use classroom data for advertising, behavioral profiling, or unrelated commercial resale."
          ]
        },
        {
          title: "Why we process data",
          body: [
            "We process data to provide classroom access, authenticate accounts, save progress, generate join links, enforce age-appropriate onboarding, maintain security, and respond to school or user support requests.",
            "For UK and EU users, our lawful bases typically include contract, legitimate interests for core security and service operation, and consent where required for non-essential cookies or analytics."
          ]
        },
        {
          title: "School context and children",
          body: [
            "When a student joins through a teacher-issued classroom flow, Phronesia treats that account as school-managed and limits the account to educational purposes. Under-13 access must be school-authorized in this version.",
            "If a jurisdiction requires direct parental consent for a given age band and that pathway is not yet implemented, the student flow is blocked rather than silently enabled."
          ]
        },
        {
          title: "Sharing, transfers, retention, and rights",
          body: [
            "We share data only with infrastructure and service providers needed to operate the platform, such as hosting, authentication, and database processors, and only under appropriate contracts. Cross-border transfers are handled through contractual transfer mechanisms where required.",
            "We retain account and classroom records only as long as reasonably needed for service delivery, legal compliance, dispute resolution, and school support. Users and schools can request access, correction, deletion, or export through the contact details in this notice."
          ]
        }
      ]}
    />
  );
}
