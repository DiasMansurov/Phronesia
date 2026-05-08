import { LegalPage } from "@/components/site/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      intro="These terms govern access to Phronesia for teachers, students, and school-managed classroom accounts."
      updatedAt="April 9, 2026"
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/schools/dpa", label: "School DPA" }
      ]}
      sections={[
        {
          title: "Accounts and eligibility",
          body: [
            "Teachers are responsible for the classroom spaces they create, the students they invite, and the lawful use of the service within their school setting. Students may join classroom accounts only through teacher-issued codes or QR links in this version.",
            "Users must provide accurate information, keep credentials secure, and use the platform only for educational, lawful, and non-disruptive purposes."
          ]
        },
        {
          title: "Acceptable use",
          body: [
            "You may not misuse the service, attempt unauthorized access, interfere with platform availability, scrape protected content, upload unlawful material, or use classroom data for unrelated marketing or surveillance purposes.",
            "Teachers may not instruct students to bypass age-gating, misstate school authorization, or use the service outside approved classroom contexts where additional consent is required."
          ]
        },
        {
          title: "Content and intellectual property",
          body: [
            "Phronesia owns the platform, simulations, brand assets, and supporting materials except where third-party rights apply. Teachers and students retain rights in original classroom submissions they create, while granting us the limited rights needed to host and display those submissions inside the service.",
            "You may not copy, resell, sublicense, or redistribute the product except as permitted by law or a separate school agreement."
          ]
        },
        {
          title: "Service changes and liability",
          body: [
            "We may update, suspend, or remove features to improve safety, compliance, or platform reliability. We may suspend or terminate accounts that violate these terms or create legal or security risk.",
            "Except where law does not allow it, the service is provided on an as-available basis and our liability is limited to the maximum extent permitted under applicable law."
          ]
        }
      ]}
    />
  );
}
