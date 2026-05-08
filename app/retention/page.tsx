import { LegalPage } from "@/components/site/legal-page";

export default function RetentionPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="Retention and Deletion Summary"
      intro="This page gives schools a high-level explanation of how long Phronesia keeps classroom records and how deletion requests are handled."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/schools/dpa", label: "School DPA" }
      ]}
      sections={[
        {
          title: "Retention principles",
          body: [
            "Phronesia keeps personal and classroom data only for as long as reasonably necessary to provide the service, protect security, document legal acceptance, resolve disputes, and meet legal obligations.",
            "Different categories of data may have different retention periods depending on operational necessity and legal risk."
          ]
        },
        {
          title: "Deletion requests",
          body: [
            "Verified schools, teachers, and users can request deletion or export of relevant classroom records. Requests may require identity and authority checks before execution.",
            "Certain audit, legal acceptance, or security records may be retained separately when needed to demonstrate compliance or defend legal claims."
          ]
        }
      ]}
    />
  );
}
