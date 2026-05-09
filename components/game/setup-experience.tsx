"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { DIFFICULTIES, getScenario, SCENARIOS } from "@/lib/game/content";
import {
  getRecommendedScenarios,
  getScenarioLearningProfile,
  getUserLevel,
  USER_LEVELS,
  userLevelToLearningLevel,
  type UserLevelId
} from "@/lib/game/curriculum";
import { createRun } from "@/lib/game/engine";
import { getLearningLevel, LEARNING_LEVELS, scenarioLearningLevel } from "@/lib/game/learning";
import { getProfile } from "@/lib/game/profile";
import { getActiveRunId, loadRuns, saveProfile, saveRun, setActiveRunId } from "@/lib/game/storage";
import type { DifficultyId, LearningLevelId, LearningMode, PlayerProfile, PolicyComplexity, RunState } from "@/lib/game/types";

type SetupStep = "level" | "toolkit" | "scenario" | "difficulty";

const POLICY_TOOLSETS: Array<{
  id: PolicyComplexity;
  label: string;
  summary: string;
  details: string[];
}> = [
  {
    id: "tutorial",
    label: "First Day Tutorial",
    summary: "Use only the simplest levers while the game explains the basics.",
    details: ["Base rate", "Tax rate", "Government spending"]
  },
  {
    id: "fiscal",
    label: "Fiscal Only",
    summary: "Run the economy using taxes, spending, and transfers only.",
    details: ["Income tax rate", "Government spending", "Transfer payments"]
  },
  {
    id: "monetary",
    label: "Monetary Only",
    summary: "Use central-bank tools without touching the budget.",
    details: ["Base rate", "Reserve requirement", "Bond purchases"]
  },
  {
    id: "combined",
    label: "Combined Core",
    summary: "Use the essential fiscal and monetary toolkit together.",
    details: ["Fiscal levers", "Central-bank levers", "Bank trust and financial literacy"]
  },
  {
    id: "advanced",
    label: "Full Cabinet",
    summary: "Add supply-side tools, financial regulation, bonds, credit, and investor confidence.",
    details: ["Infrastructure and training", "Bank regulation, bonds, deposit insurance", "Credit and financial literacy"]
  }
];

function scenarioDataSource(scenario: (typeof SCENARIOS)[number]) {
  if (scenario.startingYear === 2025 && scenario.heroTag === "Modern Case") {
    return "Starting macro data: IMF World Economic Outlook, April 2026; World Bank unemployment fallback where IMF data is unavailable.";
  }

  return "Starting macro data: historical scenario estimates tuned for classroom play.";
}

export function SetupExperience() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [recentRuns, setRecentRuns] = useState<RunState[]>([]);
  const [activeRun, setActiveRun] = useState<RunState | null>(null);
  const [step, setStep] = useState<SetupStep>("level");
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [selectedLevelId, setSelectedLevelId] = useState<LearningLevelId>("tutorial");
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<DifficultyId>("summit");
  const [selectedComplexity, setSelectedComplexity] = useState<PolicyComplexity>("tutorial");
  const [selectedMode, setSelectedMode] = useState<LearningMode>("learning");
  const [scenarioQuery, setScenarioQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  useEffect(() => {
    const nextProfile = getProfile();
    const runs = loadRuns();
    const activeRunId = getActiveRunId();
    setProfile(nextProfile);
    setDisplayName(nextProfile.displayName);
    setRecentRuns(runs.slice(0, 4));
    setActiveRun(activeRunId ? runs.find((run) => run.runId === activeRunId) ?? null : null);
    const storedLevel = window.localStorage.getItem("phronesia.userLevel");
    const nextUserLevel = USER_LEVELS.some((level) => level.id === storedLevel) ? (storedLevel as UserLevelId) : "beginner";
    const scenarioFromUrl = new URLSearchParams(window.location.search).get("scenario");
    setUserLevel(nextUserLevel);
    setSelectedLevelId(userLevelToLearningLevel(nextUserLevel));
    if (scenarioFromUrl && SCENARIOS.some((scenario) => scenario.id === scenarioFromUrl)) {
      setSelectedScenarioId(scenarioFromUrl);
      setSelectedLevelId(scenarioLearningLevel(getScenario(scenarioFromUrl)));
      setStep("toolkit");
    }
    track("page_view", { page: "/play/setup" });
  }, []);

  const filteredScenarios = useMemo(
    () => {
      const query = scenarioQuery.trim().toLowerCase();
      return SCENARIOS.filter((scenario) => scenarioLearningLevel(scenario) === selectedLevelId)
        .filter((scenario) => {
          const profile = getScenarioLearningProfile(scenario);
          if (difficultyFilter !== "All" && profile.difficulty !== difficultyFilter) return false;
          if (!query) return true;
          return [scenario.title, scenario.subtitle, scenario.summary, scenario.country, ...profile.concepts]
            .join(" ")
            .toLowerCase()
            .includes(query);
        })
        .sort((left, right) => {
          const leftProfile = getScenarioLearningProfile(left);
          const rightProfile = getScenarioLearningProfile(right);
          if (leftProfile.level !== rightProfile.level) return leftProfile.level - rightProfile.level;
          return left.title.localeCompare(right.title);
        });
    },
    [difficultyFilter, scenarioQuery, selectedLevelId]
  );

  useEffect(() => {
    if (!filteredScenarios.some((scenario) => scenario.id === selectedScenarioId)) {
      setSelectedScenarioId(filteredScenarios[0]?.id ?? SCENARIOS[0].id);
    }
  }, [filteredScenarios, selectedScenarioId]);

  useEffect(() => {
    setShowAllScenarios(false);
  }, [difficultyFilter, scenarioQuery, selectedLevelId]);

  function persistDisplayName() {
    if (!profile) return;
    const nextProfile = { ...profile, displayName: displayName.trim() || profile.displayName };
    setProfile(nextProfile);
    saveProfile(nextProfile);
  }

  function startRun(input: { scenarioId: string; difficultyId: DifficultyId }) {
    const run = createRun(input.scenarioId, input.difficultyId, {
      policyComplexity: selectedComplexity,
      learningMode: selectedMode
    });
    saveRun(run);
    setActiveRunId(run.runId);
    track("run_started", {
      scenarioId: run.scenarioId,
      difficultyId: run.difficultyId,
      policyComplexity: run.policyComplexity,
      learningMode: run.learningMode
    });
    router.push(`/play?run=${run.runId}`);
  }

  if (!profile) {
    return (
      <section className="shell section">
        <div className="panel">Loading your campaign profile...</div>
      </section>
    );
  }

  const selectedScenario = getScenario(selectedScenarioId);
  const selectedToolkit = POLICY_TOOLSETS.find((toolkit) => toolkit.id === selectedComplexity) ?? POLICY_TOOLSETS[2];
  const selectedLevel = getLearningLevel(selectedLevelId);
  const selectedUserLevel = getUserLevel(userLevel);
  const selectedScenarioProfile = getScenarioLearningProfile(selectedScenario);
  const recommendedScenarios = getRecommendedScenarios(userLevel, SCENARIOS, 4);
  const scenarioList = showAllScenarios || scenarioQuery || difficultyFilter !== "All" ? filteredScenarios : filteredScenarios.slice(0, 6);

  function chooseUserLevel(id: UserLevelId) {
    setUserLevel(id);
    setSelectedLevelId(userLevelToLearningLevel(id));
    if (typeof window !== "undefined") {
      window.localStorage.setItem("phronesia.userLevel", id);
    }
    const recommended = getRecommendedScenarios(id, SCENARIOS, 1)[0];
    if (recommended) setSelectedScenarioId(recommended.id);
    setStep("toolkit");
  }

  return (
    <section className="shell section stack-lg setup-flow">
      <div className="hero-band compact setup-hero-compact">
        <div className="stack-sm">
          <p className="eyebrow">Simulation Setup</p>
          <h1 className="display compact">Start in 4 quick steps.</h1>
          <p className="lede">
            Pick level, choose mode, select a scenario, start.
          </p>
        </div>
        <div className="panel stack-sm setup-mini-profile">
          <p className="eyebrow">Profile</p>
          <label className="stack-xs">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              onBlur={persistDisplayName}
              placeholder="Policy Strategist"
            />
          </label>
          <div className="setup-profile-stats">
            <span>{profile.completedRuns} runs</span>
            <span>{profile.streakCount} streak</span>
            <span>Level {profile.level}</span>
          </div>
          {activeRun ? (
            <Link className="button secondary" href={`/play?run=${activeRun.runId}`}>
              Continue {activeRun.scenarioTitle}
            </Link>
          ) : null}
        </div>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              Step {step === "level" ? "1" : step === "toolkit" ? "2" : step === "scenario" ? "3" : "4"} of 4
            </p>
              <h2>
              {step === "level"
                ? "What is your current level?"
                : step === "toolkit"
                  ? "Pick mode and tools"
                : step === "scenario"
                  ? "Choose a scenario"
                  : "Pick pressure"}
            </h2>
            <p className="muted">
              {step === "level"
                ? "One tap is enough. You can change it later."
                : step === "toolkit"
                  ? "Learning gives hints. Challenge is for rankings."
                : step === "scenario"
                  ? "Only a few cards show first. Search if you need more."
                  : "Choose how hard the simulation should feel."}
            </p>
          </div>
          {step !== "level" ? (
            <button
              className="button secondary"
              onClick={() => setStep(step === "difficulty" ? "scenario" : step === "scenario" ? "toolkit" : "level")}
              type="button"
            >
              {step === "difficulty" ? "Back To Scenarios" : step === "scenario" ? "Back To Mode" : "Back To Level"}
            </button>
          ) : null}
        </div>

        {step === "level" ? (
          <div className="level-choice-grid setup-level-grid">
            {USER_LEVELS.map((level) => (
              <button
                key={level.id}
                className={`level-choice-card ${userLevel === level.id ? "selected" : ""}`}
                onClick={() => chooseUserLevel(level.id)}
                type="button"
              >
                <span>{level.label}</span>
                <strong>{level.title}</strong>
                <small>{level.summary}</small>
              </button>
            ))}
          </div>
        ) : step === "toolkit" ? (
          <>
            <section className="next-challenge-panel setup-recommendation">
              <div className="stack-sm">
                <p className="eyebrow">Recommended for {selectedUserLevel.label}</p>
                <h2>{recommendedScenarios[0]?.title ?? selectedScenario.title}</h2>
                <p>{recommendedScenarios[0]?.summary ?? selectedScenario.summary}</p>
              </div>
              <button className="button secondary" onClick={() => setStep("scenario")} type="button">
                See All Recommendations
              </button>
            </section>
            <div className="grid two learning-mode-grid">
              {[
                {
                  id: "learning" as const,
                  title: "Learning Mode",
                  body: "Theory cards, explanations, glossary links, and a more forgiving learning path.",
                  meta: "Best for first-time players"
                },
                {
                  id: "challenge" as const,
                  title: "Challenge Mode",
                  body: "Fewer hints, standardized pressure, and scores intended for competitive ranking.",
                  meta: "Best after practice"
                }
              ].map((mode) => (
                <button
                  key={mode.id}
                  className={`scenario-card compact-choice learning-mode-card ${selectedMode === mode.id ? "selected" : ""}`}
                  onClick={() => setSelectedMode(mode.id)}
                  type="button"
                >
                  <div className="card-topline">
                    <span className="pill">{mode.title}</span>
                    <span className="mini-status open">{selectedMode === mode.id ? "Selected" : mode.meta}</span>
                  </div>
                  <p>{mode.body}</p>
                </button>
              ))}
            </div>

            <div className="grid two toolkit-grid">
              {POLICY_TOOLSETS.map((toolkit) => (
                <button
                  key={toolkit.id}
                  className={`scenario-card compact-choice ${selectedComplexity === toolkit.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedComplexity(toolkit.id);
                    setStep("scenario");
                  }}
                  type="button"
                >
                  <div className="stack-sm">
                    <div className="card-topline">
                      <span className="pill">{toolkit.label}</span>
                      <span className="mini-status open">{selectedComplexity === toolkit.id ? "Selected" : "Available"}</span>
                    </div>
                    <div className="stack-xs">
                      <h3>{toolkit.summary}</h3>
                      <p className="muted">
                        {toolkit.id === "advanced"
                          ? "Best for deeper solo play or advanced classes."
                          : "Designed to keep the decision board focused and readable."}
                      </p>
                    </div>
                    <div className="goal-list compact-list">
                      {toolkit.details.map((detail) => (
                        <div key={detail} className="goal-item">
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : step === "scenario" ? (
          <div className="stack-md">
            <div className="stack-sm">
              <p className="eyebrow">Finance learning path</p>
              <div className="level-path-grid" role="tablist" aria-label="Learning path">
                {LEARNING_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    className={`level-path-card ${selectedLevelId === level.id ? "active" : ""}`}
                    onClick={() => setSelectedLevelId(level.id)}
                    type="button"
                  >
                    <span>{level.label}</span>
                    <strong>{level.title}</strong>
                    <small>{level.summary}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="scenario-filter-bar">
              <label>
                <span>Search</span>
                <input
                  value={scenarioQuery}
                  onChange={(event) => setScenarioQuery(event.target.value)}
                  placeholder="Search inflation, bonds, banks, currency..."
                />
              </label>
              <label>
                <span>Difficulty</span>
                <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}>
                  {["All", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <section className="panel compact-panel stack-sm">
              <div className="section-header">
                <div>
                  <p className="eyebrow">{selectedLevel.label}</p>
                  <h2>{selectedLevel.title}</h2>
                  <p className="muted">{selectedLevel.summary}</p>
                </div>
                <div className="pill-row">
                  {selectedLevel.concepts.slice(0, 4).map((concept) => (
                    <span key={concept} className="pill">{concept}</span>
                  ))}
                </div>
              </div>
            </section>

            <div className="scenario-grid">
              {scenarioList.map((scenario) => {
                const selected = selectedScenarioId === scenario.id;
                const profile = getScenarioLearningProfile(scenario);
                return (
                  <button
                    key={scenario.id}
                    className={`scenario-card compact-choice ${selected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedScenarioId(scenario.id);
                      setStep("difficulty");
                    }}
                    type="button"
                  >
                    <div className="card-topline">
                      <span className="pill">{profile.difficulty}</span>
                      <span className="mini-status open">{profile.estimatedMinutes} min</span>
                    </div>
                    <h3>{scenario.title}</h3>
                    <p className="muted">{profile.concepts.slice(0, 3).join(" · ")}</p>
                    <div className="concept-row">
                      {profile.concepts.slice(0, 3).map((concept) => <span key={concept}>{concept}</span>)}
                    </div>
                  </button>
                );
              })}
            </div>

            {!showAllScenarios && !scenarioQuery && difficultyFilter === "All" && filteredScenarios.length > scenarioList.length ? (
              <button className="button secondary compact-show-more" onClick={() => setShowAllScenarios(true)} type="button">
                Show {filteredScenarios.length - scenarioList.length} more scenarios
              </button>
            ) : null}

            <section className="panel compact-panel stack-md">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Selected Scenario</p>
                  <h2>{selectedScenario.title}</h2>
                  <details className="compact-details" open>
                    <summary>Scenario details</summary>
                    <p>{selectedScenario.summary}</p>
                    <p>{selectedScenario.mechanics.summary}</p>
                  </details>
                </div>
                <div className="pill-row">
                  <span className="pill">{selectedScenario.country}</span>
                  <span className="pill">{selectedScenario.startingYear}</span>
                  <span className="pill">{selectedToolkit.label}</span>
                  <span className="pill">{selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
                  <span className="pill">{selectedScenarioProfile.difficulty}</span>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="stack-md">
            <section className="panel compact-panel stack-md">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Selected Scenario</p>
                  <h2>{selectedScenario.title}</h2>
                  <p className="muted">{selectedScenarioProfile.concepts.slice(0, 4).join(" · ")}</p>
                </div>
                <div className="pill-row">
                  <span className="pill">{selectedScenario.country}</span>
                  <span className="pill">{selectedScenario.startingYear}</span>
                  <span className="pill">{selectedToolkit.label}</span>
                  <span className="pill">{selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
                  <span className="pill">{selectedScenarioProfile.estimatedMinutes} min</span>
                </div>
              </div>

              <div className="stack-sm">
                <p className="eyebrow">Pressure Level</p>
                <div className="difficulty-picker" role="tablist" aria-label="Difficulty">
                  {DIFFICULTIES.map((difficulty) => (
                    <button
                      key={difficulty.id}
                      className={`toggle-chip ${selectedDifficultyId === difficulty.id ? "active" : ""}`}
                      onClick={() => setSelectedDifficultyId(difficulty.id)}
                      type="button"
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="goal-list compact-list">
                {selectedScenario.goals.map((goal) => (
                  <div key={goal.label} className="goal-item">
                    {goal.label}
                  </div>
                ))}
                {selectedScenario.mechanics.notes.slice(0, 3).map((note) => (
                  <div key={note} className="goal-item">
                    {note}
                  </div>
                ))}
                <div className="goal-item data-source-note">
                  <span className="eyebrow">Data Source</span>
                  <span>{scenarioDataSource(selectedScenario)}</span>
                </div>
              </div>

              <div className="wizard-actions">
                <button className="button secondary" onClick={() => setStep("scenario")} type="button">
                  Back To Scenarios
                </button>
                <button
                  className="button primary"
                  onClick={() => startRun({ scenarioId: selectedScenarioId, difficultyId: selectedDifficultyId })}
                  type="button"
                >
                  Start Simulation
                </button>
              </div>
            </section>
          </div>
        )}
      </section>

      {recentRuns.length ? (
        <section className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Recent Runs</p>
              <h2>Your latest scenario history</h2>
            </div>
          </div>
          <div className="recent-run-list">
            {recentRuns.map((run) => (
              <article key={run.runId} className="timeline-item stack-xs recent-run-card">
                <div className="stat-row">
                  <strong>{run.scenarioTitle}</strong>
                  <span>{run.complete ? "Complete" : "In progress"}</span>
                </div>
                <p className="muted small">
                  {new Date(run.updatedAt).toLocaleDateString()} · {run.rankTitle} · {run.difficultyId}
                </p>
                <Link className="text-link" href={run.complete ? `/play/results/${run.runId}` : `/play?run=${run.runId}`}>
                  {run.complete ? "Open result" : "Continue run"}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
