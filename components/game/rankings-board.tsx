"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDailyChallenge, getWeeklyFeatured } from "@/lib/game/challenges";
import { getAllBenchmarks } from "@/lib/game/content";
import { buildPolicyScoreBreakdown, estimatePercentile, estimateScenarioRank } from "@/lib/game/curriculum";
import { whole } from "@/lib/game/format";
import { getProfile } from "@/lib/game/profile";
import { loadRuns } from "@/lib/game/storage";
import type { PlayerProfile, RunState } from "@/lib/game/types";

type GlobalRun = {
  run_id: string;
  scenario_id: string;
  scenario_title: string | null;
  difficulty_id: string | null;
  score: number;
  rank_title: string | null;
  victory: boolean | null;
  rounds_completed: number | null;
  avg_growth: number | null;
  avg_inflation: number | null;
  avg_unemployment: number | null;
  avg_approval: number | null;
  created_at?: string | null;
};

const leaderboardTypes = [
  {
    label: "Global",
    body: "Best Challenge Mode scores across all finance simulations."
  },
  {
    label: "Scenario",
    body: "Best standardized score inside each market, debt, bank, or crisis case."
  },
  {
    label: "Weekly",
    body: "One rotating scenario under identical conditions."
  },
  {
    label: "Beginner",
    body: "A fair ladder for students starting from financial basics."
  },
  {
    label: "Advanced",
    body: "Crisis and expert simulations for experienced players."
  },
  {
    label: "School / Country",
    body: "Class, school, and country competitions for teacher mode."
  }
];

const rankingSystemItems = [
  "Global leaderboard",
  "Weekly challenge",
  "Scenario ranking",
  "School / country comparison",
  "Personal best runs"
];

function formatRankDate(date?: string | null) {
  if (!date) return "n/a";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "n/a";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

export function RankingsBoard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [globalRuns, setGlobalRuns] = useState<GlobalRun[]>([]);
  const [localRuns, setLocalRuns] = useState<RunState[]>([]);

  useEffect(() => {
    setProfile(getProfile());
    setLocalRuns(loadRuns().filter((run) => run.complete));
    fetch("/api/runs", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setGlobalRuns(data.runs ?? []))
      .catch(() => setGlobalRuns([]));
  }, []);

  const historical = getAllBenchmarks().sort((a, b) => b.score - a.score);
  const benchmarkPreview = historical.slice(0, 6);

  const daily = getDailyChallenge();
  const weekly = getWeeklyFeatured();
  const hasPersonalResults = localRuns.length > 0 || Boolean(profile?.bestRuns.length);

  return (
    <section className="rankings-page">
      <section className="rankings-hero-band">
        <div className="shell rankings-hero">
          <div className="rankings-hero-copy">
            <p className="rankings-eyebrow">Rankings</p>
            <h1>Compare your financial decisions.</h1>
            <p>
              See how your challenge runs perform across scenarios, weekly rotations, and benchmark leaders.
            </p>
            <div className="rankings-hero-actions">
              <Link className="button primary" href="/play/setup" prefetch={false}>
                Play Challenge Mode
              </Link>
              <a className="button secondary" href="#your-ranking">
                View My Ranking
              </a>
            </div>
          </div>

          <aside className="ranking-system-card">
            <p className="rankings-eyebrow">Ranking system</p>
            <h2>How your score becomes a rank</h2>
            <ul>
              {rankingSystemItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="text-link" href="/play/setup" prefetch={false}>
              Start your first simulation
            </Link>
          </aside>
        </div>
      </section>

      <section className="rankings-content-band">
        <div className="shell rankings-content">
          <section className="rankings-section">
            <div className="rankings-section-header">
              <div>
                <p className="rankings-eyebrow">Active challenges</p>
                <h2>Complete rotating challenges to enter fair comparisons under the same conditions.</h2>
              </div>
            </div>
            <div className="active-challenge-grid">
              <article className="active-challenge-card">
                <span>Daily</span>
                <h3>{daily.label}</h3>
                <p>{daily.objective}</p>
                <Link className="button primary" href="/play/setup" prefetch={false}>
                  Start daily challenge
                </Link>
              </article>
              <article className="active-challenge-card">
                <span>Weekly</span>
                <h3>{weekly.label}</h3>
                <p>{weekly.objective}</p>
                <Link className="button primary" href="/play/setup" prefetch={false}>
                  Start weekly run
                </Link>
              </article>
            </div>
          </section>

          <section className="rankings-section leaderboard-system-section">
            <div className="rankings-section-header">
              <div>
                <p className="rankings-eyebrow">Choose a leaderboard</p>
                <h2>Rankings compare different kinds of runs, so beginners and advanced players both have meaningful competition.</h2>
              </div>
            </div>
            <div className="ranking-selector-grid">
              {leaderboardTypes.map((type, index) => (
                <article className={index === 0 ? "ranking-selector-card active" : "ranking-selector-card"} key={type.label}>
                  <span>{type.label}</span>
                  <p>{type.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rankings-section global-ranking-section">
            <div className="rankings-section-header split">
              <div>
                <p className="rankings-eyebrow">Global Challenge Ranking</p>
                <h2>Submitted runs from standardized finance play.</h2>
              </div>
              <span className="ranking-status-pill">Challenge Mode ready</span>
            </div>
            <div className="leaderboard-preview-shell">
              {globalRuns.length ? (
                <div className="ranking-table-wrap">
                  <table className="ranking-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Scenario</th>
                        <th>Difficulty</th>
                        <th>Score</th>
                        <th>Inflation</th>
                        <th>Unemp.</th>
                        <th>Approval</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalRuns.map((run, index) => (
                        <tr key={run.run_id}>
                          <td>{index + 1}</td>
                          <td>{run.scenario_title ?? run.scenario_id}</td>
                          <td>{run.difficulty_id ?? "standard"}</td>
                          <td>{whole.format(run.score)}</td>
                          <td>{typeof run.avg_inflation === "number" ? `${run.avg_inflation.toFixed(1)}%` : "n/a"}</td>
                          <td>{typeof run.avg_unemployment === "number" ? `${run.avg_unemployment.toFixed(1)}%` : "n/a"}</td>
                          <td>{typeof run.avg_approval === "number" ? whole.format(run.avg_approval) : "n/a"}</td>
                          <td>{formatRankDate(run.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ranking-empty-state global-empty">
                  <div className="leaderboard-skeleton" aria-hidden="true">
                    <div>
                      <span>Rank</span>
                      <span>Player</span>
                      <span>Scenario</span>
                      <span>Score</span>
                      <span>Stability</span>
                      <span>Date</span>
                    </div>
                    <div>
                      <span>--</span>
                      <span>Pending submissions</span>
                      <span>Challenge mode</span>
                      <span>--</span>
                      <span>--</span>
                      <span>--</span>
                    </div>
                  </div>
                  <div>
                    <h3>No global submissions yet.</h3>
                    <p>Challenge Mode results will appear here after online rankings are enabled. Local best runs still save in this browser.</p>
                  </div>
                  <Link className="button primary" href="/play/setup" prefetch={false}>
                    Play Challenge Mode
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="rankings-section personal-ranking-section" id="your-ranking">
            <div className="rankings-section-header">
              <div>
                <p className="rankings-eyebrow">Your ranking</p>
                <h2>Your saved runs will appear here after you complete a simulation.</h2>
              </div>
            </div>

            {hasPersonalResults ? (
              <div className="personal-ranking-grid">
                {localRuns.length ? (
                  <div className="personal-ranking-panel">
                    <div className="personal-panel-header">
                      <span>Scenario results</span>
                      <strong>{localRuns.length} saved</strong>
                    </div>
                    <div className="personal-result-list">
                      {localRuns.slice(0, 6).map((run) => {
                        const breakdown = buildPolicyScoreBreakdown(run);
                        const rank = estimateScenarioRank(breakdown.overall);
                        const percentile = estimatePercentile(breakdown.overall);
                        return (
                          <article key={run.runId} className="personal-result-card">
                            <div>
                              <span>{breakdown.overall}/100</span>
                              <small>Top {100 - percentile}%</small>
                            </div>
                            <h3>{run.scenarioTitle}</h3>
                            <p>You ranked #{rank} out of 3,420 presidents.</p>
                            <Link className="text-link" href={`/play/results/${run.runId}`}>
                              Open result
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {profile?.bestRuns.length ? (
                  <div className="personal-ranking-panel">
                    <div className="personal-panel-header">
                      <span>Local best runs</span>
                      <strong>{profile.bestRuns.length} best</strong>
                    </div>
                    <div className="ranking-table-wrap compact">
                      <table className="ranking-table">
                        <thead>
                          <tr>
                            <th>Scenario</th>
                            <th>Difficulty</th>
                            <th>Rank Title</th>
                            <th>Score</th>
                            <th>Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.bestRuns.map((run) => (
                            <tr key={run.runId}>
                              <td>{run.scenarioTitle}</td>
                              <td>{run.difficultyId}</td>
                              <td>{run.rankTitle}</td>
                              <td>{whole.format(run.score)}</td>
                              <td>{formatRankDate(run.completedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="ranking-empty-state personal-empty">
                <h3>No completed runs saved yet.</h3>
                <p>Complete a scenario to unlock your personal ranking and improvement history.</p>
                <Link className="button primary" href="/play/setup" prefetch={false}>
                  Start First Simulation
                </Link>
              </div>
            )}
          </section>

          <section className="rankings-section benchmark-section">
            <div className="rankings-section-header">
              <div>
                <p className="rankings-eyebrow">Benchmark leaders</p>
                <h2>Compare your simulation style with country-specific historical leaders used as reference points.</h2>
              </div>
            </div>
            <div className="benchmark-preview-list">
              {benchmarkPreview.map((entry, index) => (
                <article className="benchmark-row-card" key={`${entry.country}-${entry.name}`}>
                  <span>Rank {index + 1}</span>
                  <strong>{entry.name}</strong>
                  <p>{entry.country}</p>
                  <small>{entry.officeLabel}</small>
                  <b>{whole.format(entry.score)}</b>
                </article>
              ))}
            </div>
            <details className="benchmark-details">
              <summary>View all benchmark leaders</summary>
              <div className="ranking-table-wrap">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Country</th>
                      <th>Leader</th>
                      <th>Role</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historical.map((entry, index) => (
                      <tr key={`${entry.country}-${entry.name}`}>
                        <td>{index + 1}</td>
                        <td>{entry.country}</td>
                        <td>{entry.name}</td>
                        <td>{entry.officeLabel}</td>
                        <td>{whole.format(entry.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </div>
      </section>
    </section>
  );
}
