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
import { getLearningLevel, scenarioLearningLevel } from "@/lib/game/learning";
import { getProfile } from "@/lib/game/profile";
import { getActiveRunId, loadRuns, saveProfile, saveRun, setActiveRunId } from "@/lib/game/storage";
import type { DifficultyId, LearningLevelId, LearningMode, PlayerProfile, PolicyComplexity, RunState } from "@/lib/game/types";

type SetupStep = "level" | "toolkit" | "scenario" | "difficulty";

const SETUP_STEPS: Array<{ id: SetupStep; number: string; label: string; title: string }> = [
  { id: "level", number: "01", label: "Level", title: "Choose level" },
  { id: "toolkit", number: "02", label: "Mode", title: "Pick mode" },
  { id: "scenario", number: "03", label: "Scenario", title: "Choose case" },
  { id: "difficulty", number: "04", label: "Start", title: "Review and start" }
];

const SETUP_LEARNING_ORDER: LearningLevelId[] = ["tutorial", "basic", "finance", "policy", "crisis", "competitive"];

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
  const recommendedScenario = recommendedScenarios[0] ?? selectedScenario;
  const currentStepIndex = SETUP_STEPS.findIndex((setupStep) => setupStep.id === step);
  const orderedLearningLevels = SETUP_LEARNING_ORDER.map((levelId) => getLearningLevel(levelId));
  const caseLibraryLevel = getLearningLevel("historical");
  const selectedDifficulty = DIFFICULTIES.find((difficulty) => difficulty.id === selectedDifficultyId) ?? DIFFICULTIES[0];

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
    <section className="setup-wizard-page">
      <section className="setup-wizard-hero-band">
        <div className="shell setup-wizard-hero">
          <p className="setup-wizard-eyebrow">Simulation Setup</p>
          <h1>Start in 4 quick steps.</h1>
          <p>Pick your level, choose a mode, select a scenario, and begin.</p>
          <div className="setup-current-strip" aria-label="Current setup">
            <span>Level: {selectedUserLevel.label}</span>
            <span>Mode: {selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
            <span>Scenario: {selectedScenario ? selectedScenario.title : "Not selected yet"}</span>
          </div>
        </div>
      </section>

      <section className="setup-wizard-content-band">
        <div className="shell setup-wizard-content">
          <section className="setup-wizard-profile-card">
            <div>
              <p className="setup-wizard-eyebrow">Profile</p>
              <label className="setup-profile-field">
                <span>Display name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  onBlur={persistDisplayName}
                  placeholder="Policy Strategist"
                />
              </label>
            </div>
            <div className="setup-profile-stats" aria-label="Profile stats">
              <span>{profile.completedRuns} runs</span>
              <span>{profile.streakCount} streak</span>
              <span>Level {profile.level}</span>
            </div>
            {activeRun ? (
              <Link className="button secondary" href={`/play?run=${activeRun.runId}`}>
                Continue {activeRun.scenarioTitle}
              </Link>
            ) : null}
          </section>

          <section className="setup-stepper-card" aria-label="Simulation setup progress">
            {SETUP_STEPS.map((setupStep, index) => (
              <button
                key={setupStep.id}
                className={`setup-step-pill ${index < currentStepIndex ? "complete" : ""} ${index === currentStepIndex ? "current" : ""}`}
                onClick={() => {
                  if (index <= currentStepIndex) setStep(setupStep.id);
                }}
                type="button"
                disabled={index > currentStepIndex}
              >
                <span>{setupStep.number}</span>
                <strong>{setupStep.label}</strong>
                <small>{setupStep.title}</small>
              </button>
            ))}
          </section>

          <section className="setup-wizard-panel">
            <div className="setup-wizard-section-header">
              <div>
                <p className="setup-wizard-eyebrow">
                  Step {currentStepIndex + 1} of 4
                </p>
                <h2>
                  {step === "level"
                    ? "What is your current level?"
                    : step === "toolkit"
                      ? "Pick mode and tools"
                      : step === "scenario"
                        ? "Choose a scenario"
                        : "Ready to start"}
                </h2>
                <p>
                  {step === "level"
                    ? "One tap is enough. You can change it later."
                    : step === "toolkit"
                      ? "Learning mode gives hints. Challenge mode is for rankings."
                      : step === "scenario"
                        ? "Start with a recommended scenario or search by topic."
                        : "Review your setup, choose pressure, and start the simulation."}
                </p>
              </div>
              {step !== "level" ? (
                <button
                  className="button secondary"
                  onClick={() => setStep(step === "difficulty" ? "scenario" : step === "scenario" ? "toolkit" : "level")}
                  type="button"
                >
                  {step === "difficulty" ? "Back to Scenario" : step === "scenario" ? "Back to Mode" : "Back to Level"}
                </button>
              ) : null}
            </div>

            {step === "level" ? (
              <div className="setup-level-grid">
                {USER_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    className={`setup-choice-card setup-level-card ${userLevel === level.id ? "selected" : ""}`}
                    onClick={() => chooseUserLevel(level.id)}
                    type="button"
                  >
                    <div className="setup-card-topline">
                      <span>{level.label}</span>
                      {userLevel === level.id ? <strong>Selected</strong> : null}
                    </div>
                    <h3>{level.title}</h3>
                    <p>{level.summary}</p>
                    <small>{level.recommendation}</small>
                  </button>
                ))}
              </div>
            ) : step === "toolkit" ? (
              <div className="setup-toolkit-step">
                <section className="setup-recommendation-banner">
                  <div>
                    <p className="setup-wizard-eyebrow">Recommended for {selectedUserLevel.label}</p>
                    <h3>{recommendedScenario.title}</h3>
                    <p>{recommendedScenario.summary}</p>
                  </div>
                  <div className="setup-recommendation-actions">
                    <button
                      className="button primary"
                      onClick={() => {
                        setSelectedScenarioId(recommendedScenario.id);
                        setSelectedLevelId(scenarioLearningLevel(recommendedScenario));
                        setStep("scenario");
                      }}
                      type="button"
                    >
                      Use recommendation
                    </button>
                    <button className="button secondary" onClick={() => setStep("scenario")} type="button">
                      See all recommendations
                    </button>
                  </div>
                </section>

                <section className="setup-subsection">
                  <div className="setup-subsection-heading">
                    <span>A</span>
                    <div>
                      <h3>Choose mode</h3>
                      <p>Hints and feedback change based on the mode you choose.</p>
                    </div>
                  </div>
                  <div className="setup-mode-grid">
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
                        className={`setup-choice-card setup-mode-card ${selectedMode === mode.id ? "selected" : ""}`}
                        onClick={() => setSelectedMode(mode.id)}
                        type="button"
                      >
                        <div className="setup-card-topline">
                          <span>{mode.title}</span>
                          <strong>{selectedMode === mode.id ? "Selected" : mode.meta}</strong>
                        </div>
                        <p>{mode.body}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="setup-subsection">
                  <div className="setup-subsection-heading">
                    <span>B</span>
                    <div>
                      <h3>Choose toolkit</h3>
                      <p>Toolkits control how many policy levers appear during the run.</p>
                    </div>
                  </div>
                  <div className="setup-toolkit-grid">
                    {POLICY_TOOLSETS.map((toolkit) => (
                      <button
                        key={toolkit.id}
                        className={`setup-choice-card setup-toolkit-card ${selectedComplexity === toolkit.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedComplexity(toolkit.id);
                          setStep("scenario");
                        }}
                        type="button"
                      >
                        <div className="setup-card-topline">
                          <span>{toolkit.label}</span>
                          <strong>{selectedComplexity === toolkit.id ? "Selected" : "Available"}</strong>
                        </div>
                        <p>{toolkit.summary}</p>
                        <div className="setup-chip-row">
                          {toolkit.details.map((detail) => (
                            <span key={detail}>{detail}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : step === "scenario" ? (
              <div className="setup-scenario-layout">
                <div className="setup-scenario-main">
                  <section className="setup-subsection">
                    <div className="setup-subsection-heading">
                      <span>1</span>
                      <div>
                        <h3>Finance learning path</h3>
                        <p>Levels are ordered from foundations to expert simulation.</p>
                      </div>
                    </div>
                    <div className="setup-level-path-grid" role="tablist" aria-label="Learning path">
                      {orderedLearningLevels.map((level) => (
                        <button
                          key={level.id}
                          className={`setup-path-card ${selectedLevelId === level.id ? "active" : ""}`}
                          onClick={() => setSelectedLevelId(level.id)}
                          type="button"
                        >
                          <span>{level.label}</span>
                          <strong>{level.title}</strong>
                          <small>{level.summary}</small>
                        </button>
                      ))}
                    </div>
                    <button
                      className={`setup-path-card setup-case-library-card ${selectedLevelId === caseLibraryLevel.id ? "active" : ""}`}
                      onClick={() => setSelectedLevelId(caseLibraryLevel.id)}
                      type="button"
                    >
                      <span>Case Library</span>
                      <strong>{caseLibraryLevel.title}</strong>
                      <small>{caseLibraryLevel.summary}</small>
                    </button>
                  </section>

                  <section className="setup-filter-panel">
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
                  </section>

                  <section className="setup-level-context-card">
                    <div>
                      <p className="setup-wizard-eyebrow">{selectedLevel.label}</p>
                      <h3>{selectedLevel.title}</h3>
                      <p>{selectedLevel.summary}</p>
                    </div>
                    <div className="setup-chip-row">
                      {selectedLevel.concepts.slice(0, 4).map((concept) => (
                        <span key={concept}>{concept}</span>
                      ))}
                    </div>
                  </section>

                  <div className="setup-scenario-grid">
                    {scenarioList.map((scenario) => {
                      const selected = selectedScenarioId === scenario.id;
                      const profile = getScenarioLearningProfile(scenario);
                      return (
                        <button
                          key={scenario.id}
                          className={`setup-choice-card setup-scenario-card ${selected ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedScenarioId(scenario.id);
                            setStep("difficulty");
                          }}
                          type="button"
                        >
                          <div className="setup-card-topline">
                            <span>{profile.difficulty}</span>
                            <strong>{profile.estimatedMinutes} min</strong>
                          </div>
                          <h3>{scenario.title}</h3>
                          <p>{profile.concepts.slice(0, 3).join(" | ")}</p>
                          <div className="setup-chip-row">
                            {profile.concepts.slice(0, 3).map((concept) => <span key={concept}>{concept}</span>)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {scenarioList.length === 0 ? (
                    <div className="setup-empty-state">
                      <strong>No scenarios match these filters.</strong>
                      <p>Try a broader search or set difficulty back to All.</p>
                    </div>
                  ) : null}

                  {!showAllScenarios && !scenarioQuery && difficultyFilter === "All" && filteredScenarios.length > scenarioList.length ? (
                    <button className="button secondary compact-show-more" onClick={() => setShowAllScenarios(true)} type="button">
                      Show {filteredScenarios.length - scenarioList.length} more scenarios
                    </button>
                  ) : null}
                </div>

                <aside className="setup-selected-summary" aria-label="Selected scenario summary">
                  <p className="setup-wizard-eyebrow">Selected scenario</p>
                  <h3>{selectedScenario.title}</h3>
                  <details className="setup-details" open>
                    <summary>Scenario details</summary>
                    <p>{selectedScenario.summary}</p>
                    <p>{selectedScenario.mechanics.summary}</p>
                  </details>
                  <div className="setup-chip-row">
                    <span>{selectedScenario.country}</span>
                    <span>{selectedScenario.startingYear}</span>
                    <span>{selectedToolkit.label}</span>
                    <span>{selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
                    <span>{selectedScenarioProfile.difficulty}</span>
                  </div>
                  <button className="button primary" onClick={() => setStep("difficulty")} type="button">
                    Continue to start
                  </button>
                </aside>
              </div>
            ) : (
              <div className="setup-review-step">
                <section className="setup-review-card">
                  <div className="setup-review-header">
                    <div>
                      <p className="setup-wizard-eyebrow">Ready to start</p>
                      <h3>{selectedScenario.title}</h3>
                      <p>{selectedScenarioProfile.concepts.slice(0, 4).join(" | ")}</p>
                    </div>
                    <div className="setup-chip-row">
                      <span>{selectedScenario.country}</span>
                      <span>{selectedScenario.startingYear}</span>
                      <span>{selectedScenarioProfile.estimatedMinutes} min</span>
                    </div>
                  </div>

                  <div className="setup-review-grid">
                    {[
                      ["Level", selectedUserLevel.label],
                      ["Mode", selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"],
                      ["Toolkit", selectedToolkit.label],
                      ["Pressure", selectedDifficulty.label]
                    ].map(([label, value]) => (
                      <div key={label} className="setup-review-tile">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="setup-pressure-panel">
                    <div>
                      <p className="setup-wizard-eyebrow">Pressure Level</p>
                      <h4>Choose how hard the simulation should feel.</h4>
                    </div>
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

                  <div className="setup-goal-grid">
                    {selectedScenario.goals.map((goal) => (
                      <div key={goal.label} className="setup-goal-item">
                        {goal.label}
                      </div>
                    ))}
                    {selectedScenario.mechanics.notes.slice(0, 3).map((note) => (
                      <div key={note} className="setup-goal-item">
                        {note}
                      </div>
                    ))}
                    <div className="setup-goal-item setup-data-source-note">
                      <span>Data Source</span>
                      <small>{scenarioDataSource(selectedScenario)}</small>
                    </div>
                  </div>

                  <div className="wizard-actions">
                    <button className="button secondary" onClick={() => setStep("scenario")} type="button">
                      Back to Scenario
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
            <section className="setup-recent-section">
              <div className="setup-wizard-section-header">
                <div>
                  <p className="setup-wizard-eyebrow">Recent Runs</p>
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
                      {new Date(run.updatedAt).toLocaleDateString()} | {run.rankTitle} | {run.difficultyId}
                    </p>
                    <Link className="text-link" href={run.complete ? `/play/results/${run.runId}` : `/play?run=${run.runId}`}>
                      {run.complete ? "Open result" : "Continue run"}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </section>
  );
}
