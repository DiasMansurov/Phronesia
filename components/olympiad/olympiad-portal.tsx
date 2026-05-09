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
    <section className="shell section stack-lg">
      <div className="hero-band compact olympiad-hero">
        <div className="stack-sm">
          <p className="eyebrow">Olympiad Portal</p>
          <h1 className="display compact">Enter the competition case.</h1>
          <p className="lede compact-lede">
            Teams use the official olympiad login, enter a team name, and play the assigned finance simulation under the same conditions.
          </p>
        </div>
        <form className="panel olympiad-login-card stack-md" onSubmit={onSubmit}>
          <div className="stack-xs">
            <p className="eyebrow">Team access</p>
            <h2>Login to olympiad</h2>
          </div>
          <label className="stack-xs">
            <span>Olympiad login</span>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Qazfinance"
            />
          </label>
          <label className="stack-xs">
            <span>Team name</span>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Team Alpha"
            />
          </label>
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Opening..." : "Open Competition Case"}
          </button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </div>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>One login, one case, one ranking.</h2>
          </div>
        </div>
        <div className="finance-lab-grid">
          {[
            ["1. Login", "Enter the code from the olympiad organizer and your team name."],
            ["2. Read the case", "The assigned scenario appears with the same rules for every team."],
            ["3. Simulate", "Choose policies, submit predictions, and complete the crisis."],
            ["4. Ranking", "The organizer Results page stores scores and decisions for review."]
          ].map(([title, body]) => (
            <article key={title} className="goal-item">
              <strong>{title}</strong>
              <p className="muted small">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
