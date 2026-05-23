"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SCENARIOS } from "@/lib/game/content";
import { FINANCE_PROGRESSION_LEVELS, getScenarioLearningProfile } from "@/lib/game/curriculum";

const difficultyOptions = ["All", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const timeOptions = ["All", "5 min", "6 min", "7 min", "8 min", "10 min", "12 min", "15 min", "18 min"];

export function ScenarioLibrary() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [time, setTime] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const scenarios = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SCENARIOS.map((scenario) => ({ scenario, profile: getScenarioLearningProfile(scenario) }))
      .filter(({ scenario, profile }) => {
        if (level !== "All" && profile.track !== level) return false;
        if (difficulty !== "All" && profile.difficulty !== difficulty) return false;
        if (time !== "All" && `${profile.estimatedMinutes} min` !== time) return false;
        if (!needle) return true;
        return [scenario.title, scenario.subtitle, scenario.summary, scenario.country, profile.track, ...profile.concepts]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => {
        if (left.profile.level !== right.profile.level) return left.profile.level - right.profile.level;
        return left.scenario.title.localeCompare(right.scenario.title);
      });
  }, [difficulty, level, query, time]);

  const visibleScenarios = showAll || query || level !== "All" || difficulty !== "All" || time !== "All"
    ? scenarios
    : scenarios.slice(0, 9);

  return (
    <section className="scenario-library">
      <section className="scenario-library-hero-band">
        <div className="shell scenario-library-hero">
          <div className="scenario-library-hero-copy">
            <p className="eyebrow">Scenario Library</p>
            <h1 className="display compact">Find the right finance challenge.</h1>
            <p className="lede compact-lede">
              Search by topic, level, difficulty, or time and start with the scenario that fits your goal.
            </p>
            <div className="scenario-hero-actions">
              <Link className="button primary" href="/play/setup" prefetch={false}>
                Get Recommendations
              </Link>
              {!showAll && !query && level === "All" && difficulty === "All" && time === "All" && scenarios.length > visibleScenarios.length ? (
                <button className="button secondary" onClick={() => setShowAll(true)} type="button">
                  Browse all scenarios
                </button>
              ) : null}
            </div>
          </div>

          <aside className="scenario-hero-card" aria-label="Scenario library overview">
            <div>
              <span>{SCENARIOS.length}</span>
              <strong>Scenarios</strong>
            </div>
            <div>
              <span>{FINANCE_PROGRESSION_LEVELS.length}</span>
              <strong>Learning levels</strong>
            </div>
            <div>
              <span>Beginner</span>
              <strong>To advanced</strong>
            </div>
            <div>
              <span>Finance</span>
              <strong>Markets, policy, and risk</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="scenario-catalog-band">
        <div className="shell scenario-catalog-shell">
          <section className="scenario-filter-panel scenario-search-panel">
            <div className="scenario-filter-bar">
              <label className="scenario-search-field">
                <span>Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search bonds, savings, bank panic, currency..."
                />
              </label>
              <label>
                <span>Level</span>
                <select value={level} onChange={(event) => setLevel(event.target.value)}>
                  <option value="All">All levels</option>
                  {FINANCE_PROGRESSION_LEVELS.map((item) => (
                    <option key={item.title} value={item.title}>{item.title}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Difficulty</span>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Time</span>
                <select value={time} onChange={(event) => setTime(event.target.value)}>
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="scenario-filter-footer">
              <p>
                Showing {visibleScenarios.length} of {scenarios.length} scenarios.
              </p>
            </div>
          </section>

          <div className="scenario-catalog-header">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Finance challenges ready to launch.</h2>
            </div>
            <p>Showing {visibleScenarios.length} of {scenarios.length} scenarios.</p>
          </div>

          <section className="scenario-grid scenario-catalog-grid">
            {visibleScenarios.map(({ scenario, profile }) => (
              <article key={scenario.id} className="scenario-card scenario-card-rich finance-scenario-card scenario-catalog-card">
                <div className="scenario-card-top">
                  <span className="scenario-badge scenario-badge-primary">{profile.difficulty}</span>
                  <span className="scenario-badge">{profile.estimatedMinutes} min</span>
                </div>
                <div className="scenario-card-body">
                  <h3>{scenario.title}</h3>
                  <p>{profile.concepts.slice(0, 3).join(" · ")}</p>
                </div>
                <div className="concept-row scenario-concept-row">
                  {profile.concepts.slice(0, 3).map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
                <div className="scenario-card-level">
                  <span>{profile.track}</span>
                </div>
                <div className="scenario-card-actions">
                  <Link className="button primary" href={`/play/setup?scenario=${scenario.id}`} prefetch={false}>
                    Start
                  </Link>
                  <details className="scenario-card-details">
                    <summary>Details</summary>
                    <p>{scenario.summary}</p>
                  </details>
                </div>
              </article>
            ))}
          </section>

          {!showAll && !query && level === "All" && difficulty === "All" && time === "All" && scenarios.length > visibleScenarios.length ? (
            <button className="button secondary compact-show-more scenario-show-more" onClick={() => setShowAll(true)} type="button">
              Show all scenarios
            </button>
          ) : null}
        </div>
      </section>
    </section>
  );
}
