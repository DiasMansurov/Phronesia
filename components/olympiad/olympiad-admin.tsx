"use client";

import { useMemo, useState } from "react";

type Attempt = {
  id: string;
  olympiadSlug: string;
  olympiadTitle: string;
  teamName: string;
  participantLogin: string;
  runId: string;
  scenarioTitle: string;
  status: "active" | "completed";
  finalScore: number | null;
  rankTitle: string | null;
  victory: boolean | null;
  summary: string | null;
  roundsCompleted: number | null;
  updatedAt: string;
  scoreBreakdown: { overall?: number; categories?: Array<{ label: string; score: number }> } | null;
};

type Decision = {
  id: string;
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: Record<string, unknown>;
  policySummary: string | null;
  citizenSummary: string | null;
  scoreAfter: number | null;
};

type AdminResponse = {
  ok?: boolean;
  persisted?: boolean;
  reason?: string;
  error?: string;
  attempts?: Attempt[];
  decisions?: Decision[];
};

export function OlympiadAdmin() {
  const [adminCode, setAdminCode] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const completed = attempts.filter((attempt) => attempt.status === "completed");
  const topAttempt = [...completed].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))[0];
  const decisionsByRun = useMemo(() => {
    const map = new Map<string, Decision[]>();
    for (const decision of decisions) {
      const current = map.get(decision.runId) ?? [];
      current.push(decision);
      map.set(decision.runId, current);
    }
    return map;
  }, [decisions]);

  async function loadDashboard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("Loading olympiad dashboard...");
    try {
      const response = await fetch("/api/olympiads/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminCode })
      });
      const data = (await response.json()) as AdminResponse;
      if (!response.ok) throw new Error(data.error ?? "Unable to open admin dashboard.");
      setAttempts(data.attempts ?? []);
      setDecisions(data.decisions ?? []);
      setStatus(
        data.persisted
          ? "Dashboard loaded."
          : "Dashboard opened, but Supabase persistence is not configured yet."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to open admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact olympiad-hero">
        <div className="stack-sm">
          <p className="eyebrow">Olympiad Admin</p>
          <h1 className="display compact">Monitor teams, decisions, and rankings.</h1>
          <p className="lede compact-lede">
            Enter the admin access code to see team attempts, final scores, rank titles, summaries, and every saved policy decision.
          </p>
        </div>
        <form className="panel stack-md olympiad-login-card" onSubmit={loadDashboard}>
          <p className="eyebrow">Admin access</p>
          <label className="stack-xs">
            <span>Admin code</span>
            <input
              value={adminCode}
              onChange={(event) => setAdminCode(event.target.value)}
              placeholder="Set OLYMPIAD_ADMIN_CODE in Vercel"
              type="password"
            />
          </label>
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Open Dashboard"}
          </button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </div>

      <section className="stats-grid compact-stats olympiad-admin-stats">
        <div className="stat-card"><span>Teams</span><strong>{attempts.length}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{completed.length}</strong></div>
        <div className="stat-card"><span>Decisions</span><strong>{decisions.length}</strong></div>
        <div className="stat-card"><span>Leader</span><strong>{topAttempt?.teamName ?? "n/a"}</strong></div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Overall ranking</p>
            <h2>Teams by final score</h2>
          </div>
        </div>
        {attempts.length ? (
          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Rank title</th>
                  <th>Rounds</th>
                </tr>
              </thead>
              <tbody>
                {[...attempts]
                  .sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1))
                  .map((attempt, index) => (
                    <tr key={attempt.id}>
                      <td>{attempt.finalScore === null ? "-" : index + 1}</td>
                      <td>{attempt.teamName}</td>
                      <td>{attempt.scenarioTitle}</td>
                      <td>{attempt.status}</td>
                      <td>{attempt.finalScore ?? "in progress"}</td>
                      <td>{attempt.rankTitle ?? "n/a"}</td>
                      <td>{attempt.roundsCompleted ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No olympiad attempts loaded yet.</p>
          </div>
        )}
      </section>

      {attempts.map((attempt) => (
        <details key={attempt.id} className="panel olympiad-attempt-detail">
          <summary>
            <span>{attempt.teamName}</span>
            <strong>{attempt.finalScore ?? "in progress"} · {attempt.rankTitle ?? attempt.status}</strong>
          </summary>
          <div className="stack-md olympiad-detail-body">
            <p className="muted">{attempt.summary ?? "No final summary yet."}</p>
            {attempt.scoreBreakdown?.categories?.length ? (
              <div className="score-category-grid">
                {attempt.scoreBreakdown.categories.map((category) => (
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
              {(decisionsByRun.get(attempt.runId) ?? []).map((decision) => (
                <details key={decision.id} className="goal-item olympiad-decision-detail">
                  <summary>
                    Round {decision.round} · Year {decision.year} · Score {decision.scoreAfter ?? "n/a"}
                  </summary>
                  <p className="muted">{decision.policySummary ?? "Prediction saved before outcome."}</p>
                  {decision.citizenSummary ? <p className="muted">{decision.citizenSummary}</p> : null}
                  <pre>{JSON.stringify(decision.policies, null, 2)}</pre>
                </details>
              ))}
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}
