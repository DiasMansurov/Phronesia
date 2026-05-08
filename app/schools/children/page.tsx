import { LegalPage } from "@/components/site/legal-page";

export default function ChildrenPrivacyPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="Children's Privacy / Parent-School Consent Notice"
      intro="This notice explains how Phronesia handles younger students, school authorization, and when direct parental consent may be required."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/schools/privacy", label: "School & Student Privacy Notice" },
        { href: "/privacy", label: "Privacy Policy" }
      ]}
      sections={[
        {
          title: "Under-13 access",
          body: [
            "Students under 13 may only access Phronesia through a school-authorized classroom flow in this version. They cannot self-initiate a general-purpose consumer account for classroom participation.",
            "This conservative model is intended to align with school-managed educational use and to avoid opening direct child accounts where a separate parental flow has not yet been implemented."
          ]
        },
        {
          title: "Teenagers below the local digital consent age",
          body: [
            "For jurisdictions where users above 13 still require parent or guardian authorization for certain online services, Phronesia routes the join flow conservatively. Where school authorization is not sufficient for the intended use, the flow is blocked until a valid parental path exists.",
            "Teachers and schools should not instruct students to bypass these controls."
          ]
        },
        {
          title: "Educational purpose only",
          body: [
            "Student data collected under this notice is used only to provide classroom access, save game progress, assign groups, maintain platform security, and document legal acceptance in the school context.",
            "It is not used for targeted ads, behavioral profiling, or unrelated commercial reuse."
          ]
        }
      ]}
    />
  );
}
