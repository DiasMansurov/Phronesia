import { LegalPage } from "@/components/site/legal-page";

export default function SubprocessorsPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="Subprocessor List"
      intro="This page identifies the categories of third-party services Phronesia may rely on to provide the product."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/schools/dpa", label: "School DPA" }
      ]}
      sections={[
        {
          title: "Current categories",
          body: [
            "Phronesia currently relies on infrastructure providers for hosting and deployment, authentication, and database persistence. The exact providers depend on the active deployment configuration.",
            "Any provider that handles student or school data is expected to operate under contractual confidentiality and data protection obligations."
          ]
        },
        {
          title: "Notifications and review",
          body: [
            "Schools can request the current named subprocessor list during procurement or contract review. Material changes should be reflected in this page and the associated school documentation package."
          ]
        }
      ]}
    />
  );
}
