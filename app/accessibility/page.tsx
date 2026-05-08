import { LegalPage } from "@/components/site/legal-page";

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="Accessibility Statement"
      intro="This page summarizes Phronesia's accessibility intent and the current status of school-facing accessibility documentation."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/teachers", label: "Teacher page" }
      ]}
      sections={[
        {
          title: "Accessibility commitment",
          body: [
            "Phronesia aims to support accessible classroom use through semantic structure, readable contrast, keyboard navigation, and screen-reader-friendly content where practical for a simulation experience.",
            "Accessibility remains an active product responsibility, especially for school adoption."
          ]
        },
        {
          title: "Documentation",
          body: [
            "A formal VPAT or equivalent accessibility review process should accompany school procurement. This page can serve as the public-facing summary while the fuller documentation is maintained separately."
          ]
        }
      ]}
    />
  );
}
