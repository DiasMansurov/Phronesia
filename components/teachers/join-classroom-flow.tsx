"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

import type { AgeBand } from "@/lib/game/types";
import { JURISDICTIONS, consentRequirement } from "@/lib/policy";

const ageBandOptions: Array<{ value: AgeBand; label: string }> = [
  { value: "under_13", label: "Under 13" },
  { value: "13_to_local_digital_consent_age", label: "13 to local digital consent age" },
  { value: "above_local_digital_consent_age", label: "Above local digital consent age" }
];

type JoinClassroomFlowProps = {
  token: string;
};

type JoinPayload = {
  classroom: { id: string; name: string; schoolName?: string | null; jurisdiction: string };
  group: { id: string; name: string } | null;
  joinToken: { id: string; code: string; expiresAt: string };
  isExpired: boolean;
};

export function JoinClassroomFlow({ token }: JoinClassroomFlowProps) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [join, setJoin] = useState<JoinPayload | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [ageBand, setAgeBand] = useState<AgeBand>("above_local_digital_consent_age");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/join/${token}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Unable to load join link.");
        return;
      }
      setJoin(data.join ?? null);
      if (data.join?.classroom?.schoolName) {
        setSchoolName(data.join.classroom.schoolName);
      }
      if (data.join?.classroom?.jurisdiction) {
        setJurisdiction(data.join.classroom.jurisdiction);
      }
    }

    void load();
  }, [token]);

  const consent = useMemo(() => consentRequirement(ageBand, jurisdiction), [ageBand, jurisdiction]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      setStatus("Please accept the classroom legal notices before joining.");
      return;
    }

    const response = await fetch(`/api/join/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        schoolName,
        countryCode: jurisdiction,
        jurisdiction,
        ageBand
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to join class.");
      return;
    }

    setSuccess(true);
    setStatus(`Joined ${data.classroom.name} / ${data.group.name}. ${data.consentSummary}`);
  }

  if (!join) {
    return (
      <section className="shell section">
        <div className="panel stack-sm">
          <p className="eyebrow">Student Join</p>
          <h1>Classroom sign-up</h1>
          <p className="muted">{status || "Loading join link..."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact panel">
        <div className="stack-sm">
          <p className="eyebrow">Student Join</p>
          <h1 className="display compact">{join.classroom.name}</h1>
          <p className="lede">
            {join.group ? `Group ${join.group.name}` : "Teacher-managed classroom"} · code {join.joinToken.code}
          </p>
          <p className="muted">
            This flow is for school-authorized educational use only. Classroom data is not used for advertising or
            behavioral profiling, and required legal notices are recorded as part of sign-up.
          </p>
        </div>
      </div>

      <section className="grid two teacher-content">
        <div className="panel stack-md">
          <p className="eyebrow">Step 1</p>
          <h2>Sign in or create your account</h2>
          <p className="muted">
            Students can only join through a teacher-issued classroom flow in this version. Independent classroom sign-up is intentionally disabled.
          </p>
          {hasClerk ? (
            <>
              <Show when="signed-out">
                <div className="auth-actions">
                  <SignInButton mode="modal">
                    <button className="button secondary" type="button">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="button primary" type="button">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <p className="muted">Signed in. Complete the classroom profile details below to finish joining.</p>
              </Show>
            </>
          ) : (
            <p className="muted">Add Clerk environment keys to enable protected classroom sign-up.</p>
          )}
        </div>

        <aside className="panel stack-md">
          <p className="eyebrow">Required Notices</p>
          <h2>Read these before joining</h2>
          <div className="timeline">
            <div className="timeline-item">Privacy Policy and Terms of Use apply to all accounts.</div>
            <div className="timeline-item">School & Student Privacy Notice explains classroom data handling.</div>
            <div className="timeline-item">Children’s notice explains under-age access and school authorization limits.</div>
          </div>
          <div className="stack-xs">
            <Link className="text-link" href="/privacy">Privacy Policy</Link>
            <Link className="text-link" href="/terms">Terms of Use</Link>
            <Link className="text-link" href="/schools/privacy">School & Student Privacy Notice</Link>
            <Link className="text-link" href="/schools/children">Children&apos;s Privacy Notice</Link>
          </div>
        </aside>
      </section>

      <form className="panel stack-md" onSubmit={onSubmit}>
        <div className="stack-sm">
          <p className="eyebrow">Step 2</p>
          <h2>Complete classroom sign-up</h2>
          <p className="muted">{consent.summary}</p>
        </div>

        <label className="form-field">
          <span>Display name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Aruzhan" />
        </label>

        <div className="grid two">
          <label className="form-field">
            <span>Jurisdiction</span>
            <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
              {JURISDICTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Age band</span>
            <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AgeBand)}>
              {ageBandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-field">
          <span>School</span>
          <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="School" />
        </label>

        <label className="checkbox-row">
          <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
          <span>
            I have reviewed the classroom legal notices and understand this account is for school-authorized
            educational use, subject to the school privacy and children&apos;s privacy notices.
          </span>
        </label>

        <button className="button primary" type="submit" disabled={!hasClerk || success}>
          {success ? "Joined" : "Join class"}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </form>
    </section>
  );
}
