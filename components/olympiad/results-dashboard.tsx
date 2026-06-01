"use client";

import { useMemo, useState } from "react";

type Olympiad = {
  slug: string;
  title: string;
  partner: string;
  status: string;
  scenarioId: string;
};

type Attempt = {
  id: string;
  olympiadSlug: string;
  olympiadTitle: string;
  participantLogin: string;
  teamName: string;
  runId: string;
  scenarioTitle: string;
  status: "active" | "completed";
  finalScore: number | null;
  rankTitle: string | null;
  victory: boolean | null;
  summary: string | null;
  roundsCompleted: number | null;
  updatedAt: string;
  scoreBreakdown: unknown;
};

type Decision = {
  id: string;
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: unknown;
  policySummary: string | null;
  citizenSummary: string | null;
  scoreAfter: number | null;
};

export type ResultsInitialData = {
  persisted: boolean;
  reason?: string;
  loadError?: string;
  olympiads: Olympiad[];
  attempts: Attempt[];
  decisions: Decision[];
};

type OlympiadSummary = Olympiad & {
  attempts: Attempt[];
  teamCount: number;
  completedCount: number;
  topScore: number | null;
  leader: string | null;
  latestAt: string | null;
};

type TeamSummary = {
  key: string;
  teamName: string;
  participantLogin: string;
  attempts: Attempt[];
  bestAttempt: Attempt | null;
  bestScore: number | null;
  completedCount: number;
  latestAt: string | null;
};

type ScoreCategory = {
  label: string;
  score: number;
};

function scoreValue(attempt: Attempt | null | undefined) {
  return typeof attempt?.finalScore === "number" ? attempt.finalScore : null;
}

function compareScoreDesc(a: number | null, b: number | null) {
  return (b ?? -1) - (a ?? -1);
}

function timeValue(value: string | null | undefined) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : 0;
}

function formatDate(value: string | null | undefined) {
  const time = timeValue(value);
  if (!time) return "not saved yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}

function teamKey(attempt: Attempt) {
  return `${attempt.olympiadSlug}:${attempt.participantLogin}:${attempt.teamName}`.toLowerCase();
}

function getScoreCategories(scoreBreakdown: unknown): ScoreCategory[] {
  if (!scoreBreakdown || typeof scoreBreakdown !== "object") return [];
  const categories = (scoreBreakdown as { categories?: unknown }).categories;
  if (!Array.isArray(categories)) return [];

  return categories
    .map((category) => {
      if (!category || typeof category !== "object") return null;
      const label = (category as { label?: unknown }).label;
      const score = (category as { score?: unknown }).score;
      if (typeof label !== "string" || typeof score !== "number") return null;
      return { label, score: Math.max(0, Math.min(100, Math.round(score))) };
    })
    .filter((category): category is ScoreCategory => Boolean(category));
}

export function ResultsDashboard({ initialData }: { initialData: ResultsInitialData }) {
  const [selectedOlympiadSlug, setSelectedOlympiadSlug] = useState<string | null>(null);
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);

  const decisionsByRun = useMemo(() => {
    const map = new Map<string, Decision[]>();
    for (const decision of initialData.decisions) {
      const current = map.get(decision.runId) ?? [];
      current.push(decision);
      current.sort((a, b) => a.round - b.round);
      map.set(decision.runId, current);
    }
    return map;
  }, [initialData.decisions]);

  const olympiadSummaries = useMemo<OlympiadSummary[]>(() => {
    const configs = new Map(initialData.olympiads.map((olympiad) => [olympiad.slug, olympiad]));
    const slugs = new Set([...initialData.olympiads.map((olympiad) => olympiad.slug)]);
    for (const attempt of initialData.attempts) slugs.add(attempt.olympiadSlug);

    return [...slugs]
      .map((slug) => {
        const attempts = initialData.attempts.filter((attempt) => attempt.olympiadSlug === slug);
        const config = configs.get(slug);
        const fallback = attempts[0];
        const bestAttempt = [...attempts].sort((a, b) => compareScoreDesc(scoreValue(a), scoreValue(b)))[0] ?? null;
        const teams = new Set(attempts.map(teamKey));

        return {
          slug,
          title: config?.title ?? fallback?.olympiadTitle ?? slug,
          partner: config?.partner ?? fallback?.participantLogin ?? "Competition",
          status: config?.status ?? "active",
          scenarioId: config?.scenarioId ?? fallback?.scenarioTitle ?? "scenario",
          attempts,
          teamCount: teams.size,
          completedCount: attempts.filter((attempt) => attempt.status === "completed").length,
          topScore: scoreValue(bestAttempt),
          leader: scoreValue(bestAttempt) === null ? null : bestAttempt?.teamName ?? null,
          latestAt:
            [...attempts].sort((a, b) => timeValue(b.updatedAt) - timeValue(a.updatedAt))[0]?.updatedAt ?? null
        };
      })
      .sort((a, b) => timeValue(b.latestAt) - timeValue(a.latestAt) || a.title.localeCompare(b.title));
  }, [initialData.attempts, initialData.olympiads]);

  const selectedOlympiad = olympiadSummaries.find((olympiad) => olympiad.slug === selectedOlympiadSlug) ?? null;

  const teams = useMemo<TeamSummary[]>(() => {
    if (!selectedOlympiad) return [];
    const map = new Map<string, Attempt[]>();
    for (const attempt of selectedOlympiad.attempts) {
      const key = teamKey(attempt);
      map.set(key, [...(map.get(key) ?? []), attempt]);
    }

    return [...map.entries()]
      .map(([key, attempts]) => {
        const sortedAttempts = [...attempts].sort((a, b) => {
          const scoreSort = compareScoreDesc(scoreValue(a), scoreValue(b));
          return scoreSort || timeValue(b.updatedAt) - timeValue(a.updatedAt);
        });
        const bestAttempt = sortedAttempts[0] ?? null;

        return {
          key,
          teamName: bestAttempt?.teamName ?? "Unnamed team",
          participantLogin: bestAttempt?.participantLogin ?? selectedOlympiad.title,
          attempts: sortedAttempts,
          bestAttempt,
          bestScore: scoreValue(bestAttempt),
          completedCount: attempts.filter((attempt) => attempt.status === "completed").length,
          latestAt: [...attempts].sort((a, b) => timeValue(b.updatedAt) - timeValue(a.updatedAt))[0]?.updatedAt ?? null
        };
      })
      .sort((a, b) => compareScoreDesc(a.bestScore, b.bestScore) || a.teamName.localeCompare(b.teamName));
  }, [selectedOlympiad]);

  const selectedTeam = teams.find((team) => team.key === selectedTeamKey) ?? null;
  const completedAttempts = initialData.attempts.filter((attempt) => attempt.status === "completed");
  const topAttempt =
    [...initialData.attempts].sort((a, b) => compareScoreDesc(scoreValue(a), scoreValue(b))).find((attempt) => scoreValue(attempt) !== null) ??
    null;

  function openOlympiad(slug: string) {
    setSelectedOlympiadSlug(slug);
    setSelectedTeamKey(null);
  }

  function backToOlympiads() {
    setSelectedOlympiadSlug(null);
    setSelectedTeamKey(null);
  }

  function backToTeams() {
    setSelectedTeamKey(null);
  }

  const statusText = initialData.persisted
    ? "Choose a competition folder to inspect rankings and team decisions."
    : initialData.loadError ?? "Results opened, but Supabase persistence is not configured yet.";

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact results-hero">
        <div className="stack-sm">
          <p className="eyebrow">Organizer Results</p>
          <h1 className="display compact">Results</h1>
          <p className="lede compact-lede">
            Open a competition folder, review its team ranking, then inspect any team attempt and decision.
          </p>
        </div>
        <div className="panel stack-md olympiad-login-card">
          <p className="eyebrow">Live overview</p>
          <div className="stat-row">
            <span>Status</span>
            <strong>Ready</strong>
          </div>
          <p className="muted small">{statusText}</p>
          <button className="button secondary" type="button" onClick={() => window.location.reload()}>
            Refresh Results
          </button>
        </div>
      </div>

      <section className="stats-grid compact-stats olympiad-admin-stats">
        <div className="stat-card"><span>Competitions</span><strong>{olympiadSummaries.length}</strong></div>
        <div className="stat-card"><span>Teams</span><strong>{new Set(initialData.attempts.map(teamKey)).size}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{completedAttempts.length}</strong></div>
        <div className="stat-card"><span>Leader</span><strong>{topAttempt?.teamName ?? "n/a"}</strong></div>
      </section>

      {!selectedOlympiad ? (
        <section className="panel stack-md results-workspace">
          <div className="section-header">
            <div>
              <p className="eyebrow">Competitions</p>
              <h2>Choose a competition folder.</h2>
            </div>
          </div>
          {olympiadSummaries.length ? (
            <div className="results-folder-grid">
              {olympiadSummaries.map((olympiad) => (
                <button
                  className="result-folder-card"
                  key={olympiad.slug}
                  type="button"
                  onClick={() => openOlympiad(olympiad.slug)}
                >
                  <span className="result-folder-mark">Competition</span>
                  <strong>{olympiad.partner}</strong>
                  <span>{olympiad.title}</span>
                  <div className="result-card-metrics">
                    <span>{olympiad.teamCount} teams</span>
                    <span>{olympiad.completedCount} completed</span>
                    <span>Top {olympiad.topScore ?? "n/a"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No competitions are configured yet.</p>
            </div>
          )}
        </section>
      ) : !selectedTeam ? (
        <section className="panel stack-md results-workspace">
          <div className="results-breadcrumb">
            <button type="button" onClick={backToOlympiads}>Competitions</button>
            <span>/</span>
            <strong>{selectedOlympiad.partner}</strong>
          </div>
          <div className="section-header">
            <div>
              <p className="eyebrow">Team Ranking</p>
              <h2>{selectedOlympiad.title}</h2>
              <p className="muted">Teams are sorted from the highest score to the lowest score.</p>
            </div>
          </div>
          {teams.length ? (
            <div className="result-team-list">
              {teams.map((team, index) => (
                <button
                  className="result-team-row"
                  key={team.key}
                  type="button"
                  onClick={() => setSelectedTeamKey(team.key)}
                >
                  <span className="result-rank">#{index + 1}</span>
                  <span className="result-team-copy">
                    <strong>{team.teamName}</strong>
                    <small>{team.participantLogin} · {team.attempts.length} attempt{team.attempts.length === 1 ? "" : "s"}</small>
                  </span>
                  <span className="result-team-meta">
                    <strong>{team.bestScore ?? "in progress"}</strong>
                    <small>{team.bestAttempt?.rankTitle ?? "Open details"}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No teams have started this competition yet.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="panel stack-md results-workspace">
          <div className="results-breadcrumb">
            <button type="button" onClick={backToOlympiads}>Competitions</button>
            <span>/</span>
            <button type="button" onClick={backToTeams}>{selectedOlympiad.partner}</button>
            <span>/</span>
            <strong>{selectedTeam.teamName}</strong>
          </div>
          <div className="section-header">
            <div>
              <p className="eyebrow">Team Details</p>
              <h2>{selectedTeam.teamName}</h2>
              <p className="muted">
                Best score {selectedTeam.bestScore ?? "in progress"} · {selectedTeam.attempts.length} saved attempt{selectedTeam.attempts.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="stack-md">
            {selectedTeam.attempts.map((attempt, attemptIndex) => {
              const categories = getScoreCategories(attempt.scoreBreakdown);
              const attemptDecisions = decisionsByRun.get(attempt.runId) ?? [];

              return (
                <article key={attempt.id} className="result-attempt-card stack-md">
                  <div className="result-attempt-head">
                    <div>
                      <p className="eyebrow">Attempt {attemptIndex + 1}</p>
                      <h3>{attempt.scenarioTitle}</h3>
                      <p className="muted small">Updated {formatDate(attempt.updatedAt)}</p>
                    </div>
                    <div className="result-attempt-score">
                      <strong>{attempt.finalScore ?? "in progress"}</strong>
                      <span>{attempt.rankTitle ?? attempt.status}</span>
                    </div>
                  </div>
                  {attempt.summary ? <p className="muted">{attempt.summary}</p> : null}
                  {categories.length ? (
                    <div className="score-category-grid">
                      {categories.map((category) => (
                        <article key={category.label} className="score-category-card">
                          <div className="stat-row">
                            <span>{category.label}</span>
                            <strong>{category.score}/100</strong>
                          </div>
                          <div className="progress-meter"><i style={{ width: `${category.score}%` }} /></div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  <div className="goal-list compact-list">
                    {attemptDecisions.length ? (
                      attemptDecisions.map((decision) => (
                        <details key={decision.id} className="goal-item olympiad-decision-detail">
                          <summary>
                            Round {decision.round} · Year {decision.year} · Score {decision.scoreAfter ?? "n/a"}
                          </summary>
                          <p className="muted">{decision.policySummary ?? "Prediction saved before outcome."}</p>
                          {decision.citizenSummary ? <p className="muted">{decision.citizenSummary}</p> : null}
                          <pre>{JSON.stringify(decision.policies, null, 2)}</pre>
                        </details>
                      ))
                    ) : (
                      <div className="goal-item">No saved policy decisions yet.</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
