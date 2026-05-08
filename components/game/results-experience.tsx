"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { getScenario } from "@/lib/game/content";
import { buildBenchmarkPlacement, compareToBenchmarks } from "@/lib/game/engine";
import { pct, whole } from "@/lib/game/format";
import { improvementFocus, investorView } from "@/lib/game/learning";
import { getRun } from "@/lib/game/storage";
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
  const [status, setStatus] = useState("");

  useEffect(() => {
    const runId = params.runId;
    const found = getRun(runId);
    if (!found) {
      setStatus("We couldn't find that run in local storage.");
      return;
    }
    setRun(found);
    track("page_view", { page: "/play/results", runId });
  }, [params.runId]);

  async function copySummary() {
    if (!run) return;
    const scenario = getScenario(run.scenarioId);
    const compare = compareToBenchmarks(run.score, scenario.country);
    const text = [
      `Policy Brief: ${run.scenarioTitle} | ${run.rankTitle}`,
      `Score: ${whole.format(run.score)}`,
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
          <p className="eyebrow">Policy Brief</p>
          <h1 className="display compact">{run.rankTitle}</h1>
          <p className="lede compact-lede">{run.summary}</p>
          <div className="pill-row">
            <span className="pill">{run.scenarioTitle}</span>
            <span className="pill">{run.learningMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
            <span className="pill">Historic rank #{playerRank}</span>
            <span className="pill">Closest benchmark: {comparison.nearest}</span>
          </div>
        </div>
        <div className="panel stack-sm compact-panel">
          <div className="score-burst">
            <span>Final Score</span>
            <strong>{whole.format(run.score)}</strong>
          </div>
          <button className="button primary" onClick={copySummary} type="button">
            Copy Share Summary
          </button>
          {status ? <p className="muted small">{status}</p> : null}
        </div>
      </div>

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
        <h2>You landed at rank #{playerRank}</h2>
        <p className="muted">
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
          Start Another Mandate
        </Link>
        <Link className="button secondary" href="/teachers">
          Explore Teacher Guide
        </Link>
      </div>
    </section>
  );
}
