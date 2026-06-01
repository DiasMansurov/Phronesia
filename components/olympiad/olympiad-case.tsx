"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createRun } from "@/lib/game/engine";
import { saveRun, setActiveRunId } from "@/lib/game/storage";
import { getOlympiadScenario, type OlympiadConfig } from "@/lib/olympiads";
import { loadOlympiadSession, saveOlympiadRunContext } from "@/lib/olympiad-storage";

export function OlympiadCase({ olympiad }: { olympiad: OlympiadConfig }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [participantLogin, setParticipantLogin] = useState("");
  const [status, setStatus] = useState("");
  const scenario = getOlympiadScenario(olympiad);

  useEffect(() => {
    const session = loadOlympiadSession();
    if (session?.slug === olympiad.slug) {
      setTeamName(session.teamName);
      setParticipantLogin(session.participantLogin);
      return;
    }
    setStatus("Login first to attach your team name to the competition attempt.");
  }, [olympiad.slug]);

  async function startOlympiadRun() {
    const session = loadOlympiadSession();
    if (!session || session.slug !== olympiad.slug) {
      router.push("/olympiad");
      return;
    }

    const run = createRun(olympiad.scenarioId, olympiad.difficultyId, {
      policyComplexity: olympiad.policyComplexity,
      learningMode: olympiad.learningMode
    });
    saveRun(run);
    setActiveRunId(run.runId);
    saveOlympiadRunContext({
      ...session,
      runId: run.runId
    });

    void fetch("/api/olympiads/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        olympiadSlug: olympiad.slug,
        olympiadTitle: olympiad.title,
        accessCode: olympiad.accessCode,
        participantLogin: session.participantLogin,
        teamName: session.teamName,
        runId: run.runId,
        scenarioId: run.scenarioId,
        scenarioTitle: run.scenarioTitle,
        difficultyId: run.difficultyId,
        status: "active"
      })
    }).catch(() => null);

    router.push(`/play?run=${run.runId}&olympiad=${olympiad.slug}`);
  }

  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact olympiad-hero">
        <div className="stack-sm">
          <p className="eyebrow">{olympiad.partner}</p>
          <h1 className="display compact">{olympiad.title}</h1>
          <p className="lede compact-lede">{olympiad.briefing}</p>
          <div className="pill-row">
            <span className="pill">{scenario.title}</span>
            <span className="pill">{olympiad.learningMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
            <span className="pill">{olympiad.difficultyId}</span>
          </div>
        </div>
        <div className="panel stack-sm olympiad-team-card">
          <p className="eyebrow">Team</p>
          <h2>{teamName || "Not logged in"}</h2>
          <p className="muted small">{participantLogin || "Open the competition page and enter your official login."}</p>
          {teamName ? (
            <button className="button primary" onClick={startOlympiadRun} type="button">
              Start Official Attempt
            </button>
          ) : (
            <Link className="button primary" href="/olympiad">
              Login To Competition
            </Link>
          )}
          {status ? <p className="muted small">{status}</p> : null}
        </div>
      </div>

      <section className="grid two">
        <article className="panel stack-md">
          <div>
            <p className="eyebrow">Case</p>
            <h2>{scenario.title}</h2>
            <p className="muted">{scenario.summary}</p>
          </div>
          <div className="goal-list compact-list">
            {scenario.goals.map((goal) => (
              <div key={goal.label} className="goal-item">{goal.label}</div>
            ))}
          </div>
        </article>
        <article className="panel stack-md">
          <div>
            <p className="eyebrow">Rules</p>
            <h2>Same conditions for every team.</h2>
          </div>
          <div className="goal-list compact-list">
            {olympiad.rules.map((rule) => (
              <div key={rule} className="goal-item">{rule}</div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
