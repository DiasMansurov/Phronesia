"use client";

import Link from "next/link";
import { useState } from "react";

import { track } from "@/lib/analytics";
import { saveLead } from "@/lib/game/storage";
import type { LeadCapture } from "@/lib/game/types";

type InterestFormProps = {
  type: LeadCapture["type"];
  title: string;
  subtitle: string;
  buttonLabel: string;
};

export function InterestForm({ type, title, subtitle, buttonLabel }: InterestFormProps) {
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [note, setNote] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setStatus("Name and email are required.");
      return;
    }

    const lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type,
      name,
      email,
      organization,
      note
    };

    saveLead(lead);

    track(type === "teacher" ? "teacher_interest" : "challenge_interest", {
      name,
      email,
      organization
    });

    void fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lead)
    }).catch(() => null);

    setStatus(
      type === "teacher"
        ? "Thanks. Your classroom feedback has been recorded."
        : "Thanks. Your interest has been recorded."
    );
    setName("");
    setEmail("");
    setOrganization("");
    setNote("");
  }

  return (
    <form className="interest-form panel" onSubmit={onSubmit}>
      <div className="stack-sm">
        <p className="eyebrow">{type === "teacher" ? "Teacher Feedback" : "Interest Form"}</p>
        <h3>{title}</h3>
        <p className="muted">{subtitle}</p>
      </div>
      <label className="form-field">
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" />
      </label>
      <label className="form-field">
        <span>Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="alex@example.com"
        />
      </label>
      <label className="form-field">
        <span>{type === "teacher" ? "School / Department" : "School / Creator Handle"}</span>
        <input
          value={organization}
          onChange={(event) => setOrganization(event.target.value)}
          placeholder={type === "teacher" ? "IB Economics Department" : "@macrocreator"}
        />
      </label>
      <label className="form-field">
        <span>Note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder={
            type === "teacher"
              ? "Tell us how you would use it in class or what would improve it."
              : "Tell us which challenge formats, scenario drops, or creator events you want next."
          }
        />
      </label>
      <button className="button primary" type="submit">
        {buttonLabel}
      </button>
      <p className="muted small">
        By submitting, you agree that we may process this information under our <Link href="/privacy" className="text-link">Privacy Policy</Link> and <Link href="/terms" className="text-link">Terms of Use</Link>.
      </p>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
