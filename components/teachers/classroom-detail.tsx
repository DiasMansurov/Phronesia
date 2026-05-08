"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

import type { ClassroomBundle } from "@/lib/classrooms";
import { pct } from "@/lib/game/format";
import type { ClassroomPolicyDecision, ClassroomRunAttempt, PolicyEffectDirection, TeacherFeedbackMark } from "@/lib/game/types";

type ClassroomDetailProps = {
  classId: string;
};

type ClassTab = "students" | "feedback" | "setup";

type StudentHistory = {
  profileId: string;
  displayName: string;
  groupId: string;
  groupName: string;
  status: string;
  attempts: ClassroomRunAttempt[];
  lastActiveAt: string | null;
};

type FeedbackQueueItem = {
  attempt: ClassroomRunAttempt;
  decision: ClassroomPolicyDecision;
};

const DIRECTION_LABELS: Record<PolicyEffectDirection, string> = {
  increase: "Increase",
  decrease: "Decrease",
  no_change: "No material change"
};

const MARK_LABELS: Record<TeacherFeedbackMark, string> = {
  correct: "Correct",
  partial: "Partially correct",
  incorrect: "Incorrect"
};

function changeLabel(after: number | undefined, before: number | undefined) {
  if (typeof after !== "number" || typeof before !== "number") return "Outcome pending";
  const change = after - before;
  if (Math.abs(change) < 0.05) return "No material change";
  return change > 0 ? `Up ${pct(change)}` : `Down ${pct(Math.abs(change))}`;
}

function outcomeSummary(decision: ClassroomPolicyDecision) {
  return [
    `Unemployment: ${changeLabel(decision.afterState?.unemployment, decision.beforeState?.unemployment)}`,
    `Inflation: ${changeLabel(decision.afterState?.inflation, decision.beforeState?.inflation)}`,
    `Growth: ${changeLabel(decision.afterState?.growth, decision.beforeState?.growth)}`
  ].join(" · ");
}

function formatDateTime(value: string | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ClassroomDetail({ classId }: ClassroomDetailProps) {
  const [bundle, setBundle] = useState<ClassroomBundle | null>(null);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<ClassTab>("students");
  const [groupName, setGroupName] = useState("");
  const [activeQrGroupId, setActiveQrGroupId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [activeAttempt, setActiveAttempt] = useState<ClassroomRunAttempt | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<Record<string, ClassroomRunAttempt>>({});
  const [queueStatus, setQueueStatus] = useState("");
  const [attemptStatus, setAttemptStatus] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { mark: TeacherFeedbackMark; comment: string }>>({});
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/classes/${classId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to load class.");
      return;
    }
    setBundle(data.bundle ?? null);
  }

  useEffect(() => {
    void load();
  }, [classId]);

  useEffect(() => {
    if (!bundle?.attempts.length) {
      setAttemptDetails({});
      return;
    }

    let cancelled = false;

    async function loadAttemptDetails() {
      setQueueStatus("Checking submitted work...");
      const loaded = await Promise.all(
        (bundle?.attempts ?? []).map(async (attempt) => {
          const response = await fetch(`/api/classes/${classId}/attempts/${attempt.id}`, { cache: "no-store" });
          if (!response.ok) return null;
          const data = await response.json();
          return data.attempt as ClassroomRunAttempt;
        })
      );

      if (cancelled) return;
      setAttemptDetails(
        Object.fromEntries(loaded.filter((attempt): attempt is ClassroomRunAttempt => Boolean(attempt)).map((attempt) => [attempt.id, attempt]))
      );
      setQueueStatus("");
    }

    void loadAttemptDetails();

    return () => {
      cancelled = true;
    };
  }, [bundle?.attempts, classId]);

  const groupsById = useMemo(() => new Map(bundle?.groups.map((group) => [group.id, group]) ?? []), [bundle]);
  const studentHistories = useMemo<StudentHistory[]>(() => {
    if (!bundle) return [];

    const students = new Map<string, StudentHistory>();
    for (const membership of bundle.memberships) {
      students.set(membership.profileId, {
        profileId: membership.profileId,
        displayName: membership.displayName,
        groupId: membership.groupId,
        groupName: groupsById.get(membership.groupId)?.name ?? "Unknown group",
        status: membership.status,
        attempts: [],
        lastActiveAt: null
      });
    }

    for (const attempt of bundle.attempts) {
      const existing = students.get(attempt.studentProfileId);
      if (existing) {
        existing.attempts.push(attempt);
        existing.lastActiveAt =
          !existing.lastActiveAt || new Date(attempt.updatedAt) > new Date(existing.lastActiveAt)
            ? attempt.updatedAt
            : existing.lastActiveAt;
      } else {
        students.set(attempt.studentProfileId, {
          profileId: attempt.studentProfileId,
          displayName: attempt.studentDisplayName ?? "Student",
          groupId: attempt.groupId,
          groupName: attempt.groupName ?? groupsById.get(attempt.groupId)?.name ?? "Unknown group",
          status: "active",
          attempts: [attempt],
          lastActiveAt: attempt.updatedAt
        });
      }
    }

    return Array.from(students.values()).sort((first, second) => {
      if (first.lastActiveAt && second.lastActiveAt) {
        return new Date(second.lastActiveAt).getTime() - new Date(first.lastActiveAt).getTime();
      }
      if (first.lastActiveAt) return -1;
      if (second.lastActiveAt) return 1;
      return first.displayName.localeCompare(second.displayName);
    });
  }, [bundle, groupsById]);
  const activeStudent =
    studentHistories.find((student) => student.profileId === activeStudentId) ?? studentHistories[0] ?? null;

  function unmarkedCountForAttempt(attempt: ClassroomRunAttempt) {
    return (attemptDetails[attempt.id]?.decisions ?? attempt.decisions ?? []).filter((decision) => !decision.feedback).length;
  }

  function unmarkedCountForStudent(student: StudentHistory) {
    return student.attempts.reduce((total, attempt) => total + unmarkedCountForAttempt(attempt), 0);
  }

  const feedbackQueue = useMemo<FeedbackQueueItem[]>(() => {
    return Object.values(attemptDetails)
      .flatMap((attempt) =>
        (attempt.decisions ?? [])
          .filter((decision) => !decision.feedback)
          .map((decision) => ({ attempt, decision }))
      )
      .sort((first, second) => {
        const firstTime = new Date(first.decision.updatedAt ?? first.attempt.updatedAt).getTime();
        const secondTime = new Date(second.decision.updatedAt ?? second.attempt.updatedAt).getTime();
        return secondTime - firstTime;
      });
  }, [attemptDetails]);

  useEffect(() => {
    if (!studentHistories.length) {
      setActiveStudentId(null);
      return;
    }
    if (!activeStudentId || !studentHistories.some((student) => student.profileId === activeStudentId)) {
      setActiveStudentId(studentHistories[0].profileId);
    }
  }, [activeStudentId, studentHistories]);

  useEffect(() => {
    if (!activeStudent) return;
    if (!activeStudent.attempts.length) {
      setActiveAttempt(null);
      return;
    }
    if (!activeAttempt || activeAttempt.studentProfileId !== activeStudent.profileId) {
      void openAttempt(activeStudent.attempts[0].id);
    }
  }, [activeStudent?.profileId, activeStudent?.attempts[0]?.id]);

  async function onCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/classes/${classId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to create group.");
      return;
    }
    setGroupName("");
    setStatus("Group created.");
    await load();
  }

  async function onGenerateToken(groupId: string) {
    const response = await fetch(`/api/classes/${classId}/groups/${groupId}/tokens`, {
      method: "POST"
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to create join token.");
      return;
    }

    const joinUrl = data.token?.joinUrl as string | undefined;
    if (joinUrl) {
      setActiveQrGroupId(groupId);
      setQrDataUrl(await QRCode.toDataURL(joinUrl, { margin: 1, width: 260 }));
    }

    setStatus("New join link generated.");
    await load();
  }

  async function openAttempt(attemptId: string) {
    const cachedAttempt = attemptDetails[attemptId];
    if (cachedAttempt) {
      setActiveAttempt(cachedAttempt);
      setFeedbackDrafts(
        Object.fromEntries(
          (cachedAttempt.decisions ?? []).map((decision) => [
            decision.id,
            {
              mark: decision.feedback?.mark ?? "partial",
              comment: decision.feedback?.comment ?? ""
            }
          ])
        )
      );
      setAttemptStatus("");
      return;
    }

    setAttemptStatus("Loading student run...");
    const response = await fetch(`/api/classes/${classId}/attempts/${attemptId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setAttemptStatus(data.error ?? "Unable to load student run.");
      return;
    }

    const attempt = data.attempt as ClassroomRunAttempt;
    setActiveAttempt(attempt);
    setAttemptDetails((current) => ({ ...current, [attempt.id]: attempt }));
    setFeedbackDrafts(
      Object.fromEntries(
        (attempt.decisions ?? []).map((decision) => [
          decision.id,
          {
            mark: decision.feedback?.mark ?? "partial",
            comment: decision.feedback?.comment ?? ""
          }
        ])
      )
    );
    setAttemptStatus("");
  }

  async function selectStudent(student: StudentHistory) {
    setActiveStudentId(student.profileId);
    setActiveAttempt(null);
    setAttemptStatus("");
    setActiveTab("students");
    if (student.attempts.length) {
      await openAttempt(student.attempts[0].id);
    }
  }

  async function saveFeedback(decisionId: string) {
    const sourceDecision =
      activeAttempt?.decisions?.find((decision) => decision.id === decisionId) ??
      Object.values(attemptDetails)
        .flatMap((attempt) => attempt.decisions ?? [])
        .find((decision) => decision.id === decisionId);
    const draft = feedbackDrafts[decisionId] ?? (sourceDecision
      ? {
          mark: sourceDecision.feedback?.mark ?? ("partial" as TeacherFeedbackMark),
          comment: sourceDecision.feedback?.comment ?? ""
        }
      : null);
    if (!draft) return;

    setSavingFeedbackId(decisionId);
    setAttemptStatus("Saving feedback...");
    const response = await fetch(`/api/classes/${classId}/feedback/${decisionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const data = await response.json();
    if (!response.ok) {
      setAttemptStatus(data.error ?? "Unable to save feedback.");
      setSavingFeedbackId(null);
      return;
    }

    setActiveAttempt((current) =>
      current
        ? {
            ...current,
            decisions: current.decisions?.map((decision) =>
              decision.id === decisionId ? { ...decision, feedback: data.feedback } : decision
            )
          }
        : current
    );
    setAttemptDetails((current) => {
      const attempt = Object.values(current).find((item) =>
        item.decisions?.some((decision) => decision.id === decisionId)
      ) ?? activeAttempt;
      if (!attempt) return current;
      return {
        ...current,
        [attempt.id]: {
          ...attempt,
          decisions: attempt.decisions?.map((decision) =>
            decision.id === decisionId ? { ...decision, feedback: data.feedback } : decision
          )
        }
      };
    });
    setAttemptStatus("Feedback saved.");
    setSavingFeedbackId(null);
    await load();
  }

  function renderFeedbackCard(decision: ClassroomPolicyDecision, attempt?: ClassroomRunAttempt) {
    const draft = feedbackDrafts[decision.id] ?? {
      mark: decision.feedback?.mark ?? ("partial" as TeacherFeedbackMark),
      comment: decision.feedback?.comment ?? ""
    };

    return (
      <article key={decision.id} className="feedback-card teacher-decision-card stack-sm">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              Year {decision.round} · {decision.year}
              {attempt ? ` · ${attempt.studentDisplayName ?? "Student"}` : ""}
            </p>
            <h3>{attempt ? attempt.scenarioTitle : "Prediction, explanation, and outcome"}</h3>
          </div>
          <span className={`mini-status ${decision.feedback ? "open" : "mixed"}`}>
            {decision.feedback ? "Marked" : "Unmarked"}
          </span>
        </div>

        <div className="teacher-decision-grid">
          <section className="compact-panel stack-xs">
            <p className="eyebrow">Student Prediction</p>
            <p className="muted small">
              AD: {DIRECTION_LABELS[decision.prediction.aggregateDemand]} · AS: {DIRECTION_LABELS[decision.prediction.aggregateSupply]}
            </p>
            <p className="muted small">
              Unemployment: {DIRECTION_LABELS[decision.prediction.unemployment]} · Inflation: {DIRECTION_LABELS[decision.prediction.inflation]}
            </p>
            <p>{decision.prediction.explanation}</p>
          </section>

          <section className="compact-panel stack-xs">
            <p className="eyebrow">Actual Outcome</p>
            <p className="muted small">{outcomeSummary(decision)}</p>
            <p>{decision.policySummary || "Outcome summary is pending."}</p>
            {decision.citizenSummary ? <p className="muted small">{decision.citizenSummary}</p> : null}
          </section>
        </div>

        <div className="teacher-mark-grid">
          <label className="form-field">
            <span>Mark</span>
            <select
              value={draft.mark}
              onChange={(event) =>
                setFeedbackDrafts((current) => ({
                  ...current,
                  [decision.id]: {
                    ...draft,
                    mark: event.target.value as TeacherFeedbackMark
                  }
                }))
              }
            >
              {Object.entries(MARK_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Comment</span>
            <textarea
              value={draft.comment}
              onChange={(event) =>
                setFeedbackDrafts((current) => ({
                  ...current,
                  [decision.id]: {
                    ...draft,
                    comment: event.target.value
                  }
                }))
              }
              rows={3}
              placeholder="Comment on the student's causal reasoning and accuracy."
            />
          </label>
        </div>

        <div className="section-header">
          <p className="muted small">Students will see this feedback inside their play history.</p>
          <button
            className="button primary"
            type="button"
            disabled={savingFeedbackId === decision.id}
            onClick={() => void saveFeedback(decision.id)}
          >
            {savingFeedbackId === decision.id ? "Saving..." : "Save Feedback"}
          </button>
        </div>
      </article>
    );
  }

  if (!bundle) {
    return (
      <section className="shell section">
        <div className="panel stack-sm">
          <p className="eyebrow">Teacher Dashboard</p>
          <h1>Classroom dashboard</h1>
          <p className="muted">{status || "Loading class data..."}</p>
        </div>
      </section>
    );
  }

  const recentToken = activeQrGroupId
    ? bundle.tokens.find((token) => token.groupId === activeQrGroupId)
    : bundle.tokens[0] ?? null;

  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact panel">
        <div className="stack-sm">
          <p className="eyebrow">Teacher Dashboard</p>
          <h1 className="display compact">{bundle.classroom.name}</h1>
          <p className="lede">
            {bundle.classroom.schoolName ?? "School not set"} · {bundle.classroom.jurisdiction} classroom flow with
            teacher-managed sign-up.
          </p>
          <Link className="text-link" href="/teachers/classes">
            Back to all classes
          </Link>
        </div>
      </div>

      <div className="class-tabs" role="tablist" aria-label="Class dashboard sections">
        {([
          ["students", "Students"],
          ["feedback", `Feedback${feedbackQueue.length ? ` (${feedbackQueue.length})` : ""}`],
          ["setup", "Setup"]
        ] as Array<[ClassTab, string]>).map(([tab, label]) => (
          <button
            key={tab}
            className={`class-tab ${activeTab === tab ? "selected" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "students" ? (
        <section className="stack-md">
          <section className="panel stack-md">
            <div className="section-header">
              <div>
                <p className="eyebrow">Students</p>
                <h2>Roster and review status</h2>
              </div>
              <span className="pill">{studentHistories.length}</span>
            </div>
            {studentHistories.length ? (
              <div className="teacher-table-wrap">
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Group</th>
                      <th>Last activity</th>
                      <th>Runs</th>
                      <th>Unmarked work</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistories.map((student) => (
                      <tr key={student.profileId}>
                        <td>
                          <strong>{student.displayName}</strong>
                        </td>
                        <td>{student.groupName}</td>
                        <td>{formatDateTime(student.lastActiveAt)}</td>
                        <td>{student.attempts.length}</td>
                        <td>{queueStatus && student.attempts.length ? "Checking..." : unmarkedCountForStudent(student)}</td>
                        <td>
                          <button
                            className="button secondary compact-button"
                            type="button"
                            onClick={() => void selectStudent(student)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No students have joined yet. Use Setup to generate a join link.</p>
            )}
          </section>

          <section className="teacher-markbook">
            <aside className="panel stack-md teacher-student-list">
          <div className="section-header">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Click a student to see their play history</h2>
            </div>
            <span className="pill">{studentHistories.length}</span>
          </div>
          {studentHistories.length ? (
            <div className="student-history-list">
              {studentHistories.map((student) => (
                <button
                  key={student.profileId}
                  className={`student-history-row ${activeStudent?.profileId === student.profileId ? "selected" : ""}`}
                  type="button"
                  onClick={() => void selectStudent(student)}
                >
                  <span className="student-history-main">
                    <strong>{student.displayName}</strong>
                    <span>{student.groupName}</span>
                  </span>
                  <span className="student-history-meta">
                    <span>{student.attempts.length} run{student.attempts.length === 1 ? "" : "s"}</span>
                    <span>{formatDateTime(student.lastActiveAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">No students have joined yet. Use Setup to generate a join link.</p>
          )}
        </aside>

        <section className="panel stack-md teacher-history-detail">
          <div className="section-header">
            <div>
              <p className="eyebrow">Student History</p>
              <h2>{activeStudent ? activeStudent.displayName : "No student selected"}</h2>
              {activeStudent ? (
                <p className="muted">
                  {activeStudent.groupName} · {activeStudent.status} · last activity {formatDateTime(activeStudent.lastActiveAt)}
                </p>
              ) : null}
            </div>
            {activeStudent ? <span className="pill">{activeStudent.attempts.length} attempt{activeStudent.attempts.length === 1 ? "" : "s"}</span> : null}
          </div>

          {attemptStatus ? <p className="form-status">{attemptStatus}</p> : null}

          {activeStudent?.attempts.length ? (
            <div className="attempt-chip-row">
              {activeStudent.attempts.map((attempt) => (
                <button
                  key={attempt.id}
                  className={`attempt-chip ${activeAttempt?.id === attempt.id ? "selected" : ""}`}
                  type="button"
                  onClick={() => void openAttempt(attempt.id)}
                >
                  <strong>{attempt.scenarioTitle}</strong>
                  <span>{attempt.roundsCompleted ?? 0} years · {attempt.status}</span>
                </button>
              ))}
            </div>
          ) : activeStudent ? (
            <div className="empty-state">
              <p className="muted">This student has joined the class but has not submitted any policy predictions yet.</p>
            </div>
          ) : null}

          {activeAttempt && activeAttempt.studentProfileId === activeStudent?.profileId ? (
            <div className="stack-md">
              <div className="student-attempt-summary">
                <div>
                  <p className="eyebrow">Selected Run</p>
                  <h3>{activeAttempt.scenarioTitle}</h3>
                  <p className="muted small">
                    {activeAttempt.difficultyId} · {activeAttempt.status} · score {activeAttempt.finalScore ?? "in progress"}
                  </p>
                </div>
                <span className={`mini-status ${activeAttempt.status === "completed" ? "open" : "mixed"}`}>
                  {activeAttempt.status}
                </span>
              </div>

              {(activeAttempt.decisions ?? []).length ? (
                <div className="feedback-list">
                  {(activeAttempt.decisions ?? []).map((decision) => renderFeedbackCard(decision))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="muted">This run has no submitted prediction records yet.</p>
                </div>
              )}
            </div>
          ) : activeStudent?.attempts.length ? (
            <div className="empty-state">
              <p className="muted">Choose a run above to view the student's explanations and mark their work.</p>
            </div>
          ) : null}
        </section>
          </section>
        </section>
      ) : null}

      {activeTab === "feedback" ? (
        <section className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Feedback</p>
              <h2>Submissions needing attention</h2>
              <p className="muted">Mark and comment on unreviewed predictions without hunting through each student run.</p>
            </div>
            <span className="pill">{feedbackQueue.length}</span>
          </div>
          {queueStatus ? <p className="form-status">{queueStatus}</p> : null}
          {feedbackQueue.length ? (
            <div className="feedback-list">
              {feedbackQueue.map(({ attempt, decision }) => renderFeedbackCard(decision, attempt))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">{queueStatus ? "Loading feedback queue." : "No unmarked submissions right now."}</p>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "setup" ? (
        <section className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Setup</p>
              <h2>Groups, join links, and QR codes</h2>
            </div>
          </div>
        <section className="grid two teacher-content">
          <form className="stack-md" onSubmit={onCreateGroup}>
            <div className="stack-sm">
              <p className="eyebrow">Groups</p>
              <h2>Add a student group</h2>
              <p className="muted">Create groups like Period 1, Team Keynes, or Table 4 and issue a separate join link.</p>
            </div>
            <label className="form-field">
              <span>Group name</span>
              <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Period 1" />
            </label>
            <button className="button primary" type="submit">
              Create group
            </button>
            {status ? <p className="form-status">{status}</p> : null}
          </form>

          <aside className="stack-md">
            <p className="eyebrow">Latest Join QR</p>
            <h2>Student scan sheet</h2>
            {qrDataUrl && recentToken ? (
              <div className="stack-sm qr-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR code for student class join" className="qr-image" />
                <p className="muted small">Code: {recentToken.code}</p>
                <p className="muted small">Link: /join/{recentToken.token}</p>
              </div>
            ) : (
              <p className="muted">Generate a group join link to render the QR code here.</p>
            )}
          </aside>
        </section>

        <div className="scenario-grid">
          {bundle.groups.map((group) => {
            const tokens = bundle.tokens.filter((token) => token.groupId === group.id);
            const latest = tokens[0];

            return (
              <article key={group.id} className="scenario-card stack-sm">
                <div className="card-topline">
                  <span className="pill">{group.name}</span>
                  <span className={`mini-status ${latest?.status === "active" ? "open" : "gated"}`}>
                    {latest?.status ?? "No token"}
                  </span>
                </div>
                <p className="muted small">
                  {latest ? `Current code ${latest.code} · expires ${new Date(latest.expiresAt).toLocaleDateString()}` : "Generate the first student access code."}
                </p>
                <button className="button primary" type="button" onClick={() => void onGenerateToken(group.id)}>
                  Generate code + QR
                </button>
              </article>
            );
          })}
        </div>
        </section>
      ) : null}
    </section>
  );
}
