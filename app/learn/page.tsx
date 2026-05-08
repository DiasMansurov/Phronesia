import type { Metadata } from "next";
import Link from "next/link";

import { SavedGlossary } from "@/components/game/saved-glossary";
import { BEGINNER_LESSONS, GLOSSARY_TERMS, LEARNING_LEVELS, TEXTBOOK_CASE_STUDIES } from "@/lib/game/learning";

export const metadata: Metadata = {
  title: "Learn Economics and Finance",
  description: "Short economics and finance explanations used inside Phronesia learning mode.",
  alternates: {
    canonical: "/learn"
  }
};

export default function LearnPage() {
  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Learn</p>
          <h1 className="display compact">Economics explained through consequences.</h1>
          <p className="lede compact-lede">
            The game teaches during play: each policy move changes the economy, then a short theory card explains why.
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start Learning Mode
            </Link>
            <Link className="button secondary" href="/finance-lab">
              Open Finance Lab
            </Link>
          </div>
        </div>
        <div className="panel compact-panel stack-sm">
          <p className="eyebrow">How Learning Mode Works</p>
          <div className="goal-list compact-list">
            <div className="goal-item">Make a policy decision.</div>
            <div className="goal-item">Watch indicators change.</div>
            <div className="goal-item">Read the theory card.</div>
            <div className="goal-item">Apply the concept next round.</div>
          </div>
        </div>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Learning Path</p>
            <h2>Start with four indicators, then grow into finance and crisis strategy.</h2>
          </div>
        </div>
        <div className="level-path-grid expanded">
          {LEARNING_LEVELS.map((level) => (
            <article key={level.id} className="level-path-card active">
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <small>{level.summary}</small>
            </article>
          ))}
        </div>
      </section>

      <SavedGlossary />

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Textbook-Inspired Foundations</p>
            <h2>Simple explanations before the expert language appears.</h2>
            <p className="muted">
              These lessons paraphrase core ideas from the economics and CFA materials: no textbook text is copied, only the concepts are rewritten for beginners.
            </p>
          </div>
        </div>
        <div className="lesson-grid">
          {BEGINNER_LESSONS.map((lesson) => (
            <article key={lesson.title} className="lesson-card stack-sm">
              <span className="mini-status open">{lesson.source}</span>
              <h3>{lesson.title}</h3>
              <p className="muted">{lesson.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Case Studies</p>
            <h2>Small stories that connect policy, theory, and real-life finance.</h2>
          </div>
        </div>
        <div className="case-study-grid">
          {TEXTBOOK_CASE_STUDIES.map((study) => (
            <article key={study.title} className="case-study-card stack-sm">
              <div className="card-topline">
                <span className="pill">{study.level}</span>
                <span className="mini-status open">{study.concept}</span>
              </div>
              <h3>{study.title}</h3>
              <p>{study.setup}</p>
              <p className="muted">{study.lesson}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Glossary</p>
            <h2>Short definitions for the terms players meet in-game.</h2>
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
    </section>
  );
}
