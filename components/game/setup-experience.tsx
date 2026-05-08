"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { DIFFICULTIES, getScenario, SCENARIOS } from "@/lib/game/content";
import { createRun } from "@/lib/game/engine";
import { getLearningLevel, LEARNING_LEVELS, scenarioLearningLevel } from "@/lib/game/learning";
import { getProfile } from "@/lib/game/profile";
import { getActiveRunId, loadRuns, saveProfile, saveRun, setActiveRunId } from "@/lib/game/storage";
import type { DifficultyId, LearningLevelId, LearningMode, PlayerProfile, PolicyComplexity, RunState } from "@/lib/game/types";

type SetupStep = "toolkit" | "scenario" | "difficulty";

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
  const [step, setStep] = useState<SetupStep>("toolkit");
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [selectedLevelId, setSelectedLevelId] = useState<LearningLevelId>("tutorial");
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<DifficultyId>("summit");
  const [selectedComplexity, setSelectedComplexity] = useState<PolicyComplexity>("tutorial");
  const [selectedMode, setSelectedMode] = useState<LearningMode>("learning");

  useEffect(() => {
    const nextProfile = getProfile();
    const runs = loadRuns();
    const activeRunId = getActiveRunId();
    setProfile(nextProfile);
    setDisplayName(nextProfile.displayName);
    setRecentRuns(runs.slice(0, 4));
    setActiveRun(activeRunId ? runs.find((run) => run.runId === activeRunId) ?? null : null);
    track("page_view", { page: "/play/setup" });
  }, []);

  const filteredScenarios = useMemo(
    () =>
      SCENARIOS.filter((scenario) => scenarioLearningLevel(scenario) === selectedLevelId).sort((left, right) => {
        if (left.country !== right.country) return left.country.localeCompare(right.country);
        return left.startingYear - right.startingYear;
      }),
    [selectedLevelId]
  );

  useEffect(() => {
    if (!filteredScenarios.some((scenario) => scenario.id === selectedScenarioId)) {
      setSelectedScenarioId(filteredScenarios[0]?.id ?? SCENARIOS[0].id);
    }
  }, [filteredScenarios, selectedScenarioId]);

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

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Campaign Setup</p>
          <h1 className="display compact">Start simple, learn economics, then compete.</h1>
          <p className="lede">
            Choose Learning Mode for explanations after each decision, or Challenge Mode when you are ready for ranking-style pressure.
            Scenarios now follow a clear education path from basic inflation to finance and crisis management.
          </p>
        </div>
        <div className="panel stack-sm">
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
          <div className="stat-row">
            <span>Completed runs</span>
            <strong>{profile.completedRuns}</strong>
          </div>
          <div className="stat-row">
            <span>Streak</span>
            <strong>{profile.streakCount}</strong>
          </div>
          <div className="stat-row">
            <span>XP level</span>
            <strong>{profile.level}</strong>
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
              Step {step === "toolkit" ? "1" : step === "scenario" ? "2" : "3"} of 3
            </p>
            <h2>
              {step === "toolkit"
                ? "Pick your learning mode and first policy board"
                : step === "scenario"
                  ? "Choose the next level in the learning path"
                  : "Pick the pressure level"}
            </h2>
            <p className="muted">
              {step === "toolkit"
                ? "Learning Mode teaches after each move. Challenge Mode is stricter and is the future leaderboard mode."
                : step === "scenario"
                  ? "Scenarios are grouped by what they teach, so beginners do not start inside a crisis."
                  : "Choose how unforgiving the economy and politics should feel."}
            </p>
          </div>
          {step !== "toolkit" ? (
            <button
              className="button secondary"
              onClick={() => setStep(step === "difficulty" ? "scenario" : "toolkit")}
              type="button"
            >
              {step === "difficulty" ? "Back To Scenarios" : "Back To Toolkits"}
            </button>
          ) : null}
        </div>

        {step === "toolkit" ? (
          <>
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
              <p className="eyebrow">Learning Path</p>
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
              {filteredScenarios.map((scenario) => {
                const selected = selectedScenarioId === scenario.id;
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
                      <span className="pill">{scenario.startingYear}</span>
                      <span className="mini-status open">{scenario.mode === "open" ? "Open economy" : "Closed economy"}</span>
                    </div>
                    <h3>{scenario.title}</h3>
                    <p className="muted">{scenario.subtitle}</p>
                    <p>{scenario.summary}</p>
                  </button>
                );
              })}
            </div>

            <section className="panel compact-panel stack-md">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Selected Scenario</p>
                  <h2>{selectedScenario.title}</h2>
                  <p className="muted">{selectedScenario.summary}</p>
                  <p className="muted">{selectedScenario.mechanics.summary}</p>
                </div>
                <div className="pill-row">
                  <span className="pill">{selectedScenario.country}</span>
                  <span className="pill">{selectedScenario.startingYear}</span>
                  <span className="pill">{selectedToolkit.label}</span>
                  <span className="pill">{selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
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
                  <p className="muted">{selectedScenario.summary}</p>
                  <p className="muted">{selectedScenario.mechanics.summary}</p>
                </div>
                <div className="pill-row">
                  <span className="pill">{selectedScenario.country}</span>
                  <span className="pill">{selectedScenario.startingYear}</span>
                  <span className="pill">{selectedToolkit.label}</span>
                  <span className="pill">{selectedMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
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
                  Start New Reign
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
