"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { AgeBand, Classroom, UserProfile } from "@/lib/game/types";
import { classroomAgeBandLabel } from "@/lib/classrooms";
import { JURISDICTIONS } from "@/lib/policy";

const ageBands: Array<{ value: AgeBand; label: string }> = [
  { value: "under_13", label: "Under 13" },
  { value: "13_to_local_digital_consent_age", label: "13 to local digital consent age" },
  { value: "above_local_digital_consent_age", label: "Above local digital consent age" }
];

type LoadState = {
  classes: Classroom[];
  profile: UserProfile | null;
  persisted: boolean;
};

export function ClassroomsDashboard() {
  const [state, setState] = useState<LoadState>({ classes: [], profile: null, persisted: true });
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [ageBandDefault, setAgeBandDefault] = useState<AgeBand>("above_local_digital_consent_age");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/classes", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to load classes.");
      return;
    }

    setState({
      classes: data.classes ?? [],
      profile: data.profile ?? null,
      persisted: data.persisted !== false
    });
    if (data.profile?.displayName) {
      setDisplayName(data.profile.displayName);
      setSchoolName(data.profile.schoolName ?? "");
      setJurisdiction(data.profile.jurisdiction ?? "US");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const response = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        name,
        schoolName,
        countryCode: jurisdiction,
        jurisdiction,
        ageBandDefault
      })
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus(data.error ?? "Unable to create class.");
      return;
    }

    setStatus(data.persisted === false ? "Saved in UI mode only. Add Supabase env to persist classes." : "Class created.");
    setName("");
    await load();
  }

  return (
    <section className="shell section stack-xl">
      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">My Classes</p>
            <h1>Your classroom spaces</h1>
            <p className="muted">Open an existing class to review student work, or create a new class when you need a fresh join flow.</p>
          </div>
          {state.persisted ? null : <span className="mini-status gated">Supabase required for persistence</span>}
        </div>

        {state.classes.length ? (
          <div className="scenario-grid">
            {state.classes.map((classroom) => (
              <article key={classroom.id} className="scenario-card scenario-card-rich stack-sm">
                <div className="card-topline">
                  <span className="pill">{classroom.jurisdiction}</span>
                  <span className="mini-status open">{classroomAgeBandLabel(classroom.ageBandDefault)}</span>
                </div>
                <h3>{classroom.name}</h3>
                <p className="muted">{classroom.schoolName ?? "School not set"}</p>
                <Link className="button primary" href={`/teachers/classes/${classroom.id}`}>
                  Open class
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">No classes yet. Create your first class to issue student join links.</p>
          </div>
        )}
      </section>

      <details className="panel stack-md teacher-setup-details">
        <summary>Create a new class</summary>
        <form className="stack-md" onSubmit={onSubmit}>
          <div className="stack-sm">
            <p className="eyebrow">New Class</p>
            <h2>Create a class and issue join links</h2>
            <p className="muted">
              Teachers create the class once, then generate per-group join codes and QR links for student sign-up.
            </p>
          </div>

          <label className="form-field">
            <span>Teacher display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ms. Morgan" />
          </label>

          <label className="form-field">
            <span>Class name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="IB Macroeconomics Block A" />
          </label>

          <label className="form-field">
            <span>School</span>
            <input
              value={schoolName}
              onChange={(event) => setSchoolName(event.target.value)}
              placeholder="Astana International School"
            />
          </label>

          <div className="grid two">
            <label className="form-field">
              <span>Country / region</span>
              <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
                {JURISDICTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Default age band</span>
              <select value={ageBandDefault} onChange={(event) => setAgeBandDefault(event.target.value as AgeBand)}>
                {ageBands.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create class"}
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </details>

      <details className="panel stack-md teacher-setup-details">
        <summary>Privacy and compliance links</summary>
        <aside className="stack-md teacher-support">
          <p className="eyebrow">Compliance Defaults</p>
          <h2>School-managed onboarding</h2>
          <div className="timeline">
            <div className="timeline-item">Students join only through teacher-issued codes or QR links in v1.</div>
            <div className="timeline-item">Under-13 learners are limited to school-authorized classroom use.</div>
            <div className="timeline-item">No ads, no behavioral profiling, and no non-educational reuse of classroom data.</div>
          </div>
          <p className="muted small">
            The legal pages below are linked from teacher onboarding and the student join flow.
          </p>
          <div className="stack-xs">
            <Link className="text-link" href="/privacy">Privacy Policy</Link>
            <Link className="text-link" href="/schools/privacy">School & Student Privacy Notice</Link>
            <Link className="text-link" href="/schools/dpa">School DPA</Link>
          </div>
        </aside>
      </details>
    </section>
  );
}
