import { LegalPage } from "@/components/site/legal-page";

export default function SchoolPrivacyPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="School and Student Privacy Notice"
      intro="This notice is written for teachers, school leaders, and districts evaluating Phronesia for classroom use."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/schools/dpa", label: "School DPA" },
        { href: "/schools/children", label: "Children's Privacy Notice" }
      ]}
      sections={[
        {
          title: "Data used for classroom operation",
          body: [
            "For classroom accounts, Phronesia uses student and teacher names, email addresses, role, class membership, age band, country or region, gameplay progress, join token records, and legal notice acceptance records.",
            "Optional teacher-supplied information such as school name or group labels is used only to organize class access and reporting."
          ]
        },
        {
          title: "How school-managed accounts work",
          body: [
            "In v1, students can only join through a teacher-issued code or QR link. This makes classroom enrollment school-managed by default and reduces the risk of unsupervised student account creation.",
            "Phronesia acts as a service provider or processor for classroom operations and does not use student classroom data for advertising, profiling, or unrelated product monetization."
          ]
        },
        {
          title: "Deletion, export, and support",
          body: [
            "Schools and teachers can request deletion or export of classroom records, subject to verification and legal retention obligations. Requests should identify the class, school, and authorized requester so we can act safely.",
            "We also maintain administrative records such as audit trails and legal acceptance records to demonstrate compliance, security, and school authorization."
          ]
        }
      ]}
    />
  );
}
