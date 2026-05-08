import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { InterestForm } from "@/components/site/interest-form";

const benefits = [
  "Historical crisis scenarios that fit macro topics you already teach",
  "Flexible use for revision lessons, homework, and in-class competitions",
  "Teacher-managed classes and groups with student sign-up by code or QR",
  "School-facing privacy, terms, cookie, and DPA pages for rollout conversations"
];

export const metadata: Metadata = {
  title: "Teacher Economics Classroom Simulation",
  description: "Use Phronesia as an economics classroom simulation with teacher-managed classes, student join codes, QR sign-up, and school-ready privacy documentation.",
  alternates: {
    canonical: "/teachers"
  }
};

export default function TeachersPage() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can teachers use Phronesia in class?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Teachers can use Phronesia for lesson starters, homework, revision activities, debates, and classroom competitions built around macroeconomic policy trade-offs."
        }
      },
      {
        "@type": "Question",
        name: "Can students join by class code or QR code?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Teachers can create classes and groups, then let students join through a teacher-issued code or QR link."
        }
      },
      {
        "@type": "Question",
        name: "Does the site include school privacy documentation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The site includes privacy, terms, cookie, school privacy, children's privacy, DPA, retention, security, and accessibility pages for school review."
        }
      }
    ]
  };

  return (
    <section className="shell section stack-xl">
      <Script
        id="teacher-faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <section className="teacher-hero">
        <div className="teacher-hero-copy stack-md">
          <p className="eyebrow">For Teachers</p>
          <h1 className="display compact">Bring macroeconomics to life with classroom-ready sign-up, grouping, and school-facing privacy defaults.</h1>
          <p className="lede">
            Phronesia can now be rolled out as a teacher-managed classroom simulation: create classes, place
            students into groups by code or QR, and onboard them through age-gated, school-facing legal notices.
          </p>
          <div className="pill-row">
            <span className="pill">Lesson-ready cases</span>
            <span className="pill">Historical macro shocks</span>
            <span className="pill">Teacher-led groups</span>
            <span className="pill">School-ready privacy</span>
          </div>
        </div>

        <aside className="panel teacher-brief stack-md">
          <p className="eyebrow">What You’ll Get</p>
          <div className="timeline">
            {benefits.map((benefit) => (
              <div key={benefit} className="timeline-item">
                {benefit}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid two teacher-content">
        <InterestForm
          type="teacher"
          title="Share classroom rollout feedback"
          subtitle="Leave your details if you want to share how you would use Phronesia in class, what your school would need for rollout, or what would make the classroom flow more useful."
          buttonLabel="Send Feedback"
        />
        <section className="panel stack-md teacher-support">
          <p className="eyebrow">Best Feedback</p>
          <h2>Tell us the teaching and compliance context, not just the topic.</h2>
          <div className="timeline">
            <div className="timeline-item">Which unit or concept you want students to practise</div>
            <div className="timeline-item">Whether you need a short starter, full lesson case, or homework challenge</div>
            <div className="timeline-item">What kind of trade-off or misconception you want the scenario to surface</div>
            <div className="timeline-item">What your school needs from privacy, deletion, accessibility, or DPA documentation</div>
          </div>
          <p className="muted small">
            The more specific the classroom and school rollout use case, the easier it is to shape the product around real teaching needs.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/teachers/classes">
              Open teacher dashboard
            </Link>
            <Link className="button secondary" href="/schools/privacy">
              Review school privacy notice
            </Link>
          </div>
        </section>
      </section>
    </section>
  );
}
