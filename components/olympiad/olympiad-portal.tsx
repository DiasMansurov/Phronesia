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
    title: "Register your team",
    body: "Submit your team information through the official registration process."
  },
  {
    number: "02",
    title: "Build a virtual portfolio",
    body: "Use the platform to make investment decisions with virtual capital."
  },
  {
    number: "03",
    title: "Analyze your strategy",
    body: "Explain your investment thesis, risk, diversification, and market reasoning."
  },
  {
    number: "04",
    title: "Compete for ranking",
    body: "Teams are compared under the same conditions, and top performers advance to the final stage."
  }
];

const heroFacts = [
  { label: "Prize fund", value: "2.5M KZT" },
  { label: "Dates", value: "June 22 - July 10" },
  { label: "Format", value: "Online" },
  { label: "Team size", value: "2-5 students" }
];

const competitionFacts = [
  { label: "Prize fund", value: "2.5M KZT" },
  { label: "Format", value: "Online" },
  { label: "Dates", value: "June 22 - July 10" },
  { label: "Participants", value: "Grades 8-12 and first-year students" },
  { label: "Team size", value: "2-5 students" },
  { label: "Focus", value: "Stocks, portfolio strategy, market analysis" }
];

const teamActivities = [
  "Build a virtual stock portfolio",
  "Analyze companies and market conditions",
  "Manage risk and diversification",
  "Prepare an investment thesis",
  "Compete on ranking and final results"
];

const partners = ["Teenvestor", "QOS Education", "Phronesia"];

const resultOutputs = [
  "Final score",
  "Selected decisions",
  "Prediction accuracy",
  "Portfolio / stability indicators",
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
          <h1>Teenvestor Investment Olympiad</h1>
          <p>
            An international finance and investment competition where student teams build virtual portfolios, analyze
            companies, and compete through Phronesia's simulation platform.
          </p>
          <div className="olympiad-hero-actions" aria-label="Olympiad portal actions">
            <a className="button secondary" href="#competition-at-a-glance">
              View Details
            </a>
            <a className="button primary" href="#team-access">
              Enter Competition Case
            </a>
          </div>
          <div className="olympiad-hero-facts" aria-label="Teenvestor Investment Olympiad facts">
            {heroFacts.map((fact) => (
              <div key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="olympiad-portal-content-band">
        <div className="shell olympiad-portal-content">
          <section className="olympiad-dashboard-section" id="competition-at-a-glance">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">Key facts</p>
              <h2>Competition at a glance</h2>
              <p>Official facts for students, parents, sponsors, and organizers.</p>
            </div>
            <div className="olympiad-facts-grid">
              {competitionFacts.map((fact) => (
                <article className="olympiad-fact-card" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="olympiad-dashboard-section" id="how-it-works">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">Process</p>
              <h2>How it works</h2>
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
              <p className="olympiad-portal-eyebrow">Competition tasks</p>
              <h2>What teams will do</h2>
              <p>Teams work with the same competition conditions and explain their reasoning.</p>
            </div>
            <div className="olympiad-activity-grid">
              {teamActivities.map((activity) => (
                <article className="olympiad-activity-card" key={activity}>
                  <span aria-hidden="true" />
                  <strong>{activity}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="olympiad-info-split">
            <article className="olympiad-info-card">
              <p className="olympiad-portal-eyebrow">Eligibility</p>
              <h2>Who can participate</h2>
              <p>
                Students from grades 8-12 and first-year university students can participate in teams of 2-5 people.
                The competition is international and held online.
              </p>
            </article>

            <article className="olympiad-info-card olympiad-partner-card">
              <p className="olympiad-portal-eyebrow">Partners</p>
              <h2>Supported by</h2>
              <div className="olympiad-partner-list" aria-label="Competition partners">
                {partners.map((partner) => (
                  <span key={partner}>{partner}</span>
                ))}
              </div>
            </article>
          </section>

          <section className="olympiad-access-section" id="team-access">
            <div className="olympiad-section-header centered">
              <p className="olympiad-portal-eyebrow">Team Access</p>
              <h2>Already registered?</h2>
              <p>Enter your olympiad login and team name to open the assigned competition case.</p>
            </div>

            <form className="olympiad-access-panel" onSubmit={onSubmit}>
              <div className="olympiad-access-panel-header">
                <p className="olympiad-portal-eyebrow">Team Access</p>
                <h3>Official entry</h3>
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
                  <li>Use the code provided by the organizer.</li>
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

          <section className="olympiad-dashboard-section olympiad-completion-section">
            <div className="olympiad-section-header">
              <p className="olympiad-portal-eyebrow">Results</p>
              <h2>After completion</h2>
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
