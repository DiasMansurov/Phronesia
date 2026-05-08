import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("play flow gates advancement behind required prediction modal", () => {
  const source = read("components/game/play-experience.tsx");
  assert.match(source, /Set Policies/);
  assert.match(source, /onSubmitPrediction/);
  assert.match(source, /Explain your reasoning before the year is simulated/);
  assert.match(source, /advanceRun\(run\)/);
  assert.doesNotMatch(source, /Enact One Year/);
});

test("classroom migration creates prediction and feedback storage", () => {
  const migration = read("supabase/migrations/20260430120000_classroom_policy_predictions.sql");
  for (const table of ["class_run_attempts", "class_policy_decisions", "teacher_decision_feedback"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /prediction_ad text not null check/);
  assert.match(migration, /explanation text not null/);
  assert.match(migration, /unique \(attempt_id, round\)/);
});

test("student decision API requires active classroom membership and valid prediction", () => {
  const route = read("app/api/classroom/decisions/route.ts");
  assert.match(route, /validPrediction/);
  assert.match(route, /prediction\.explanation\.trim\(\)\.length > 0/);
  assert.match(route, /getActiveStudentClassroom\(profile\.id\)/);
  assert.match(route, /profile\.role !== "student"/);
  assert.match(route, /phase === "complete"/);
});

test("student feedback API only returns a student's own run feedback", () => {
  const route = read("app/api/classroom/feedback/[runId]/route.ts");
  assert.match(route, /profile\.role !== "student"/);
  assert.match(route, /listStudentRunFeedback\(\{ profileId: profile\.id, runId \}\)/);
});

test("teacher APIs are scoped to the teacher's own class", () => {
  const attemptRoute = read("app/api/classes/[classId]/attempts/[attemptId]/route.ts");
  const feedbackRoute = read("app/api/classes/[classId]/feedback/[decisionId]/route.ts");
  assert.match(attemptRoute, /classroom\.teacherProfileId !== profile\.id/);
  assert.match(feedbackRoute, /classroom\.teacherProfileId !== profile\.id/);
  assert.match(feedbackRoute, /record\.attempt\.classId !== classId/);
  assert.match(feedbackRoute, /upsertTeacherDecisionFeedback/);
});
