"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ArticleSummary } from "@/lib/articles";
import { SCENARIOS } from "@/lib/game/content";
import {
  getNextScenario,
  getRecommendedScenarios,
  getScenarioLearningProfile,
  getUserLevel,
  USER_LEVELS,
  type UserLevelId
} from "@/lib/game/curriculum";
import { loadRuns } from "@/lib/game/storage";

const productPaths = [
  {
    title: "Learn concepts",
    body: "Understand finance and economics ideas through short explanations and examples.",
    href: "/learn",
    action: "Open Learn"
  },
  {
    title: "Run scenarios",
    body: "Make decisions in realistic finance and economics situations and see the consequences.",
    href: "/scenarios",
    action: "Browse Scenarios"
  },
  {
    title: "Practice investing",
    body: "Build a free virtual portfolio and learn risk through an educational simulation with no real money.",
    href: "/investment-challenge",
    action: "Open Investment Challenge"
  }
];

const processSteps = [
  {
    step: "01",
    cue: "Topic",
    title: "Choose a topic",
    body: "Pick a concept, scenario, market, or investing challenge to explore."
  },
  {
    step: "02",
    cue: "Choice",
    title: "Make a decision",
    body: "Set a budget, trade, policy move, or personal finance choice inside the simulation."
  },
  {
    step: "03",
    cue: "Result",
    title: "See the consequence",
    body: "Review the outcome, score, and feedback so the tradeoff is clear."
  }
];

const platformLinks = [
  {
    title: "Learn",
    body: "Build finance and economics foundations with short lessons and saved concepts.",
    href: "/learn",
    action: "Open Learn"
  },
  {
    title: "Finance Lab",
    body: "Test market mechanics and finance ideas in focused interactive labs.",
    href: "/finance-lab",
    action: "Open Finance Lab"
  },
  {
    title: "Scenarios",
    body: "Browse simulations where choices create visible consequences.",
    href: "/scenarios",
    action: "Browse Scenarios"
  },
  {
    title: "Investment Challenge",
    body: "Practice portfolio decisions with virtual cash, cached stock prices, and risk feedback.",
    href: "/investment-challenge",
    action: "Start Investing"
  },
  {
    title: "Articles",
    body: "Read concise explainers behind the simulations and market decisions.",
    href: "/articles",
    action: "Read Articles"
  }
];

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
}

export function FinanceHome({ featuredArticles = [] }: { featuredArticles?: ArticleSummary[] }) {
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const storedLevel = readStoredLevel();
    setUserLevel(storedLevel);
    setCompletedIds(loadRuns().filter((run) => run.complete).map((run) => run.scenarioId));
  }, []);

  const beginnerRecommendations = useMemo(() => getRecommendedScenarios("beginner", SCENARIOS, 2), []);
  const nextScenario = useMemo(() => getNextScenario(userLevel, completedIds, SCENARIOS), [completedIds, userLevel]);
  const selectedLevel = getUserLevel(userLevel);
  const nextProfile = getScenarioLearningProfile(nextScenario);
  const featuredArticle = featuredArticles[0];

  return (
    <section className="shell section phronesia-home home-ia-page">
      <section className="market-hero compact-start-hero homepage-hero home-ia-hero">
        <div className="market-hero-copy homepage-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia</p>
            <h1 className="display market-display">Learn finance by making decisions.</h1>
            <p className="lede market-lede">
              Phronesia turns markets, policy, investing, and personal finance into interactive simulations where
              students see the consequences of every choice.
            </p>
          </div>
          <div className="homepage-hero-actions">
            <div className="cta-row compact-hero-actions hero-primary-actions">
              <Link className="button primary" href="/play/setup" prefetch={false}>
                Start Learning
              </Link>
              <Link className="button secondary" href="/scenarios">
                Explore Scenarios
              </Link>
            </div>
          </div>
        </div>

        <aside className="market-terminal compact-terminal hero-product-mockup" aria-label="Finance learning dashboard preview">
          <div className="terminal-topline mockup-topline">
            <span>Simulation Preview</span>
            <strong>{selectedLevel.label}</strong>
          </div>

          <div className="mockup-scenario-card">
            <div>
              <span>Scenario</span>
              <strong>Budget Balance</strong>
            </div>
            <div className="mockup-score">
              <span>Progress</span>
              <strong>82%</strong>
            </div>
          </div>

          <div className="terminal-score mockup-decision-card">
            <span>Decision</span>
            <strong>Balance the budget without hurting household demand.</strong>
            <small>Recommended next: {nextScenario.title} · {nextProfile.difficulty}</small>
          </div>

          <div className="mockup-market-grid">
            <div>
              <span>Portfolio signal</span>
              <strong>$100,000</strong>
            </div>
            <div>
              <span>Market movement</span>
              <strong>+1.8%</strong>
            </div>
          </div>

          <div className="mockup-feedback-card">
            <span>Consequence</span>
            <strong>Bond yields ease and market confidence improves.</strong>
            <p>Household welfare risk stays visible, so the score rewards stability but warns about tradeoffs.</p>
          </div>
        </aside>
      </section>

      <section className="home-ia-section home-paths-section">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">Product overview</p>
            <h2>What you can do on Phronesia</h2>
          </div>
          <p className="muted">Choose the path that fits how you want to learn: concepts, scenarios, or investing practice.</p>
        </div>
        <div className="home-path-grid">
          {productPaths.map((path) => (
            <Link className="home-path-card" href={path.href} key={path.href}>
              <span>{path.title}</span>
              <p>{path.body}</p>
              <strong>{path.action}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-ia-section home-process-section">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>Choose, decide, see what changes.</h2>
          </div>
          <p className="muted">The whole learning loop fits into one short simulation.</p>
        </div>
        <div className="home-process-grid">
          {processSteps.map((item) => (
            <article className="home-step-card" key={item.step}>
              <div className="home-step-visual" aria-hidden="true">
                <span>{item.step}</span>
                <i>{item.cue}</i>
              </div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-ia-section home-starting-section" id="recommended">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">Start here</p>
            <h2>Try a focused preview, then open the full pages.</h2>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse All Scenarios
          </Link>
        </div>

        <div className="home-starting-grid">
          {beginnerRecommendations.map((scenario) => {
            const profile = getScenarioLearningProfile(scenario);
            return (
              <article className="home-start-card" key={scenario.id}>
                <div className="home-card-meta">
                  <span>{profile.difficulty}</span>
                  <span>{profile.estimatedMinutes} min</span>
                  <span>{profile.concepts.slice(0, 2).join(", ")}</span>
                </div>
                <h3>{scenario.title}</h3>
                <p>Start with a beginner simulation, make a decision, and use the feedback to understand the tradeoff.</p>
                <div className="home-card-actions">
                  <Link className="button primary" href={`/play/setup?scenario=${scenario.id}`} prefetch={false}>
                    Start
                  </Link>
                  <Link className="text-link" href="/scenarios">
                    View library
                  </Link>
                </div>
              </article>
            );
          })}

          {featuredArticle ? (
            <article className="home-start-card article-start-card">
              <div className="home-card-meta">
                <span>{featuredArticle.category}</span>
                <span>{featuredArticle.level}</span>
              </div>
              <h3>{featuredArticle.title}</h3>
              <p>{featuredArticle.excerpt}</p>
              <div className="home-card-actions">
                <Link className="button secondary" href={`/articles/${featuredArticle.slug}`}>
                  Read article
                </Link>
                <Link className="text-link" href="/articles">
                  View all articles
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="home-ia-section home-platform-section">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">Explore the platform</p>
            <h2>Find the right place to start.</h2>
          </div>
          <p className="muted">Use the main product pages when you want the full lessons, labs, simulations, and articles.</p>
        </div>
        <div className="home-platform-grid">
          {platformLinks.map((item) => (
            <Link className="home-platform-card" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              <small>{item.action}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-final-cta">
        <div>
          <p className="eyebrow">Start Learning</p>
          <h2>Try one simulation and see the feedback loop immediately.</h2>
        </div>
        <div className="cta-row">
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Start Learning
          </Link>
          <Link className="button secondary" href="/learn">
            Learn Concepts First
          </Link>
        </div>
      </section>
    </section>
  );
}
