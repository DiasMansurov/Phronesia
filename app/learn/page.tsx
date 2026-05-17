import type { Metadata } from "next";
import Link from "next/link";

import { SavedGlossary } from "@/components/game/saved-glossary";
import { BEGINNER_LESSONS, GLOSSARY_TERMS, LEARNING_LEVELS, TEXTBOOK_CASE_STUDIES } from "@/lib/game/learning";

export const metadata: Metadata = {
  title: "Learn Finance and Economics",
  description: "Short finance-first explanations used inside Phronesia learning mode.",
  alternates: {
    canonical: "/learn"
  }
};

export default function LearnPage() {
  return (
    <section className="shell section stack-lg learn-page">
      <div className="learn-intro-flow">
        <div className="hero-band compact learn-hero">
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

        <section className="panel stack-md learn-path-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Learning Path</p>
              <h2>Start with financial basics, then grow into markets, policy, and crisis strategy.</h2>
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
      </div>

      <div className="learn-support-grid">
        <div className="learn-saved-slot">
          <SavedGlossary />
        </div>

        <section className="panel stack-md investment-learn-panel learn-investment-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Applied investing</p>
              <h2>Practice the concepts with a virtual portfolio.</h2>
              <p className="muted">
                The Investment Challenge connects glossary terms like stocks, ETFs, bonds, diversification, market hours,
                closing price, interest rates, and risk vs return to a $100,000 educational simulation.
              </p>
            </div>
            <Link className="button primary" href="/investment-challenge">
              Open Challenge
            </Link>
          </div>
        </section>
      </div>

      <section className="panel stack-md learn-foundations-panel">
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

      <section className="panel stack-md learn-case-panel">
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

      <section className="panel stack-md learn-glossary-panel">
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
