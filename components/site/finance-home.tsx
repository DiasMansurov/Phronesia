"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SCENARIOS } from "@/lib/game/content";
import {
  FINANCE_PROGRESSION_LEVELS,
  getNextScenario,
  getRecommendedScenarios,
  getScenarioLearningProfile,
  getUserLevel,
  USER_LEVELS,
  type UserLevelId
} from "@/lib/game/curriculum";
import { loadRuns } from "@/lib/game/storage";

const highlights = [
  ["Finance-first", "Savings, debt, markets, credit, risk, and confidence are the center of the product."],
  ["Simulation-based", "Students learn by making decisions and seeing market and household consequences."],
  ["Progressive", "Beginner cases lead into crisis management and competitive expert simulations."]
];

const featureBlocks = [
  {
    title: "Learn finance through decisions",
    body: "Every scenario connects a choice to real financial consequences: savings lose purchasing power, loans become expensive, bond yields rise, stocks react, and banks become safer or riskier."
  },
  {
    title: "Play real-world market challenges",
    body: "Cases cover inflation and savings, first loans, bank regulation, currency pressure, debt crises, stock-market crashes, housing bubbles, and investor-confidence shocks."
  },
  {
    title: "Compare your policy score",
    body: "After each simulation, Phronesia gives a score breakdown for financial stability, market confidence, debt sustainability, household welfare, risk management, and long-term sustainability."
  },
  {
    title: "Progress from beginner to expert",
    body: "Choose your starting level, get recommended scenarios, earn achievements, and move from basic finance literacy to multi-variable crisis simulations."
  }
];

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
}

export function FinanceHome() {
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const storedLevel = readStoredLevel();
    setUserLevel(storedLevel);
    setCompletedIds(loadRuns().filter((run) => run.complete).map((run) => run.scenarioId));
  }, []);

  const recommended = useMemo(() => getRecommendedScenarios(userLevel, SCENARIOS, 4), [userLevel]);
  const nextScenario = useMemo(() => getNextScenario(userLevel, completedIds, SCENARIOS), [completedIds, userLevel]);
  const selectedLevel = getUserLevel(userLevel);
  const nextProfile = getScenarioLearningProfile(nextScenario);

  function chooseLevel(id: UserLevelId) {
    setUserLevel(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("phronesia.userLevel", id);
    }
  }

  return (
    <section className="shell section phronesia-home stack-2xl">
      <section className="market-hero">
        <div className="market-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia — Finance & Economics Education Through Simulation</p>
            <h1 className="display market-display">Master Finance by Running the Economy</h1>
            <p className="lede market-lede">
              Phronesia is an interactive finance and economics simulation platform where students learn markets, money,
              policy, and crisis management through real-world decisions.
            </p>
          </div>
          <div className="cta-row">
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start Learning
            </Link>
            <Link className="button secondary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
              Try a Scenario
            </Link>
            <Link className="text-link" href="/finance-lab">
              Explore Finance Lab
            </Link>
          </div>
          <div className="market-signal-row" aria-label="Platform highlights">
            {highlights.map(([title, body]) => (
              <article key={title} className="market-signal">
                <strong>{title}</strong>
                <span>{body}</span>
              </article>
            ))}
          </div>
        </div>
        <aside className="market-terminal" aria-label="Finance learning dashboard preview">
          <div className="terminal-topline">
            <span>Learning Dashboard</span>
            <strong>{selectedLevel.label}</strong>
          </div>
          <div className="terminal-score">
            <span>Next Challenge</span>
            <strong>{nextScenario.title}</strong>
            <small>{nextProfile.recommendation}</small>
          </div>
          <div className="mini-chart finance-chart" aria-hidden="true">
            {[42, 58, 51, 64, 72, 68, 81, 88].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="terminal-grid">
            <div><span>Stock index</span><strong>104</strong></div>
            <div><span>Bond yield</span><strong>4.8%</strong></div>
            <div><span>Currency</span><strong>96</strong></div>
            <div><span>Bank stability</span><strong>78</strong></div>
          </div>
        </aside>
      </section>

      <section className="onboarding-panel panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Personalized start</p>
            <h2>What is your current level?</h2>
            <p className="muted">Choose once, and Phronesia recommends scenarios that match your finance knowledge.</p>
          </div>
          <span className="pill">{selectedLevel.recommendation}</span>
        </div>
        <div className="level-choice-grid">
          {USER_LEVELS.map((level) => (
            <button
              key={level.id}
              className={`level-choice-card ${userLevel === level.id ? "selected" : ""}`}
              onClick={() => chooseLevel(level.id)}
              type="button"
            >
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <small>{level.summary}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="recommendation-zone stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Recommended for your level</p>
            <h2>{selectedLevel.label} finance path</h2>
            <p className="muted">{selectedLevel.summary}</p>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse All Scenarios
          </Link>
        </div>
        <div className="recommendation-grid">
          {recommended.map((scenario) => {
            const profile = getScenarioLearningProfile(scenario);
            return (
              <article key={scenario.id} className="scenario-card finance-scenario-card">
                <div className="card-topline">
                  <span className="pill">{profile.difficulty}</span>
                  <span className="mini-status open">{profile.estimatedMinutes} min</span>
                </div>
                <h3>{scenario.title}</h3>
                <p className="muted">{scenario.subtitle}</p>
                <p>{scenario.summary}</p>
                <div className="concept-row">
                  {profile.concepts.slice(0, 3).map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="next-challenge-panel">
        <div className="stack-sm">
          <p className="eyebrow">Next Challenge</p>
          <h2>{nextScenario.title}</h2>
          <p>{nextScenario.summary}</p>
          <div className="pill-row">
            <span className="pill">{nextProfile.track}</span>
            <span className="pill">{nextProfile.difficulty}</span>
            <span className="pill">{nextProfile.estimatedMinutes} min</span>
          </div>
        </div>
        <Link className="button primary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
          Start This Scenario
        </Link>
      </section>

      <section className="progression-panel panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Difficulty progression</p>
            <h2>From financial basics to expert simulations.</h2>
          </div>
        </div>
        <div className="finance-progression-grid">
          {FINANCE_PROGRESSION_LEVELS.map((level) => (
            <article key={level.id} className="progression-card">
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <p>{level.summary}</p>
              <div className="concept-row">
                {level.concepts.slice(0, 3).map((concept) => (
                  <small key={concept}>{concept}</small>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        {featureBlocks.map((feature) => (
          <article key={feature.title} className="feature-card stack-sm">
            <p className="eyebrow">Platform</p>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
