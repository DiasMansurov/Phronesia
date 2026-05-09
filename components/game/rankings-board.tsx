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

  const daily = getDailyChallenge();
  const weekly = getWeeklyFeatured();
  const leaderboardTypes = [
    ["Global ranking", "Best Challenge Mode scores across all finance simulations."],
    ["Scenario ranking", "Best standardized score inside each market, debt, bank, or crisis case."],
    ["Weekly challenge ranking", "One rotating scenario under identical conditions."],
    ["Beginner ranking", "A fair ladder for students starting from financial basics."],
    ["Advanced ranking", "Crisis and expert simulations for experienced players."],
    ["School and country ranking", "Class, school, and country competitions for teacher mode."]
  ];

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Rankings</p>
          <h1 className="display compact">Compare your finance decisions with other presidents.</h1>
          <p className="lede">
            Rankings reward balanced financial stability, market confidence, inflation control, debt sustainability,
            household welfare, risk management, and long-term thinking. Learning Mode is for practice; Challenge Mode is for fair comparison.
          </p>
        </div>
        <div className="panel stack-sm">
          <p className="eyebrow">Live Rotations</p>
          <div className="stack-xs">
            <strong>{daily.label}</strong>
            <span className="muted small">{daily.objective}</span>
          </div>
          <div className="stack-xs">
            <strong>{weekly.label}</strong>
            <span className="muted small">{weekly.objective}</span>
          </div>
        </div>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Leaderboard System</p>
            <h2>Multiple rankings, not one generic score table.</h2>
            <p className="muted">
              Phronesia compares presidents by scenario, skill level, weekly challenge, school, and country so beginners and experts both have meaningful competition.
            </p>
          </div>
        </div>
        <div className="leaderboard-type-grid">
          {leaderboardTypes.map(([title, body]) => (
            <article key={title} className="goal-item">
              <strong>{title}</strong>
              <p className="muted small">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Global Challenge Ranking</p>
            <h2>Submitted runs from standardized finance play.</h2>
          </div>
          <span className="pill">Challenge Mode ready</span>
        </div>
        {globalRuns.length ? (
          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Scenario</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Inflation</th>
                  <th>Unemp.</th>
                  <th>Approval</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>Global submissions will appear here after Supabase is configured. Local best runs still save in this browser.</p>
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Play Challenge Mode
            </Link>
          </div>
        )}
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Your president ranking</p>
            <h2>Local scenario results saved in this browser</h2>
          </div>
        </div>
        {localRuns.length ? (
          <div className="scenario-grid">
            {localRuns.slice(0, 6).map((run) => {
              const breakdown = buildPolicyScoreBreakdown(run);
              const rank = estimateScenarioRank(breakdown.overall);
              const percentile = estimatePercentile(breakdown.overall);
              return (
                <article key={run.runId} className="scenario-card finance-scenario-card">
                  <div className="card-topline">
                    <span className="pill">{breakdown.overall}/100</span>
                    <span className="mini-status open">Top {100 - percentile}%</span>
                  </div>
                  <h3>{run.scenarioTitle}</h3>
                  <p className="muted">You ranked #{rank} out of 3,420 presidents.</p>
                  <Link className="text-link" href={`/play/results/${run.runId}`}>Open result</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Complete a scenario to see your president ranking and improvement history.</p>
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start First Simulation
            </Link>
          </div>
        )}
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Benchmark Ladder</p>
            <h2>Country-specific leaders the simulation uses for comparison</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table">
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
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Local Best Runs</p>
            <h2>Your profile&apos;s saved leaderboard</h2>
          </div>
        </div>
        {profile?.bestRuns.length ? (
          <div className="table-wrap">
            <table className="record-table">
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
                    <td>{new Date(run.completedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No completed runs saved yet.</p>
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start Your First Simulation
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
