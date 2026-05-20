"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { INVESTMENT_ACCOUNT_STORAGE_KEY, formatUsd } from "@/lib/investment-challenge";
import type { InvestmentAccountView, InvestmentCompetitionView } from "@/lib/server-investments";

export function InvestmentTeamJoin() {
  const router = useRouter();
  const [competitionCode, setCompetitionCode] = useState("");
  const [competition, setCompetition] = useState<InvestmentCompetitionView | null>(null);
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkCompetition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = competitionCode.trim();
    setCompetition(null);
    if (!code) {
      setStatus("Competition code is required.");
      return;
    }

    setBusy(true);
    setStatus("Checking competition code...");
    try {
      const response = await fetch(`/api/investment/competitions/resolve?code=${encodeURIComponent(code)}`, {
        cache: "no-store"
      });
      const data = (await response.json()) as { ok?: boolean; competition?: InvestmentCompetitionView; reason?: string };
      if (!response.ok || !data.competition) {
        setStatus(data.reason ?? "Competition not found.");
        return;
      }
      setCompetition(data.competition);
      setStatus(data.competition.welcomeMessage ?? `Welcome to ${data.competition.name}.`);
    } catch {
      setStatus("Competition lookup is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function enterTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!competition) {
      setStatus("Enter a valid competition code first.");
      return;
    }
    if (!teamName.trim()) {
      setStatus("Team name is required.");
      return;
    }
    if (!password) {
      setStatus("Team password is required.");
      return;
    }

    setBusy(true);
    setStatus("Opening team portfolio...");
    try {
      const response = await fetch("/api/investment/teams/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionCode: competition.code,
          teamName,
          password
        })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        redirectTo?: string;
        account?: InvestmentAccountView | null;
      };
      if (!response.ok || !data.ok || !data.account) {
        setStatus(data.reason ?? "Could not enter team portfolio.");
        return;
      }
      window.localStorage.setItem(INVESTMENT_ACCOUNT_STORAGE_KEY, data.account.account.id);
      setStatus(data.message ?? "Welcome back to your team portfolio.");
      router.push(data.redirectTo ?? "/investment-challenge/app");
      router.refresh();
    } catch {
      setStatus("Team access is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid two align-start">
      <form className="panel stack-md investment-access-card" onSubmit={checkCompetition}>
        <div className="stack-sm">
          <p className="eyebrow">Step 1</p>
          <h2>Enter competition code</h2>
          <p className="muted">
            Type the code exactly as your organizer gave it to you. Nothing is pre-filled, and market data stays hidden
            until your team is inside the protected area.
          </p>
        </div>
        <label className="form-field">
          <span>Competition code</span>
          <input
            value={competitionCode}
            onChange={(event) => {
              setCompetitionCode(event.target.value);
              setCompetition(null);
            }}
            placeholder="Enter competition code"
            autoComplete="off"
            required
          />
        </label>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Checking..." : "Check competition code"}
        </button>
      </form>

      <form className="panel stack-md investment-access-card" onSubmit={enterTeam}>
        <div className="stack-sm">
          <p className="eyebrow">Step 2</p>
          <h2>Create or enter team portfolio</h2>
          {competition ? (
            <div className={`competition-mini-card ${competition.isTeenvestor ? "teenvestor" : ""}`}>
              <strong>{competition.welcomeMessage ?? `Welcome to ${competition.name}.`}</strong>
              <span>Starting cash: {formatUsd(competition.startingCash)}</span>
              <span>Status: {competition.runtimeStatus === "active" ? "Active" : competition.runtimeStatus}</span>
            </div>
          ) : (
            <p className="muted">After the code is verified, enter your team name and team password.</p>
          )}
        </div>
        <label className="form-field">
          <span>Team name</span>
          <input value={teamName} onChange={(event) => setTeamName(event.target.value)} autoComplete="organization" required />
        </label>
        <label className="form-field">
          <span>Team password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button className="button primary" type="submit" disabled={busy || !competition}>
          {busy ? "Opening..." : "Create or enter team portfolio"}
        </button>
        <Link className="button secondary" href="/investment-challenge/rules">
          Read rules first
        </Link>
      </form>

      {status ? <p className="form-status investment-status full-span">{status}</p> : null}
    </section>
  );
}
