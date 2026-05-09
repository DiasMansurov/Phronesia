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

  return (
    <section className="scenario-library stack-lg">
      <div className="hero-band compact market-page-hero">
        <div className="stack-sm">
          <p className="eyebrow">Scenario library</p>
          <h1 className="display compact">Finance challenges from first loan to market panic.</h1>
          <p className="lede compact-lede">
            Search by topic, filter by difficulty, and pick scenarios that match your current finance level.
          </p>
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Get Recommendations
          </Link>
        </div>
      </div>

      <section className="scenario-filter-panel panel stack-md">
        <div className="scenario-filter-bar">
          <label>
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
        <p className="muted small">{scenarios.length} scenarios match your filters.</p>
      </section>

      <section className="scenario-grid">
        {scenarios.map(({ scenario, profile }) => (
          <article key={scenario.id} className="scenario-card scenario-card-rich finance-scenario-card">
            <div className="card-topline">
              <span className="pill">{profile.difficulty}</span>
              <span className="mini-status open">{profile.estimatedMinutes} min</span>
            </div>
            <h3>{scenario.title}</h3>
            <p className="muted">{scenario.subtitle}</p>
            <p>{scenario.summary}</p>
            <div className="concept-row">
              {profile.concepts.slice(0, 4).map((concept) => (
                <span key={concept}>{concept}</span>
              ))}
            </div>
            <div className="card-topline">
              <small>{profile.track}</small>
              <Link className="text-link" href={`/play/setup?scenario=${scenario.id}`} prefetch={false}>
                Start
              </Link>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
