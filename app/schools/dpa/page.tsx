import { LegalPage } from "@/components/site/legal-page";

export default function SchoolDpaPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="School Data Processing Addendum"
      intro="This page summarizes the commitments Phronesia is prepared to include in a school-facing data processing agreement."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/schools/privacy", label: "School & Student Privacy Notice" },
        { href: "/privacy", label: "Privacy Policy" }
      ]}
      sections={[
        {
          title: "Processing instructions and scope",
          body: [
            "Phronesia processes school data only on documented school instructions to provide classroom gameplay, student grouping, progress storage, account security, and support. Data is not sold and is not used for advertising.",
            "The school remains responsible for its own legal basis and authority to disclose student information to Phronesia for educational use."
          ]
        },
        {
          title: "Security, subprocessors, and transfers",
          body: [
            "We apply reasonable technical and organizational measures to protect data in transit and at rest, restrict administrative access, and maintain provider contracts for essential infrastructure. Schools can request current subprocessor details as part of procurement review.",
            "Where UK or EU transfers are involved, the DPA package is intended to include the appropriate contractual transfer commitments and supplementary measures."
          ]
        },
        {
          title: "Retention and deletion",
          body: [
            "School records are retained only as long as necessary for the service, legal compliance, dispute handling, and legitimate operational needs. On verified request, we will support deletion or export of covered classroom records subject to legal obligations.",
            "Operational logs and legal acceptance records may be retained separately where needed to demonstrate security, compliance, or contractual performance."
          ]
        }
      ]}
    />
  );
}
