import { LegalPage } from "@/components/site/legal-page";

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Schools"
      title="Security Overview"
      intro="This page summarizes the security posture Phronesia presents to schools and procurement teams."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/schools/dpa", label: "School DPA" }
      ]}
      sections={[
        {
          title: "Core controls",
          body: [
            "Phronesia uses managed authentication, server-side API access for protected data operations, and role-based classroom workflows designed to keep student joining under teacher control.",
            "Classroom data access is limited to the service backend rather than exposed directly from the browser to the database."
          ]
        },
        {
          title: "Operational expectations",
          body: [
            "Production deployments should enforce TLS, least-privilege administration, secure secret storage, and routine review of infrastructure providers, logs, and incident handling procedures.",
            "Schools may request additional documentation, including contract terms and incident response expectations, during procurement."
          ]
        }
      ]}
    />
  );
}
