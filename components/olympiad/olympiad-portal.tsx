"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveOlympiadSession } from "@/lib/olympiad-storage";

type ResolveResponse = {
  ok?: boolean;
  error?: string;
  olympiad?: {
    slug: string;
    title: string;
    accessCode: string;
    scenarioId: string;
  };
};

const olympiadSteps = [
  {
    number: "01",
    title: "Login",
    body: "Enter the code from the olympiad organizer and your team name."
  },
  {
    number: "02",
    title: "Read the case",
    body: "The assigned scenario appears with the same rules for every team."
  },
  {
    number: "03",
    title: "Simulate",
    body: "Choose policies, submit predictions, and complete the crisis."
  },
  {
    number: "04",
    title: "Ranking",
    body: "The organizer results page stores scores and decisions for review."
  }
];

const judgingCriteria = [
  {
    title: "Financial stability",
    body: "Can your team avoid crisis, defaults, and market panic?"
  },
  {
    title: "Inflation control",
    body: "Can your team keep prices under control without damaging growth?"
  },
  {
    title: "Household welfare",
    body: "Can your decisions protect citizens from debt, unemployment, and falling purchasing power?"
  },
  {
    title: "Risk management",
    body: "Can your team balance debt, confidence, reserves, and long-term stability?"
  },
  {
    title: "Prediction accuracy",
    body: "Can your team explain what will happen before the indicators move?"
  }
];

const resultOutputs = [
  "Final score",
  "Selected decisions",
  "Prediction accuracy",
  "Stability indicators",
  "Team ranking position"
];

export function OlympiadPortal() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [teamName, setTeamName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanLogin = login.trim();
    const cleanTeam = teamName.trim();
    if (!cleanLogin || !cleanTeam) {
      setStatus("Enter the olympiad login and your team name.");
      return;
    }

    setLoading(true);
    setStatus("Checking olympiad login...");
    try {
      const response = await fetch("/api/olympiads/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: cleanLogin })
      });
      const data = (await response.json()) as ResolveResponse;
      if (!response.ok || !data.olympiad) {
        throw new Error(data.error ?? "Olympiad login was not found.");
      }

      saveOlympiadSession({
        slug: data.olympiad.slug,
        title: data.olympiad.title,
        accessCode: data.olympiad.accessCode,
        participantLogin: cleanLogin,
        teamName: cleanTeam,
        scenarioId: data.olympiad.scenarioId,
        createdAt: new Date().toISOString()
      });
      router.push(`/olympiad/${data.olympiad.slug}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to open olympiad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="olympiad-portal-page">
      <section className="olympiad-portal-hero-band">
        <div className="shell olympiad-portal-hero">
          <p className="olympiad-portal-eyebrow">Olympiad Portal</p>
          <h1>Enter the competition case.</h1>
          <p>
            Teams use the official olympiad login, enter a team name, and play the assigned finance simulation under the same conditions.
          </p>
          <div className="olympiad-hero-actions" aria-label="Olympiad portal actions">
            <a className="button primary" href="#team-access">
              Open Competition Case
            </a>
            <a className="button secondary" href="#how-it-works">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="olympiad-portal-content-band">
        <div className="shell olympiad-portal-content">
          <section className="olympiad-access-section" id="team-access">
            <div className="olympiad-section-header centered">
              <p className="olympiad-portal-eyebrow">Team Access</p>
              <h2>Unlock the assigned competition case.</h2>
              <p>Enter your olympiad code and team name to unlock the assigned competition case.</p>
            </div>

            <form className="olympiad-access-panel" onSubmit={onSubmit}>
              <div className="olympiad-access-panel-header">
                <p className="olympiad-portal-eyebrow">Official Entry</p>
                <h3>Team Access</h3>
              </div>

              <div className="olympiad-form-grid">
                <label className="olympiad-field">
                  <span>Olympiad login</span>
                  <input
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    placeholder="Qazfinance"
                  />
                </label>
                <label className="olympiad-field">
                  <span>Team name</span>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Team Alpha"
                  />
                </label>
              </div>

              <div className="olympiad-access-helper">
                <span>Before you start</span>
                <ul>
                  <li>Use the code given by the organizer.</li>
                  <li>Enter your team name exactly.</li>
                  <li>Results are saved after completion.</li>
                </ul>
              </div>

              <button className="button primary" type="submit" disabled={loading}>
                {loading ? "Opening..." : "Open Competition Case"}
              </button>
              {status ? <p className="olympiad-form-status">{status}</p> : null}
            </form>
          </section>

          <section className="olympiad-dashboard-section" id="how-it-works">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">How it works</p>
              <h2>One login, one case, one ranking.</h2>
            </div>
            <div className="olympiad-timeline">
              {olympiadSteps.map((step) => (
                <article className="olympiad-step-card" key={step.title}>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="olympiad-dashboard-section">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">Judging</p>
              <h2>What teams are judged on</h2>
              <p>The competition rewards balanced decisions, not just one high score.</p>
            </div>
            <div className="olympiad-criteria-grid">
              {judgingCriteria.map((criterion) => (
                <article className="olympiad-criterion-card" key={criterion.title}>
                  <h3>{criterion.title}</h3>
                  <p>{criterion.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="olympiad-dashboard-section olympiad-completion-section">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">After completion</p>
              <h2>Results are saved for review.</h2>
              <p>Your submitted result helps the organizer compare teams under the same conditions.</p>
            </div>
            <div className="olympiad-completion-card">
              <div className="olympiad-output-list" aria-label="Olympiad result outputs">
                {resultOutputs.map((output) => (
                  <span key={output}>{output}</span>
                ))}
              </div>
              <a className="button primary" href="#team-access">
                Open Competition Case
              </a>
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
