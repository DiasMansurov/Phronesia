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

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
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
  const bestRun = [...completedRuns].sort((left, right) => right.score - left.score)[0];
  const bestBreakdown = bestRun ? buildPolicyScoreBreakdown(bestRun) : null;
  const latestRun = completedRuns[0];
  const weakAreas = latestRun ? inferWeakAreas(latestRun.current) : ["financial stability", "inflation control"];

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
      <section className="shell section">
        <div className="panel">Loading your progress...</div>
      </section>
    );
  }

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact market-page-hero">
        <div className="stack-sm">
          <p className="eyebrow">Progress</p>
          <h1 className="display compact">Your finance learning dashboard.</h1>
          <p className="lede compact-lede">
            Track completed scenarios, knowledge progress, achievements, best scores, weak areas, and recommended next steps.
          </p>
        </div>
        <div className="panel compact-panel stack-sm">
          <p className="eyebrow">Profile</p>
          <div className="score-burst">
            <span>Level</span>
            <strong>{profile.level}</strong>
          </div>
          <div className="stat-row"><span>XP</span><strong>{profile.xp}</strong></div>
          <div className="stat-row"><span>Completed</span><strong>{profile.completedRuns}</strong></div>
          <div className="stat-row"><span>Badges</span><strong>{profile.badges.length}</strong></div>
        </div>
      </div>

      <section className="progress-overview-grid">
        <article className="panel stack-md">
          <div>
            <p className="eyebrow">Next recommended step</p>
            <h2>{nextScenario.title}</h2>
            <p className="muted">{nextScenario.summary}</p>
          </div>
          <div className="pill-row">
            {getScenarioLearningProfile(nextScenario).concepts.slice(0, 4).map((concept) => (
              <span key={concept} className="pill">{concept}</span>
            ))}
          </div>
          <Link className="button primary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
            Continue Progression
          </Link>
        </article>

        <article className="panel stack-md">
          <div>
            <p className="eyebrow">Best policy score</p>
            <h2>{bestRun ? `${bestBreakdown?.overall ?? Math.round(bestRun.score)}/100` : "No score yet"}</h2>
            <p className="muted">
              {bestRun ? `${bestRun.scenarioTitle} · ${bestRun.rankTitle}` : "Complete your first scenario to unlock score analysis."}
            </p>
          </div>
          <div className="goal-list compact-list">
            {weakAreas.map((area) => (
              <div key={area} className="goal-item">Improve {area}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Knowledge progress</p>
            <h2>Finance and economics path</h2>
          </div>
        </div>
        <div className="finance-progression-grid">
          {levelProgress.map((level) => (
            <article key={level.id} className="progression-card">
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <p>{level.completed} of {level.total} scenarios completed</p>
              <div className="progress-meter" aria-label={`${level.percent}% complete`}>
                <i style={{ width: `${level.percent}%` }} />
              </div>
              <small>{level.percent}% complete</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Achievements</p>
            <h2>Badges earned</h2>
          </div>
        </div>
        {profile.badges.length ? (
          <div className="badge-grid">
            {profile.badges.map((badge) => (
              <span key={badge} className="achievement-badge">{badge}</span>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Finish a Learning Mode scenario to unlock your first finance badge.</p>
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start First Scenario
            </Link>
          </div>
        )}
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Completed scenarios</p>
            <h2>Your saved runs</h2>
          </div>
        </div>
        {completedRuns.length ? (
          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {completedRuns.map((run) => (
                  <tr key={run.runId}>
                    <td>{run.scenarioTitle}</td>
                    <td>{run.learningMode}</td>
                    <td>{buildPolicyScoreBreakdown(run).overall}/100</td>
                    <td>{run.rankTitle}</td>
                    <td>
                      <Link className="text-link" href={`/play/results/${run.runId}`}>Result</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No completed scenarios yet.</p>
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start Learning
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
