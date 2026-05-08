import type { Metadata } from "next";
import Link from "next/link";

import { SCENARIOS } from "@/lib/game/content";
import { getLearningLevel, LEARNING_LEVELS, scenarioLearningLevel } from "@/lib/game/learning";

export const metadata: Metadata = {
  title: "Economics and Finance Scenarios",
  description: "Browse Phronesia scenarios by learning level, from tutorial cases to finance, crisis, and historical scenarios.",
  alternates: {
    canonical: "/scenarios"
  }
};

export default function ScenariosPage() {
  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Scenarios</p>
          <h1 className="display compact">A curriculum path, not just a list of crises.</h1>
          <p className="lede compact-lede">
            Scenarios are grouped by what they teach: basics first, then policy tools, finance, crises, historical cases, and competition.
          </p>
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Choose A Level
          </Link>
        </div>
      </div>

      {LEARNING_LEVELS.map((level) => {
        const scenarios = SCENARIOS.filter((scenario) => scenarioLearningLevel(scenario) === level.id);
        if (!scenarios.length) return null;
        const fullLevel = getLearningLevel(level.id);

        return (
          <section key={level.id} className="panel stack-md">
            <div className="section-header">
              <div>
                <p className="eyebrow">{fullLevel.label}</p>
                <h2>{fullLevel.title}</h2>
                <p className="muted">{fullLevel.summary}</p>
              </div>
              <div className="pill-row">
                {fullLevel.concepts.slice(0, 3).map((concept) => (
                  <span key={concept} className="pill">{concept}</span>
                ))}
              </div>
            </div>
            <div className="scenario-grid">
              {scenarios.map((scenario) => (
                <article key={scenario.id} className="scenario-card scenario-card-rich">
                  <div className="card-topline">
                    <span className="pill">{scenario.country}</span>
                    <span className="mini-status open">{scenario.startingYear}</span>
                  </div>
                  <h3>{scenario.title}</h3>
                  <p className="muted">{scenario.subtitle}</p>
                  <p>{scenario.summary}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
