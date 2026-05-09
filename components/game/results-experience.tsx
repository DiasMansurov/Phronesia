"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { getScenario, SCENARIOS } from "@/lib/game/content";
import {
  buildPolicyScoreBreakdown,
  estimatePercentile,
  estimateScenarioRank,
  getNextScenario
} from "@/lib/game/curriculum";
import { buildBenchmarkPlacement, compareToBenchmarks } from "@/lib/game/engine";
import { pct, whole } from "@/lib/game/format";
import { improvementFocus, investorView } from "@/lib/game/learning";
import { getRun, loadRuns } from "@/lib/game/storage";
import type { RunState } from "@/lib/game/types";

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function optionalAverage(values: Array<number | undefined>) {
  const known = values.filter((value): value is number => typeof value === "number");
  return average(known);
}

function strongestEntry(run: RunState) {
  return run.history.slice(1).sort((a, b) => b.score - a.score)[0] ?? run.history[0];
}

function weakestEntry(run: RunState) {
  return run.history.slice(1).sort((a, b) => a.score - b.score)[0] ?? run.history[0];
}

export function ResultsExperience() {
  const params = useParams<{ runId: string }>();
  const [run, setRun] = useState<RunState | null>(null);
  const [allRuns, setAllRuns] = useState<RunState[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const runId = params.runId;
    const found = getRun(runId);
    if (!found) {
      setStatus("We couldn't find that run in local storage.");
      return;
    }
    setRun(found);
    setAllRuns(loadRuns());
    track("page_view", { page: "/play/results", runId });
  }, [params.runId]);

  async function copySummary() {
    if (!run) return;
    const scenario = getScenario(run.scenarioId);
    const compare = compareToBenchmarks(run.score, scenario.country);
    const text = [
      `Phronesia Policy Score: ${run.scenarioTitle} | ${run.rankTitle}`,
      `Score: ${buildPolicyScoreBreakdown(run).overall}/100`,
      `Average growth: ${pct(average(run.history.map((item) => item.growth)))}`,
      `Average inflation: ${pct(average(run.history.map((item) => item.inflation)))}`,
      `Average unemployment: ${pct(average(run.history.map((item) => item.unemployment)))}`,
      `Closest benchmark leader: ${compare.nearest}`,
      `Summary: ${run.summary ?? "No summary available."}`
    ].join("\n");

    await navigator.clipboard.writeText(text);
    track("result_shared", { runId: run.runId, method: "clipboard" });
    setStatus("Result summary copied.");
  }

  if (!run) {
    return (
      <section className="shell section">
        <div className="panel stack-md">
          <h1>Result not found</h1>
          <p className="muted">{status}</p>
          <Link className="button primary" href="/play/setup">
            Start A New Run
          </Link>
        </div>
      </section>
    );
  }

  const avgGrowth = average(run.history.map((item) => item.growth));
  const avgInflation = average(run.history.map((item) => item.inflation));
  const avgUnemployment = average(run.history.map((item) => item.unemployment));
  const avgApproval = average(run.history.map((item) => item.approval));
  const avgDebt = optionalAverage(run.history.map((item) => item.debtRatio));
  const avgBondYield = optionalAverage(run.history.map((item) => item.sovereignYield));
  const avgEquityMarket = optionalAverage(run.history.map((item) => item.equityMarket));
  const avgBankingStress = optionalAverage(run.history.map((item) => item.bankingStress));
  const scenario = getScenario(run.scenarioId);
  const scoreBreakdown = buildPolicyScoreBreakdown(run);
  const scenarioRank = estimateScenarioRank(scoreBreakdown.overall);
  const percentile = estimatePercentile(scoreBreakdown.overall);
  const previousAttempts = allRuns
    .filter((item) => item.scenarioId === run.scenarioId && item.runId !== run.runId && item.complete)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const previousAttempt = previousAttempts[0];
  const bestAttempt = [run, ...previousAttempts].sort((a, b) => buildPolicyScoreBreakdown(b).overall - buildPolicyScoreBreakdown(a).overall)[0];
  const previousScore = previousAttempt ? buildPolicyScoreBreakdown(previousAttempt).overall : null;
  const improvement = previousScore ? scoreBreakdown.overall - previousScore : null;
  const storedLevel = typeof window !== "undefined" ? window.localStorage.getItem("phronesia.userLevel") : null;
  const nextScenario = getNextScenario(
    storedLevel === "basic" || storedLevel === "intermediate" || storedLevel === "advanced" ? storedLevel : "beginner",
    allRuns.filter((item) => item.complete).map((item) => item.scenarioId),
    SCENARIOS
  );
  const placement = buildBenchmarkPlacement({
    name: "YOU",
    score: run.score
  }, scenario.country);
  const comparison = compareToBenchmarks(run.score, scenario.country);
  const playerRank = placement.find((entry) => entry.isPlayer)?.rank ?? 1;
  const abovePlayer = placement[playerRank - 2];
  const belowPlayer = placement[playerRank];
  const strongest = strongestEntry(run);
  const weakest = weakestEntry(run);
  const lastTheory = [...run.history].reverse().find((entry) => entry.briefing?.theoryCard)?.briefing?.theoryCard;
  const investorNotes = investorView(run.current);

  return (
    <section className="shell section stack-md">
      <div className="hero-band compact compact-hero">
        <div className="stack-sm">
          <p className="eyebrow">Your Policy Score</p>
          <h1 className="display compact">{scoreBreakdown.overall}/100 · {run.rankTitle}</h1>
          <p className="lede compact-lede">{run.summary}</p>
          <div className="pill-row">
            <span className="pill">{run.scenarioTitle}</span>
            <span className="pill">{run.learningMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
            <span className="pill">Top {100 - percentile}% of presidents</span>
            <span className="pill">Rank #{scenarioRank} of 3,420</span>
          </div>
        </div>
        <div className="panel stack-sm compact-panel">
          <div className="score-burst">
            <span>Overall score</span>
            <strong>{scoreBreakdown.overall}</strong>
          </div>
          <p className="muted small">
            {improvement !== null
              ? `Your score ${improvement >= 0 ? "improved" : "fell"} by ${Math.abs(improvement)} points compared with your previous attempt.`
              : "This is your first completed attempt for this scenario."}
          </p>
          <button className="button primary" onClick={copySummary} type="button">
            Copy Share Summary
          </button>
          {status ? <p className="muted small">{status}</p> : null}
        </div>
      </div>

      <section className="panel stack-md compact-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Score breakdown</p>
            <h2>How effective was your finance policy?</h2>
            <p className="muted">
              Your score rewards balanced financial stability, market confidence, inflation control, debt sustainability,
              household welfare, growth, risk management, and long-term sustainability.
            </p>
          </div>
        </div>
        <div className="score-category-grid">
          {scoreBreakdown.categories.map((category) => (
            <article key={category.label} className="score-category-card">
              <div className="stat-row">
                <span>{category.label}</span>
                <strong>{category.score}/100</strong>
              </div>
              <div className="progress-meter">
                <i style={{ width: `${category.score}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid two">
        <section className="panel stack-sm compact-panel">
          <p className="eyebrow">Economic Outcome</p>
          <div className="stats-grid compact-stats">
            <div className="stat-card"><span>Growth</span><strong>{pct(avgGrowth)}</strong></div>
            <div className="stat-card"><span>Inflation</span><strong>{pct(avgInflation)}</strong></div>
            <div className="stat-card"><span>Unemployment</span><strong>{pct(avgUnemployment)}</strong></div>
            <div className="stat-card"><span>Debt / GDP</span><strong>{pct(avgDebt)}</strong></div>
            <div className="stat-card"><span>Approval</span><strong>{pct(avgApproval)}</strong></div>
          </div>
        </section>

        <section className="panel stack-sm compact-panel">
          <p className="eyebrow">Financial Markets</p>
          <div className="stats-grid compact-stats">
            <div className="stat-card"><span>Bond yield</span><strong>{pct(avgBondYield)}</strong></div>
            <div className="stat-card"><span>Equity market</span><strong>{whole.format(avgEquityMarket)}</strong></div>
            <div className="stat-card"><span>Banking stress</span><strong>{whole.format(avgBankingStress)}</strong></div>
            <div className="stat-card"><span>Currency</span><strong>{whole.format(run.current.currencyIndex)}</strong></div>
          </div>
        </section>
      </div>

      <section className="policy-brief-grid">
        <article className="panel compact-panel stack-sm">
          <p className="eyebrow">Strongest Decision</p>
          <h2>Year {strongest.year}</h2>
          <p className="muted">{strongest.note}</p>
        </article>
        <article className="panel compact-panel stack-sm">
          <p className="eyebrow">Weakest Decision</p>
          <h2>Year {weakest.year}</h2>
          <p className="muted">{weakest.note}</p>
        </article>
        <article className="panel compact-panel stack-sm">
          <p className="eyebrow">Theory That Explains It</p>
          <h2>{lastTheory?.title ?? "Trade-offs decided the run"}</h2>
          <p className="muted">{lastTheory?.explanation ?? "Your outcome was shaped by the balance between demand, inflation, confidence, and fiscal credibility."}</p>
          <span className="pill">{lastTheory?.keyConcept ?? "policy trade-offs"}</span>
        </article>
        <article className="panel compact-panel stack-sm">
          <p className="eyebrow">Improve Next Time</p>
          <h2>Focus on how to {improvementFocus(run.current)}.</h2>
          <div className="goal-list compact-list">
            {investorNotes.map((note) => (
              <div key={note} className="goal-item">{note}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack-sm compact-panel">
        <p className="eyebrow">Placement</p>
        <h2>You ranked #{scenarioRank} out of 3,420 presidents in this scenario.</h2>
        <p className="muted">
          {`That places you in the top ${100 - percentile}% of players. `}
          {abovePlayer && belowPlayer
            ? `Your score slots between ${abovePlayer.name} above you and ${belowPlayer.name} below you.`
            : abovePlayer
              ? `Only ${abovePlayer.name} finished above this run on the benchmark ladder.`
              : belowPlayer
                ? `You finished above ${belowPlayer.name} and every benchmark below them.`
                : "This run stands alone on the current benchmark board."}
        </p>
        <div className="goal-list compact-list">
          {run.goalsAchieved.length
            ? run.goalsAchieved.map((goal) => <div key={goal} className="goal-item complete">{goal}</div>)
            : <div className="goal-item">No scenario goals cleared this time.</div>}
        </div>
      </section>

      <section className="panel stack-md compact-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Next step</p>
            <h2>{nextScenario.title}</h2>
            <p className="muted">
              Your next recommended challenge helps you improve {improvementFocus(run.current)} while expanding your finance toolkit.
            </p>
          </div>
          <Link className="button secondary" href={`/play/setup?scenario=${nextScenario.id}`} prefetch={false}>
            Start Next Scenario
          </Link>
        </div>
        <div className="goal-list compact-list">
          <div className="goal-item">
            <strong>Best attempt:</strong> {bestAttempt ? `${buildPolicyScoreBreakdown(bestAttempt).overall}/100 on ${bestAttempt.scenarioTitle}` : "No best attempt yet."}
          </div>
          <div className="goal-item">
            <strong>Previous attempt:</strong> {previousAttempt ? `${previousScore}/100` : "None yet."}
          </div>
        </div>
      </section>

      <section className="panel stack-sm compact-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Benchmark Comparison</p>
            <h2>Where this run lands against {scenario.country}&apos;s benchmark leaders</h2>
          </div>
          <Link className="button secondary" href="/rankings">
            Open Full Rankings
          </Link>
        </div>
        <div className="table-wrap compact-table-wrap">
          <table className="record-table compact-record-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Leader</th>
                <th>Role</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {placement.map((entry) => (
                <tr key={entry.name} className={entry.isPlayer ? "highlight-row" : ""}>
                  <td>{entry.rank}</td>
                  <td>{entry.name}</td>
                  <td>{entry.officeLabel}</td>
                  <td>{whole.format(entry.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="cta-row">
        <Link className="button primary" href="/play/setup">
          Start Another Simulation
        </Link>
        <Link className="button secondary" href="/progress">
          View Progress
        </Link>
      </div>
    </section>
  );
}
