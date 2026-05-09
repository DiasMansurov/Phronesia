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
  ["1", "Choose your level"],
  ["2", "Run a scenario"],
  ["3", "Get your score"]
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
    <section className="shell section phronesia-home compact-home-flow stack-lg">
      <section className="market-hero compact-start-hero">
        <div className="market-hero-copy stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">Phronesia</p>
            <h1 className="display market-display">Learn finance by simulation.</h1>
            <p className="lede market-lede">
              Make decisions, see what happens to markets and households, then learn why.
            </p>
          </div>
          <div className="cta-row compact-hero-actions">
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
          <div className="quick-step-row" aria-label="Quick start steps">
            {highlights.map(([step, body]) => (
              <article key={step} className="quick-step">
                <strong>{step}</strong>
                <span>{body}</span>
              </article>
            ))}
          </div>
        </div>
        <aside className="market-terminal compact-terminal" aria-label="Finance learning dashboard preview">
          <div className="terminal-topline">
            <span>Next</span>
            <strong>{selectedLevel.label}</strong>
          </div>
          <div className="terminal-score">
            <strong>{nextScenario.title}</strong>
            <small>{nextProfile.difficulty} · {nextProfile.estimatedMinutes} min · {nextProfile.concepts.slice(0, 2).join(", ")}</small>
          </div>
          <Link className="button secondary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
            Start Next
          </Link>
        </aside>
      </section>

      <section className="onboarding-panel panel compact-choice-panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>Pick your level. We recommend the next scenario.</h2>
          </div>
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Continue
          </Link>
        </div>
        <div className="level-pill-grid">
          {USER_LEVELS.map((level) => (
            <button
              key={level.id}
              className={`level-pill ${userLevel === level.id ? "selected" : ""}`}
              onClick={() => chooseLevel(level.id)}
              type="button"
            >
              <span>{level.label}</span>
            </button>
          ))}
        </div>
        <details className="compact-details">
          <summary>What this level means</summary>
          <p>{selectedLevel.summary}</p>
          <p>{selectedLevel.recommendation}</p>
        </details>
      </section>

      <section className="recommendation-zone stack-md" id="recommended">
        <div className="section-header">
          <div>
            <p className="eyebrow">Recommended for your level</p>
            <h2>{selectedLevel.label} path</h2>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse All Scenarios
          </Link>
        </div>
        <div className="compact-scenario-list">
          {recommended.slice(0, 3).map((scenario) => {
            const profile = getScenarioLearningProfile(scenario);
            return (
              <article key={scenario.id} className="compact-scenario-row">
                <div>
                  <strong>{scenario.title}</strong>
                  <span>{profile.difficulty} · {profile.estimatedMinutes} min · {profile.concepts.slice(0, 2).join(", ")}</span>
                </div>
                <Link className="button secondary" href={`/play/setup?scenario=${scenario.id}`} prefetch={false}>
                  Start
                </Link>
                <details className="compact-details row-details">
                  <summary>Details</summary>
                  <p>{scenario.summary}</p>
                </details>
              </article>
            );
          })}
        </div>
      </section>

      <section className="next-challenge-panel compact-next-panel">
        <div className="stack-sm">
          <p className="eyebrow">Next Challenge</p>
          <h2>{nextScenario.title}</h2>
          <div className="pill-row">
            <span className="pill">{nextProfile.track}</span>
            <span className="pill">{nextProfile.difficulty}</span>
            <span className="pill">{nextProfile.estimatedMinutes} min</span>
          </div>
          <details className="compact-details">
            <summary>Why this challenge?</summary>
            <p>{nextScenario.summary}</p>
            <p>{nextProfile.recommendation}</p>
          </details>
        </div>
        <Link className="button primary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
          Start This Scenario
        </Link>
      </section>

      <details className="panel compact-details-panel">
        <summary>
          <span>Difficulty progression</span>
          <strong>From basics to expert simulations</strong>
        </summary>
        <div className="finance-progression-grid compact-progression-grid">
          {FINANCE_PROGRESSION_LEVELS.map((level) => (
            <article key={level.id} className="progression-card">
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <p>{level.summary}</p>
            </article>
          ))}
        </div>
      </details>

      <section className="feature-grid compact-feature-grid">
        {featureBlocks.map((feature) => (
          <details key={feature.title} className="feature-card compact-feature-card">
            <summary>{feature.title}</summary>
            <p>{feature.body}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
