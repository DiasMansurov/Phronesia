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
  const [createTeamName, setCreateTeamName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginTeamName, setLoginTeamName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busyAction, setBusyAction] = useState<"code" | "create" | "login" | null>(null);

  async function checkCompetition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = competitionCode.trim();
    setCompetition(null);
    if (!code) {
      setStatus("Competition code is required.");
      return;
    }

    setBusyAction("code");
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
      setBusyAction(null);
    }
  }

  async function submitTeam(mode: "create" | "login", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!competition) {
      setStatus("Enter a valid competition code first.");
      return;
    }
    const teamName = mode === "create" ? createTeamName : loginTeamName;
    const password = mode === "create" ? createPassword : loginPassword;
    if (!teamName.trim()) {
      setStatus("Team name is required.");
      return;
    }
    if (!password) {
      setStatus("Team password is required.");
      return;
    }
    if (mode === "create" && password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setBusyAction(mode);
    setStatus(mode === "create" ? "Creating team portfolio..." : "Opening team portfolio...");
    try {
      const response = await fetch("/api/investment/teams/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionCode: competition.code,
          teamName,
          password,
          confirmPassword: mode === "create" ? confirmPassword : undefined,
          mode
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
      setBusyAction(null);
    }
  }

  return (
    <section className="investment-join-flow">
      <aside className="investment-join-rail" aria-label="Investment access steps">
        <p className="eyebrow">Access flow</p>
        <div className={`investment-join-step ${competition ? "complete" : "active"}`}>
          <span>01</span>
          <div>
            <strong>Verify competition</strong>
            <small>Use the code from your organizer.</small>
          </div>
        </div>
        <div className={`investment-join-step ${competition ? "active" : ""}`}>
          <span>02</span>
          <div>
            <strong>Choose team action</strong>
            <small>Create a new team or log in to an existing portfolio.</small>
          </div>
        </div>
        <div className="investment-join-step">
          <span>03</span>
          <div>
            <strong>Open simulation</strong>
            <small>Prices and trading tools stay protected.</small>
          </div>
        </div>
      </aside>

      <div className="investment-join-forms">
        <form className="investment-access-card stack-md" onSubmit={checkCompetition}>
          <div className="investment-card-header">
            <span>Step 1</span>
            <h2>Enter competition code</h2>
            <p>
              Type the code exactly as your organizer gave it to you. Nothing is pre-filled, and market data stays
              hidden until your team is inside the protected area.
            </p>
          </div>
          <label className="form-field investment-field">
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
          <button className="button primary" type="submit" disabled={Boolean(busyAction)}>
            {busyAction === "code" ? "Checking..." : "Check competition code"}
          </button>
        </form>

        <div className="investment-access-card stack-md">
          <div className="investment-card-header">
            <span>Step 2</span>
            <h2>Choose how to enter</h2>
            {competition ? (
              <div className={`competition-mini-card ${competition.isTeenvestor ? "teenvestor" : ""}`}>
                <strong>{competition.welcomeMessage ?? `Welcome to ${competition.name}.`}</strong>
                <span>Starting cash: {formatUsd(competition.startingCash)}</span>
                <span>Status: {competition.runtimeStatus === "active" ? "Active" : competition.runtimeStatus}</span>
              </div>
            ) : (
              <p>After the code is verified, choose whether you are creating a new team or returning to an existing one.</p>
            )}
          </div>

          <div className="investment-team-action-grid">
            <form className="investment-team-action-card" onSubmit={(event) => submitTeam("create", event)}>
              <div className="investment-team-action-header">
                <span>Create Team</span>
                <h3>Create new team</h3>
                <p>Only create a new team if your team has not registered before. Existing teams should use Log In.</p>
              </div>
              <label className="form-field investment-field">
                <span>Team name</span>
                <input
                  value={createTeamName}
                  onChange={(event) => setCreateTeamName(event.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
              <label className="form-field investment-field">
                <span>Team password</span>
                <input
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="form-field investment-field">
                <span>Confirm team password</span>
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="button primary" type="submit" disabled={Boolean(busyAction) || !competition}>
                {busyAction === "create" ? "Creating..." : "Create team"}
              </button>
            </form>

            <form className="investment-team-action-card" onSubmit={(event) => submitTeam("login", event)}>
              <div className="investment-team-action-header">
                <span>Log In</span>
                <h3>Log in to existing team</h3>
                <p>Use this if your team has already registered. A typo will not create a duplicate team.</p>
              </div>
              <label className="form-field investment-field">
                <span>Team name</span>
                <input
                  value={loginTeamName}
                  onChange={(event) => setLoginTeamName(event.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
              <label className="form-field investment-field">
                <span>Team password</span>
                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="button secondary" type="submit" disabled={Boolean(busyAction) || !competition}>
                {busyAction === "login" ? "Opening..." : "Log in to team portfolio"}
              </button>
            </form>
          </div>

          <div className="investment-form-actions">
            <Link className="button secondary" href="/investment-challenge/rules">
              Read rules first
            </Link>
          </div>
        </div>
      </div>

      {status ? <p className="investment-status-card">{status}</p> : null}
    </section>
  );
}
