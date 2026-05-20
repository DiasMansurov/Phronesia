"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvestmentAccessForm() {
  const router = useRouter();
  const [code, setCode] = useState("Teenvestor.school");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Checking competition code...");
    try {
      const response = await fetch("/api/investment/competitions/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        redirectTo?: string;
        competition?: { welcomeMessage?: string | null; name?: string };
      };

      if (!response.ok || !data.ok) {
        setStatus(data.reason ?? "Competition code was not found.");
        return;
      }

      setStatus(data.competition?.welcomeMessage ?? `Welcome to ${data.competition?.name ?? "the investment competition"}.`);
      router.push(data.redirectTo ?? "/investment-challenge/app");
      router.refresh();
    } catch {
      setStatus("Competition access is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel stack-md investment-access-card" onSubmit={submit}>
      <div className="stack-sm">
        <p className="eyebrow">Student competition access</p>
        <h2>Enter your competition code</h2>
        <p className="muted">
          Market prices, portfolios, trading tools, and live competition results are shown only after sign-in or a valid
          student competition code.
        </p>
      </div>
      <label className="form-field">
        <span>Competition code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Teenvestor.school" required />
      </label>
      <div className="cta-row">
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Checking..." : "Join protected area"}
        </button>
        <Link className="button secondary" href="/sign-in">
          Sign in
        </Link>
      </div>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
