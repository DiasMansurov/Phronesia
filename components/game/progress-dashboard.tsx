"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SCENARIOS } from "@/lib/game/content";
import {
  buildPolicyScoreBreakdown,
  FINANCE_PROGRESSION_LEVELS,
  getNextScenario,
  getScenarioLearningProfile,
  inferWeakAreas,
  USER_LEVELS,
  type UserLevelId
} from "@/lib/game/curriculum";
import { getProfile } from "@/lib/game/profile";
import { loadRuns } from "@/lib/game/storage";
import type { PlayerProfile, RunState } from "@/lib/game/types";

const LOCKED_BADGES = ["First Scenario", "Market Thinker", "Risk Manager", "Crisis Solver", "Portfolio Builder"];
const LOCKED_INSIGHTS = ["Financial stability", "Inflation control", "Risk management"];
const XP_PER_LEVEL = 500;

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
}

function formatProgressDate(date?: string) {
  if (!date) return "Saved run";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Saved run";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

export function ProgressDashboard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [runs, setRuns] = useState<RunState[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");

  useEffect(() => {
    setProfile(getProfile());
    setRuns(loadRuns());
    setUserLevel(readStoredLevel());
  }, []);

  const completedRuns = runs.filter((run) => run.complete);
  const completedIds = completedRuns.map((run) => run.scenarioId);
  const nextScenario = getNextScenario(userLevel, completedIds, SCENARIOS);
  const nextScenarioProfile = getScenarioLearningProfile(nextScenario);
  const bestRun = [...completedRuns].sort((left, right) => right.score - left.score)[0];
  const bestBreakdown = bestRun ? buildPolicyScoreBreakdown(bestRun) : null;
  const latestRun = completedRuns[0];
  const weakAreas = latestRun ? inferWeakAreas(latestRun.current) : ["financial stability", "inflation control"];
  const uniqueCompletedScenarioCount = new Set(completedIds).size;
  const totalScenarioCount = SCENARIOS.length;
  const totalProgressPercent = totalScenarioCount ? Math.round((uniqueCompletedScenarioCount / totalScenarioCount) * 100) : 0;

  const levelProgress = useMemo(() => {
    return FINANCE_PROGRESSION_LEVELS.map((level) => {
      const total = SCENARIOS.filter((scenario) => getScenarioLearningProfile(scenario).level === level.id).length;
      const completed = new Set(
        completedRuns
          .filter((run) => {
            const scenario = SCENARIOS.find((item) => item.id === run.scenarioId);
            return scenario ? getScenarioLearningProfile(scenario).level === level.id : false;
          })
          .map((run) => run.scenarioId)
      ).size;
      return { ...level, total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
    });
  }, [completedRuns]);

  if (!profile) {
    return (
      <section className="progress-page">
        <div className="progress-content-band">
          <div className="shell">
            <div className="progress-loading-card">Loading your progress...</div>
          </div>
        </div>
      </section>
    );
  }

  const levelXp = Math.max(0, profile.xp - (profile.level - 1) * XP_PER_LEVEL);
  const nextLevelProgress = Math.min(100, Math.round((levelXp / XP_PER_LEVEL) * 100));
  const summaryCards = [
    {
      label: "Level",
      value: profile.level,
      text: profile.completedRuns ? "Keep completing scenarios to level up." : "Start your first scenario to level up."
    },
    {
      label: "XP",
      value: profile.xp,
      text: "Earn XP by completing simulations."
    },
    {
      label: "Completed",
      value: profile.completedRuns,
      text: "Your finished scenarios appear here."
    },
    {
      label: "Badges",
      value: profile.badges.length,
      text: "Unlock badges through learning milestones."
    }
  ];

  return (
    <section className="progress-page">
      <section className="progress-hero-band">
        <div className="shell progress-hero">
          <div className="progress-hero-copy">
            <p className="progress-eyebrow">Progress</p>
            <h1>Track your finance growth.</h1>
            <p>
              Follow your level, completed scenarios, badges, best scores, weak areas, and recommended next steps.
            </p>
            <div className="progress-hero-actions">
              <Link className="button primary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
                Continue Learning
              </Link>
              <Link className="button secondary" href="/play/setup" prefetch={false}>
                Start First Scenario
              </Link>
            </div>
          </div>

          <aside className="progress-profile-card">
            <p className="progress-eyebrow">Your profile</p>
            <div className="progress-profile-main">
              <span>Level</span>
              <strong>{profile.level}</strong>
            </div>
            <div className="progress-profile-stats" aria-label="Profile summary">
              <div>
                <span>XP</span>
                <strong>{profile.xp}</strong>
              </div>
              <div>
                <span>Completed</span>
                <strong>{profile.completedRuns}</strong>
              </div>
              <div>
                <span>Badges</span>
                <strong>{profile.badges.length}</strong>
              </div>
            </div>
            <div className="progress-level-meter">
              <div>
                <span>Progress to Level {profile.level + 1}</span>
                <strong>{levelXp} / {XP_PER_LEVEL} XP</strong>
              </div>
              <div className="progress-track" aria-label={`${nextLevelProgress}% to next level`}>
                <i style={{ width: `${nextLevelProgress}%` }} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="progress-content-band">
        <div className="shell progress-content">
          <section className="progress-stat-grid" aria-label="Progress summary">
            {summaryCards.map((card) => (
              <article className="progress-stat-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.text}</p>
              </article>
            ))}
          </section>

          <section className="progress-action-grid">
            <article className="continue-learning-card">
              <div className="continue-learning-copy">
                <p className="progress-eyebrow">Continue learning</p>
                <h2>{nextScenario.title}</h2>
                <p>{nextScenario.summary}</p>
                <div className="progress-chip-row">
                  {nextScenarioProfile.concepts.slice(0, 4).map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
              </div>
              <div className="continue-learning-side">
                <div className="next-step-meter">
                  <span>{nextScenarioProfile.track}</span>
                  <strong>{nextScenarioProfile.estimatedMinutes} min</strong>
                  <small>{nextScenarioProfile.difficulty}</small>
                </div>
                <Link className="button primary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
                  Continue Progression
                </Link>
              </div>
            </article>

            <article className={bestRun ? "score-insights-card unlocked" : "score-insights-card locked"}>
              <p className="progress-eyebrow">Score insights</p>
              {bestRun ? (
                <>
                  <h2>{bestBreakdown?.overall ?? Math.round(bestRun.score)}/100</h2>
                  <p>{bestRun.scenarioTitle} - {bestRun.rankTitle}</p>
                  <div className="locked-insight-list">
                    {weakAreas.map((area) => (
                      <div key={area} className="locked-insight-row unlocked">
                        <span>Improve {area}</span>
                        <strong>Unlocked</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2>Score insights locked</h2>
                  <p>Complete your first scenario to unlock score analysis.</p>
                  <div className="locked-insight-list">
                    {LOCKED_INSIGHTS.map((insight) => (
                      <div key={insight} className="locked-insight-row">
                        <span>{insight}</span>
                        <strong>Locked</strong>
                      </div>
                    ))}
                  </div>
                  <Link className="button primary" href="/play/setup" prefetch={false}>
                    Start scenario
                  </Link>
                </>
              )}
            </article>
          </section>

          <section className="progress-dashboard-section roadmap-section">
            <div className="progress-section-header">
              <div>
                <p className="progress-eyebrow">Knowledge roadmap</p>
                <h2>Finance and economics path</h2>
                <p>Complete scenarios across each level to build your finance reasoning step by step.</p>
              </div>
              <div className="overall-progress-card">
                <span>{uniqueCompletedScenarioCount} of {totalScenarioCount} scenarios completed</span>
                <strong>{totalProgressPercent}%</strong>
                <div className="progress-track" aria-label={`${totalProgressPercent}% complete`}>
                  <i style={{ width: `${totalProgressPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="learning-roadmap-grid">
              {levelProgress.map((level, index) => (
                <article key={level.id} className="roadmap-card">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{level.title}</strong>
                  <p>{level.completed} of {level.total} completed</p>
                  <div className="progress-track" aria-label={`${level.percent}% complete`}>
                    <i style={{ width: `${level.percent}%` }} />
                  </div>
                  <small>{level.percent}% complete</small>
                </article>
              ))}
            </div>
          </section>

          <section className="progress-dashboard-section achievements-section">
            <div className="progress-section-header">
              <div>
                <p className="progress-eyebrow">Achievements</p>
                <h2>Unlock badges by completing scenarios and improving your finance decisions.</h2>
              </div>
              <Link className="button secondary" href="/play/setup" prefetch={false}>
                Start First Scenario
              </Link>
            </div>
            <div className="badge-shelf">
              {profile.badges.length
                ? profile.badges.map((badge) => (
                    <span key={badge} className="badge-token earned">{badge}</span>
                  ))
                : LOCKED_BADGES.map((badge) => (
                    <span key={badge} className="badge-token locked">{badge}</span>
                  ))}
              {profile.badges.length
                ? LOCKED_BADGES.filter((badge) => !profile.badges.some((earnedBadge) => earnedBadge === badge)).slice(0, 5).map((badge) => (
                    <span key={badge} className="badge-token locked">{badge}</span>
                  ))
                : null}
            </div>
          </section>

          <section className="progress-dashboard-section activity-section">
            <div className="progress-section-header">
              <div>
                <p className="progress-eyebrow">Activity history</p>
                <h2>Your completed scenarios, scores, and saved runs will appear here.</h2>
              </div>
            </div>
            {completedRuns.length ? (
              <div className="activity-list">
                {completedRuns.map((run) => (
                  <article className="activity-row-card" key={run.runId}>
                    <div>
                      <strong>{run.scenarioTitle}</strong>
                      <span>{formatProgressDate(run.updatedAt)} - {run.learningMode}</span>
                    </div>
                    <div>
                      <span>Score</span>
                      <strong>{buildPolicyScoreBreakdown(run).overall}/100</strong>
                    </div>
                    <div>
                      <span>Result</span>
                      <strong>{run.rankTitle}</strong>
                    </div>
                    <Link className="text-link" href={`/play/results/${run.runId}`}>View result</Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="progress-empty-state">
                <h3>No completed scenarios yet.</h3>
                <p>Finish your first simulation to start building your learning history.</p>
                <Link className="button primary" href="/play/setup" prefetch={false}>
                  Start Learning
                </Link>
              </div>
            )}
          </section>
        </div>
      </section>
    </section>
  );
}
