import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About and Learning Impact",
  description: "Phronesia is a finance and economics simulation platform for students, schools, competitions, and self-study.",
  alternates: {
    canonical: "/about"
  }
};

const impactPoints = [
  "Learning through consequences instead of passive reading.",
  "Short theory cards after decisions, not long textbook chapters before play.",
  "Financial literacy as the core layer: savings, loans, markets, debt, banks, and risk.",
  "Economics as context for understanding how policy choices affect ordinary people and markets.",
  "Teacher mode, classroom joins, rankings, and reflection tasks for schools.",
  "Policy Score reports that show what happened and what to improve next."
];

export default function AboutPage() {
  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">About / Impact</p>
          <h1 className="display compact">Finance & economics education through simulation.</h1>
          <p className="lede compact-lede">
            Phronesia is designed for students, schools, competitions, independent learners, and innovation contests:
            make financial decisions, see market consequences, learn the theory, and explain the result.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start The Platform
            </Link>
            <Link className="button secondary" href="/finance-lab">
              Finance Lab
            </Link>
          </div>
        </div>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Mission</p>
            <h2>Players should finish knowing why their decisions worked or failed.</h2>
          </div>
        </div>
        <div className="goal-list compact-list">
          {impactPoints.map((point) => (
            <div key={point} className="goal-item">{point}</div>
          ))}
        </div>
      </section>
    </section>
  );
}
