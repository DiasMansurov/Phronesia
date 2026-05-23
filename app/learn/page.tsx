import type { Metadata } from "next";
import Link from "next/link";

import { SavedGlossary } from "@/components/game/saved-glossary";
import { BEGINNER_LESSONS, GLOSSARY_TERMS, LEARNING_LEVELS, TEXTBOOK_CASE_STUDIES } from "@/lib/game/learning";
import type { LearningLevelId } from "@/lib/game/types";

export const metadata: Metadata = {
  title: "Learn Finance and Economics",
  description: "Short finance-first explanations used inside Phronesia learning mode.",
  alternates: {
    canonical: "/learn"
  }
};

const learningLevelOrder: LearningLevelId[] = ["tutorial", "basic", "finance", "policy", "crisis", "competitive"];
type LearningLevel = (typeof LEARNING_LEVELS)[number];

export default function LearnPage() {
  const orderedLevels = learningLevelOrder
    .map((id) => LEARNING_LEVELS.find((level) => level.id === id))
    .filter((level): level is LearningLevel => Boolean(level));
  const caseLibrary = LEARNING_LEVELS.find((level) => level.id === "historical");

  return (
    <section className="learn-page">
      <section className="learn-hero-band">
        <div className="shell hero-band compact learn-hero">
          <div className="learn-hero-copy stack-sm">
            <p className="eyebrow">Learn</p>
            <h1 className="display compact">Finance explained through consequences.</h1>
            <p className="lede compact-lede">
              Phronesia teaches during play: each financial or policy decision changes households, markets, and the economy,
              then a short theory card explains why.
            </p>
            <div className="cta-row">
              <Link className="button primary" href="/play/setup" prefetch={false}>
                Start Learning Mode
              </Link>
              <Link className="button secondary" href="/finance-lab">
                Open Finance Lab
              </Link>
              <Link className="button secondary" href="/investment-challenge">
                Try Investment Challenge
              </Link>
            </div>
          </div>
          <div className="panel compact-panel stack-sm learn-mode-panel">
            <p className="eyebrow">How Learning Mode Works</p>
            <div className="goal-list compact-list learn-mode-list">
              <div className="goal-item">Make a policy decision.</div>
              <div className="goal-item">Watch indicators change.</div>
              <div className="goal-item">Read the theory card.</div>
              <div className="goal-item">Apply the concept next round.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="learn-section-band learn-path-band">
        <div className="shell">
          <section className="panel stack-md learn-path-panel">
            <div className="section-header learn-section-heading">
              <div>
                <p className="eyebrow">Learning Path</p>
                <h2>Start with financial basics, then grow into markets, policy, and crisis strategy.</h2>
              </div>
            </div>
            <div className="level-path-grid expanded learn-roadmap">
              {orderedLevels.map((level, index) => (
                <article key={level.id} className="level-path-card active">
                  <div className="level-step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span>{level.label}</span>
                  <strong>{level.title}</strong>
                  <small>{level.summary}</small>
                </article>
              ))}
            </div>
            {caseLibrary ? (
              <article className="case-library-card">
                <div>
                  <p className="eyebrow">Case Library</p>
                  <h3>{caseLibrary.title}</h3>
                </div>
                <p>{caseLibrary.summary}</p>
              </article>
            ) : null}
          </section>
        </div>
      </section>

      <section className="learn-section-band learn-support-band">
        <div className="shell learn-support-grid">
          <div className="learn-saved-slot">
            <SavedGlossary />
          </div>

          <section className="panel stack-md investment-learn-panel learn-investment-panel">
            <div className="section-header learn-section-heading">
              <div>
                <p className="eyebrow">Applied investing</p>
                <h2>Practice the concepts with a virtual portfolio.</h2>
                <p className="muted">
                  The Investment Challenge connects glossary terms like stocks, ETFs, bonds, diversification, market hours,
                  cached stock prices, interest rates, and risk vs return to a $100,000 educational simulation.
                </p>
              </div>
              <Link className="button primary" href="/investment-challenge">
                Open Challenge
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="learn-section-band">
        <div className="shell">
          <section className="panel stack-md learn-foundations-panel">
            <div className="section-header learn-section-heading">
              <div>
                <p className="eyebrow">Textbook-Inspired Foundations</p>
                <h2>Simple explanations before the expert language appears.</h2>
                <p className="muted">
                  These lessons paraphrase core ideas from the economics and CFA materials: no textbook text is copied, only the concepts are rewritten for beginners.
                </p>
              </div>
            </div>
            <div className="foundation-accordion-list">
              {BEGINNER_LESSONS.map((lesson, index) => (
                <details key={lesson.title} className="foundation-row" open={index === 0}>
                  <summary>
                    <span>{lesson.title}</span>
                    <small>{lesson.source}</small>
                  </summary>
                  <p>{lesson.body}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="learn-section-band learn-case-band">
        <div className="shell">
          <section className="panel stack-md learn-case-panel">
            <div className="section-header learn-section-heading">
              <div>
                <p className="eyebrow">Case Studies</p>
                <h2>Small stories that connect policy, theory, and real-life finance.</h2>
              </div>
            </div>
            <div className="case-study-grid">
              {TEXTBOOK_CASE_STUDIES.map((study) => (
                <article key={study.title} className="case-study-card stack-sm">
                  <div className="case-study-main">
                    <div className="card-topline">
                      <span className="pill">{study.level}</span>
                      <span className="mini-status open">{study.concept}</span>
                    </div>
                    <h3>{study.title}</h3>
                    <p>{study.setup}</p>
                  </div>
                  <div className="case-study-consequence">
                    <span>Consequence</span>
                    <p>{study.lesson}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="learn-section-band">
        <div className="shell">
          <section className="panel stack-md learn-glossary-panel">
            <div className="section-header learn-section-heading">
              <div>
                <p className="eyebrow">Glossary</p>
                <h2>Short definitions for the terms players meet in-game.</h2>
                <p className="muted">Key terms you meet in simulations.</p>
              </div>
            </div>
            <div className="glossary-grid">
              {GLOSSARY_TERMS.map((item) => (
                <article key={item.term} className="glossary-card">
                  <h3>{item.term}</h3>
                  <p className="muted">{item.definition}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
