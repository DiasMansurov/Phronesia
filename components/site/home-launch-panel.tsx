"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getActiveRunId, loadRuns } from "@/lib/game/storage";
import type { RunState } from "@/lib/game/types";

type HomeLaunchPanelProps = {
  daily: {
    label: string;
    objective: string;
  };
  weekly: {
    label: string;
    objective: string;
  };
};

export function HomeHeroActions() {
  return (
    <div className="cta-row">
      <Link className="button primary" href="/play/setup">
        Play free
      </Link>
      <Link className="button secondary" href="/teachers/classes">
        My Classes
      </Link>
      <Link className="text-link" href="/teachers">
        For teachers
      </Link>
    </div>
  );
}

export function HomeLaunchPanel({ daily, weekly }: HomeLaunchPanelProps) {
  const [recentRuns, setRecentRuns] = useState<RunState[]>([]);
  const [activeRun, setActiveRun] = useState<RunState | null>(null);

  useEffect(() => {
    const runs = loadRuns();
    const activeRunId = getActiveRunId();
    setRecentRuns(runs.slice(0, 3));
    setActiveRun(activeRunId ? runs.find((run) => run.runId === activeRunId) ?? null : null);
  }, []);

  return (
    <div className="launch-stack">
      <article className="launch-panel panel campaign-desk-panel" id="campaign-desk">
        <div className="scorecard-topline">
          <p className="eyebrow">{activeRun ? "Campaign Desk" : "Live Briefing"}</p>
          <span className={`mini-status ${activeRun ? "positive" : "mixed"}`}>
            {activeRun ? "Active run ready" : "Open now"}
          </span>
        </div>
        <h2>{activeRun ? activeRun.scenarioTitle : daily.label}</h2>
        <p className="muted">
          {activeRun
            ? "Continue your live run or open a new mandate from the setup flow."
            : daily.objective}
        </p>

        <div className="home-history-list">
          {recentRuns.length ? (
            recentRuns.map((run) => (
              <div key={run.runId} className="timeline-item stack-xs">
                <div className="stat-row">
                  <strong>{run.scenarioTitle}</strong>
                  <span>{run.complete ? "Complete" : "In progress"}</span>
                </div>
                <p className="muted small">
                  {new Date(run.updatedAt).toLocaleDateString()} · {run.rankTitle}
                </p>
              </div>
            ))
          ) : (
            <div className="timeline-item">
              No saved runs yet. Start with your preferred policy toolkit and the first crisis brief.
            </div>
          )}
        </div>

        <div className="launch-metric-strip">
          <div>
            <span className="score-label">Toolkits</span>
            <strong>4</strong>
          </div>
          <div>
            <span className="score-label">School cost</span>
            <strong>Free</strong>
          </div>
          <div>
            <span className="score-label">Start flow</span>
            <strong>2 steps</strong>
          </div>
        </div>

        <div className="cta-row">
          {activeRun ? (
            <Link className="button secondary" href={`/play?run=${activeRun.runId}`}>
              Continue active run
            </Link>
          ) : null}
          <Link className="button primary" href="/play/setup">
            Start a new run
          </Link>
        </div>
      </article>

      <article className="bulletin-panel">
        <p className="eyebrow">{activeRun ? "Today's Rotation" : "Teacher Bulletin"}</p>
        <h3>{activeRun ? daily.label : weekly.label}</h3>
        <p>
          {activeRun
            ? daily.objective
            : "Free for school use as a lesson starter, revision task, or debate prompt without adding setup friction to a normal class period."}
        </p>
        <Link className="text-link" href={activeRun ? "/rankings" : "/teachers/classes"}>
          {activeRun ? "View benchmark ladder" : "Open My Classes"}
        </Link>
      </article>
    </div>
  );
}
