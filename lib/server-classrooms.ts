import { randomUUID } from "crypto";

import { buildJoinUrl, defaultExpiryDate, makeJoinCode, type ClassroomBundle } from "@/lib/classrooms";
import type {
  AcceptanceContext,
  AcceptedBy,
  AgeBand,
  Classroom,
  ClassroomGroup,
  ClassroomMembership,
  ClassroomPolicyDecision,
  ClassroomRunAttempt,
  DifficultyId,
  JoinToken,
  LegalAcceptance,
  MacroState,
  Policies,
  PolicyEffectDirection,
  PolicyPrediction,
  TeacherDecisionFeedback,
  TeacherFeedbackMark,
  UserProfile,
  UserRole
} from "@/lib/game/types";
import { schoolPolicyAcceptanceContext, type PolicyKey, POLICY_VERSIONS } from "@/lib/policy";
import { insertRow, selectRows, supabaseConfigured, updateRows, upsertRow } from "@/lib/supabase-rest";

type Row = Record<string, unknown>;

function rowsOnly(result: Row[] | { ok: boolean; reason: "missing_env" }) {
  return Array.isArray(result) ? result : [];
}

function mapProfile(row: Row): UserProfile {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    displayName: String(row.display_name ?? ""),
    role: row.role as UserRole,
    schoolName: (row.school_name as string | null | undefined) ?? null,
    countryCode: String(row.country_code ?? "US"),
    jurisdiction: String(row.jurisdiction ?? "US"),
    ageBand: (row.age_band as AgeBand | null | undefined) ?? null,
    schoolManaged: Boolean(row.school_managed),
    onboardingCompleted: Boolean(row.onboarding_completed)
  };
}

function mapClassroom(row: Row): Classroom {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    teacherProfileId: String(row.teacher_profile_id),
    name: String(row.name),
    schoolName: (row.school_name as string | null | undefined) ?? null,
    countryCode: String(row.country_code ?? "US"),
    jurisdiction: String(row.jurisdiction ?? "US"),
    ageBandDefault: row.age_band_default as AgeBand,
    status: row.status as "active" | "archived"
  };
}

function mapGroup(row: Row): ClassroomGroup {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    classId: String(row.class_id),
    name: String(row.name),
    sortOrder: Number(row.sort_order ?? 0)
  };
}

function mapToken(row: Row): JoinToken {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    classId: String(row.class_id),
    groupId: String(row.group_id),
    code: String(row.code),
    token: String(row.token),
    status: row.status as JoinToken["status"],
    expiresAt: String(row.expires_at),
    createdByProfileId: String(row.created_by_profile_id)
  };
}

function mapMembership(row: Row): ClassroomMembership {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    classId: String(row.class_id),
    groupId: String(row.group_id),
    profileId: String(row.profile_id),
    role: row.role as UserRole,
    status: row.status as ClassroomMembership["status"],
    joinedViaTokenId: (row.joined_via_token_id as string | null | undefined) ?? null
  };
}

function parseJsonObject<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapFeedback(row: Row): TeacherDecisionFeedback {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    decisionId: String(row.decision_id),
    teacherProfileId: String(row.teacher_profile_id),
    mark: row.mark as TeacherFeedbackMark,
    comment: String(row.comment ?? "")
  };
}

function mapDecision(row: Row, feedback?: TeacherDecisionFeedback | null): ClassroomPolicyDecision {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    attemptId: String(row.attempt_id),
    runId: String(row.run_id),
    round: Number(row.round),
    year: Number(row.year),
    policies: parseJsonObject<Policies>(row.policies, {} as Policies),
    beforeState: parseJsonObject<MacroState>(row.before_state, {} as MacroState),
    afterState: parseJsonObject<MacroState>(row.after_state, {} as MacroState),
    prediction: {
      aggregateDemand: row.prediction_ad as PolicyEffectDirection,
      aggregateSupply: row.prediction_as as PolicyEffectDirection,
      unemployment: row.prediction_unemployment as PolicyEffectDirection,
      inflation: row.prediction_inflation as PolicyEffectDirection,
      explanation: String(row.explanation ?? "")
    },
    policySummary: String(row.policy_summary ?? ""),
    citizenSummary: String(row.citizen_summary ?? ""),
    scoreAfter: Number(row.score_after ?? 0),
    feedback: feedback ?? null
  };
}

function mapAttempt(row: Row): ClassroomRunAttempt {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    runId: String(row.run_id),
    classId: String(row.class_id),
    groupId: String(row.group_id),
    studentProfileId: String(row.student_profile_id),
    scenarioId: String(row.scenario_id),
    scenarioTitle: String(row.scenario_title),
    difficultyId: row.difficulty_id as DifficultyId,
    status: row.status as ClassroomRunAttempt["status"],
    finalScore: row.final_score === null || row.final_score === undefined ? null : Number(row.final_score),
    rankTitle: (row.rank_title as string | null | undefined) ?? null,
    victory: row.victory === null || row.victory === undefined ? null : Boolean(row.victory),
    summary: (row.summary as string | null | undefined) ?? null,
    roundsCompleted: row.rounds_completed === null || row.rounds_completed === undefined ? null : Number(row.rounds_completed),
    completedAt: (row.completed_at as string | null | undefined) ?? null
  };
}

export function hasDataBackend() {
  return supabaseConfigured();
}

export async function getProfileByClerkUserId(clerkUserId: string) {
  if (!hasDataBackend()) return null;

  const rows = await selectRows("profiles", {
    select: "*",
    clerk_user_id: `eq.${clerkUserId}`,
    limit: "1"
  });

  const parsed = rowsOnly(rows);
  if (parsed.length === 0) return null;
  return mapProfile(parsed[0]);
}

export async function upsertProfile(input: {
  clerkUserId: string;
  displayName: string;
  role: UserRole;
  schoolName?: string | null;
  countryCode: string;
  jurisdiction: string;
  ageBand?: AgeBand | null;
  schoolManaged: boolean;
  onboardingCompleted: boolean;
}) {
  if (!hasDataBackend()) return null;

  const now = new Date().toISOString();
  const rows = rowsOnly(await upsertRow(
    "profiles",
    {
      clerk_user_id: input.clerkUserId,
      display_name: input.displayName,
      role: input.role,
      school_name: input.schoolName ?? null,
      country_code: input.countryCode,
      jurisdiction: input.jurisdiction,
      age_band: input.ageBand ?? null,
      school_managed: input.schoolManaged,
      onboarding_completed: input.onboardingCompleted,
      updated_at: now
    },
    "clerk_user_id"
  ));

  return mapProfile(rows[0]);
}

export async function createClassroom(input: {
  teacherProfileId: string;
  name: string;
  schoolName?: string | null;
  countryCode: string;
  jurisdiction: string;
  ageBandDefault: AgeBand;
}) {
  if (!hasDataBackend()) return null;

  const now = new Date().toISOString();
  await insertRow("classes", {
    id: randomUUID(),
    teacher_profile_id: input.teacherProfileId,
    name: input.name,
    school_name: input.schoolName ?? null,
    country_code: input.countryCode,
    jurisdiction: input.jurisdiction,
    age_band_default: input.ageBandDefault,
    status: "active",
    created_at: now,
    updated_at: now
  });

  const rows = rowsOnly(await selectRows("classes", {
    select: "*",
    teacher_profile_id: `eq.${input.teacherProfileId}`,
    order: "created_at.desc",
    limit: "1"
  }));

  return mapClassroom(rows[0]);
}

export async function listTeacherClassrooms(teacherProfileId: string) {
  if (!hasDataBackend()) return [];
  const rows = rowsOnly(await selectRows("classes", {
    select: "*",
    teacher_profile_id: `eq.${teacherProfileId}`,
    order: "created_at.desc"
  }));
  return rows.map(mapClassroom);
}

export async function getClassroom(classId: string) {
  if (!hasDataBackend()) return null;
  const rows = rowsOnly(await selectRows("classes", {
    select: "*",
    id: `eq.${classId}`,
    limit: "1"
  }));
  if (!rows.length) return null;
  return mapClassroom(rows[0]);
}

export async function createGroup(classId: string, name: string) {
  if (!hasDataBackend()) return null;
  const existing = rowsOnly(await selectRows("groups", {
    select: "*",
    class_id: `eq.${classId}`,
    order: "sort_order.asc"
  }));
  const sortOrder = existing.length + 1;
  const now = new Date().toISOString();
  await insertRow("groups", {
    id: randomUUID(),
    class_id: classId,
    name,
    sort_order: sortOrder,
    created_at: now
  });

  const rows = rowsOnly(await selectRows("groups", {
    select: "*",
    class_id: `eq.${classId}`,
    order: "sort_order.desc",
    limit: "1"
  }));
  return mapGroup(rows[0]);
}

export async function createJoinToken(input: {
  classId: string;
  groupId: string;
  createdByProfileId: string;
  origin?: string;
}) {
  if (!hasDataBackend()) return null;

  const now = new Date().toISOString();
  const token = randomUUID();
  await insertRow("join_tokens", {
    id: randomUUID(),
    class_id: input.classId,
    group_id: input.groupId,
    code: makeJoinCode(),
    token,
    status: "active",
    expires_at: defaultExpiryDate(),
    created_by_profile_id: input.createdByProfileId,
    created_at: now,
    updated_at: now
  });

  const rows = rowsOnly(await selectRows("join_tokens", {
    select: "*",
    token: `eq.${token}`,
    limit: "1"
  }));

  return {
    ...mapToken(rows[0]),
    joinUrl: buildJoinUrl(token, input.origin)
  };
}

export async function revokeJoinToken(tokenId: string) {
  if (!hasDataBackend()) return null;
  const rows = rowsOnly(await updateRows(
    "join_tokens",
    { id: `eq.${tokenId}` },
    { status: "revoked", updated_at: new Date().toISOString() }
  ));
  return rows.length ? mapToken(rows[0]) : null;
}

export async function findJoinToken(input: { token?: string; code?: string }) {
  if (!hasDataBackend()) return null;

  const query: Record<string, string> = input.token
    ? { select: "*", token: `eq.${input.token}`, limit: "1" }
    : { select: "*", code: `eq.${String(input.code).toUpperCase()}`, limit: "1" };
  const rows = rowsOnly(await selectRows("join_tokens", query));
  if (!rows.length) return null;

  const joinToken = mapToken(rows[0]);
  const classroom = await getClassroom(joinToken.classId);
  if (!classroom) return null;

  const groupRows = rowsOnly(await selectRows("groups", {
    select: "*",
    id: `eq.${joinToken.groupId}`,
    limit: "1"
  }));

  const now = Date.now();
  const isExpired = joinToken.status !== "active" || new Date(joinToken.expiresAt).getTime() < now;

  return {
    classroom,
    group: groupRows.length ? mapGroup(groupRows[0]) : null,
    joinToken,
    isExpired
  };
}

export async function joinClassroom(input: {
  profileId: string;
  classId: string;
  groupId: string;
  joinedViaTokenId: string;
}) {
  if (!hasDataBackend()) return null;

  const now = new Date().toISOString();
  const existing = rowsOnly(await selectRows("class_memberships", {
    select: "*",
    class_id: `eq.${input.classId}`,
    profile_id: `eq.${input.profileId}`,
    limit: "1"
  }));

  if (existing.length) {
    const rows = rowsOnly(await updateRows(
      "class_memberships",
      { id: `eq.${String(existing[0].id)}` },
      {
        group_id: input.groupId,
        status: "active",
        joined_via_token_id: input.joinedViaTokenId,
        updated_at: now
      }
    ));
    return mapMembership(rows[0]);
  }

  await insertRow("class_memberships", {
    id: randomUUID(),
    class_id: input.classId,
    group_id: input.groupId,
    profile_id: input.profileId,
    role: "student",
    status: "active",
    joined_via_token_id: input.joinedViaTokenId,
    created_at: now,
    updated_at: now
  });

  const rows = rowsOnly(await selectRows("class_memberships", {
    select: "*",
    class_id: `eq.${input.classId}`,
    profile_id: `eq.${input.profileId}`,
    limit: "1"
  }));

  return mapMembership(rows[0]);
}

export async function getActiveStudentClassroom(profileId: string) {
  if (!hasDataBackend()) return null;

  const memberships = rowsOnly(await selectRows("class_memberships", {
    select: "*",
    profile_id: `eq.${profileId}`,
    role: "eq.student",
    status: "eq.active",
    order: "updated_at.desc",
    limit: "1"
  }));
  if (!memberships.length) return null;

  const membership = mapMembership(memberships[0]);
  const [classroom, groupRows] = await Promise.all([
    getClassroom(membership.classId),
    selectRows("groups", { select: "*", id: `eq.${membership.groupId}`, limit: "1" })
  ]);

  if (!classroom) return null;
  const groups = rowsOnly(groupRows);

  return {
    membership,
    classroom,
    group: groups.length ? mapGroup(groups[0]) : null
  };
}

export async function upsertClassRunAttempt(input: {
  runId: string;
  classId: string;
  groupId: string;
  studentProfileId: string;
  scenarioId: string;
  scenarioTitle: string;
  difficultyId: DifficultyId;
  status: ClassroomRunAttempt["status"];
  finalScore?: number | null;
  rankTitle?: string | null;
  victory?: boolean | null;
  summary?: string | null;
  roundsCompleted?: number | null;
}) {
  if (!hasDataBackend()) return null;

  const now = new Date().toISOString();
  const rows = rowsOnly(await upsertRow(
    "class_run_attempts",
    {
      run_id: input.runId,
      class_id: input.classId,
      group_id: input.groupId,
      student_profile_id: input.studentProfileId,
      scenario_id: input.scenarioId,
      scenario_title: input.scenarioTitle,
      difficulty_id: input.difficultyId,
      status: input.status,
      final_score: input.finalScore ?? null,
      rank_title: input.rankTitle ?? null,
      victory: input.victory ?? null,
      summary: input.summary ?? null,
      rounds_completed: input.roundsCompleted ?? null,
      completed_at: input.status === "completed" ? now : null,
      updated_at: now
    },
    "run_id"
  ));

  return mapAttempt(rows[0]);
}

export async function upsertClassPolicyDecision(input: {
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: Policies;
  beforeState: MacroState;
  afterState?: MacroState | null;
  prediction: PolicyPrediction;
  policySummary?: string | null;
  citizenSummary?: string | null;
  scoreAfter?: number | null;
}) {
  if (!hasDataBackend()) return null;

  const rows = rowsOnly(await upsertRow(
    "class_policy_decisions",
    {
      attempt_id: input.attemptId,
      run_id: input.runId,
      round: input.round,
      year: input.year,
      policies: input.policies,
      before_state: input.beforeState,
      after_state: input.afterState ?? null,
      prediction_ad: input.prediction.aggregateDemand,
      prediction_as: input.prediction.aggregateSupply,
      prediction_unemployment: input.prediction.unemployment,
      prediction_inflation: input.prediction.inflation,
      explanation: input.prediction.explanation,
      policy_summary: input.policySummary ?? null,
      citizen_summary: input.citizenSummary ?? null,
      score_after: input.scoreAfter ?? null,
      updated_at: new Date().toISOString()
    },
    "attempt_id,round"
  ));

  return mapDecision(rows[0]);
}

async function getFeedbackForDecisionIds(decisionIds: string[]) {
  if (!hasDataBackend() || decisionIds.length === 0) return new Map<string, TeacherDecisionFeedback>();
  const rows = rowsOnly(await selectRows("teacher_decision_feedback", {
    select: "*",
    decision_id: `in.(${decisionIds.join(",")})`
  }));
  return new Map(rows.map((row) => {
    const feedback = mapFeedback(row);
    return [feedback.decisionId, feedback];
  }));
}

export async function listClassRunAttempts(classId: string) {
  if (!hasDataBackend()) return [];

  const [attemptRows, profileRows, groupRows] = await Promise.all([
    selectRows("class_run_attempts", { select: "*", class_id: `eq.${classId}`, order: "updated_at.desc" }),
    selectRows("profiles", { select: "*" }),
    selectRows("groups", { select: "*", class_id: `eq.${classId}` })
  ]);

  const profileNames = new Map(rowsOnly(profileRows).map((row) => [String(row.id), mapProfile(row).displayName]));
  const groupNames = new Map(rowsOnly(groupRows).map((row) => [String(row.id), mapGroup(row).name]));

  return rowsOnly(attemptRows).map((row) => {
    const attempt = mapAttempt(row);
    return {
      ...attempt,
      studentDisplayName: profileNames.get(attempt.studentProfileId) ?? "Student",
      groupName: groupNames.get(attempt.groupId) ?? "Unknown group"
    };
  });
}

export async function getClassRunAttemptWithDecisions(input: { classId: string; attemptId: string }) {
  if (!hasDataBackend()) return null;

  const attemptRows = rowsOnly(await selectRows("class_run_attempts", {
    select: "*",
    id: `eq.${input.attemptId}`,
    class_id: `eq.${input.classId}`,
    limit: "1"
  }));
  if (!attemptRows.length) return null;

  const attempt = mapAttempt(attemptRows[0]);
  const decisionRows = rowsOnly(await selectRows("class_policy_decisions", {
    select: "*",
    attempt_id: `eq.${attempt.id}`,
    order: "round.asc"
  }));
  const feedbackByDecision = await getFeedbackForDecisionIds(decisionRows.map((row) => String(row.id)));

  const [profileRows, groupRows] = await Promise.all([
    selectRows("profiles", { select: "*", id: `eq.${attempt.studentProfileId}`, limit: "1" }),
    selectRows("groups", { select: "*", id: `eq.${attempt.groupId}`, limit: "1" })
  ]);
  const profile = rowsOnly(profileRows)[0];
  const group = rowsOnly(groupRows)[0];

  return {
    ...attempt,
    studentDisplayName: profile ? mapProfile(profile).displayName : "Student",
    groupName: group ? mapGroup(group).name : "Unknown group",
    decisions: decisionRows.map((row) => mapDecision(row, feedbackByDecision.get(String(row.id)) ?? null))
  };
}

export async function getDecisionAttempt(decisionId: string) {
  if (!hasDataBackend()) return null;
  const decisionRows = rowsOnly(await selectRows("class_policy_decisions", {
    select: "*",
    id: `eq.${decisionId}`,
    limit: "1"
  }));
  if (!decisionRows.length) return null;

  const decision = mapDecision(decisionRows[0]);
  const attemptRows = rowsOnly(await selectRows("class_run_attempts", {
    select: "*",
    id: `eq.${decision.attemptId}`,
    limit: "1"
  }));
  if (!attemptRows.length) return null;
  return { decision, attempt: mapAttempt(attemptRows[0]) };
}

export async function upsertTeacherDecisionFeedback(input: {
  decisionId: string;
  teacherProfileId: string;
  mark: TeacherFeedbackMark;
  comment: string;
}) {
  if (!hasDataBackend()) return null;
  const now = new Date().toISOString();
  const rows = rowsOnly(await upsertRow(
    "teacher_decision_feedback",
    {
      decision_id: input.decisionId,
      teacher_profile_id: input.teacherProfileId,
      mark: input.mark,
      comment: input.comment,
      updated_at: now
    },
    "decision_id"
  ));
  return mapFeedback(rows[0]);
}

export async function listStudentRunFeedback(input: { profileId: string; runId: string }) {
  if (!hasDataBackend()) return [];
  const attemptRows = rowsOnly(await selectRows("class_run_attempts", {
    select: "*",
    student_profile_id: `eq.${input.profileId}`,
    run_id: `eq.${input.runId}`,
    limit: "1"
  }));
  if (!attemptRows.length) return [];

  const attempt = mapAttempt(attemptRows[0]);
  const decisionRows = rowsOnly(await selectRows("class_policy_decisions", {
    select: "*",
    attempt_id: `eq.${attempt.id}`,
    order: "round.asc"
  }));
  const feedbackByDecision = await getFeedbackForDecisionIds(decisionRows.map((row) => String(row.id)));
  return decisionRows.map((row) => mapDecision(row, feedbackByDecision.get(String(row.id)) ?? null));
}

export async function createLegalAcceptances(input: {
  profileId: string;
  jurisdiction: string;
  acceptedBy: AcceptedBy;
  acceptanceContext?: AcceptanceContext;
  classId?: string;
  groupId?: string;
  policyKeys?: PolicyKey[];
}) {
  if (!hasDataBackend()) return [];

  const now = new Date().toISOString();
  const keys = input.policyKeys ?? ["privacy", "terms", "schoolPrivacy", "childrenPrivacy"];
  const payload: LegalAcceptance[] = [];

  for (const policyKey of keys) {
    const id = randomUUID();
    await insertRow("legal_acceptances", {
      id,
      profile_id: input.profileId,
      policy_key: policyKey,
      policy_version: POLICY_VERSIONS[policyKey],
      jurisdiction: input.jurisdiction,
      accepted_by: input.acceptedBy,
      acceptance_context: input.acceptanceContext ?? schoolPolicyAcceptanceContext(),
      class_id: input.classId ?? null,
      group_id: input.groupId ?? null,
      created_at: now
    });
    payload.push({
      id,
      profileId: input.profileId,
      policyKey,
      policyVersion: POLICY_VERSIONS[policyKey],
      jurisdiction: input.jurisdiction,
      acceptedBy: input.acceptedBy,
      acceptanceContext: input.acceptanceContext ?? schoolPolicyAcceptanceContext(),
      classId: input.classId ?? null,
      groupId: input.groupId ?? null,
      createdAt: now
    });
  }

  return payload;
}

export async function getClassroomBundle(classId: string): Promise<ClassroomBundle | null> {
  if (!hasDataBackend()) return null;

  const classroom = await getClassroom(classId);
  if (!classroom) return null;

  const [groups, tokens, memberships, profiles, attempts] = await Promise.all([
    selectRows("groups", { select: "*", class_id: `eq.${classId}`, order: "sort_order.asc" }),
    selectRows("join_tokens", { select: "*", class_id: `eq.${classId}`, order: "created_at.desc" }),
    selectRows("class_memberships", { select: "*", class_id: `eq.${classId}`, order: "created_at.asc" }),
    selectRows("profiles", { select: "*" }),
    selectRows("class_run_attempts", { select: "*", class_id: `eq.${classId}`, order: "updated_at.desc" })
  ]);

  const parsedGroups = rowsOnly(groups);
  const parsedTokens = rowsOnly(tokens);
  const parsedMemberships = rowsOnly(memberships);
  const parsedProfiles = rowsOnly(profiles);
  const parsedAttempts = rowsOnly(attempts);

  const profileNames = new Map(parsedProfiles.map((row) => [String(row.id), mapProfile(row).displayName]));
  const groupNames = new Map(parsedGroups.map((row) => [String(row.id), mapGroup(row).name]));

  return {
    classroom,
    groups: parsedGroups.map(mapGroup),
    tokens: parsedTokens.map(mapToken),
    memberships: parsedMemberships.map((row) => {
      const membership = mapMembership(row);
      return {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        profileId: membership.profileId,
        groupId: membership.groupId,
        displayName: profileNames.get(membership.profileId) ?? "Student"
      };
    }),
    attempts: parsedAttempts.map((row) => {
      const attempt = mapAttempt(row);
      return {
        ...attempt,
        studentDisplayName: profileNames.get(attempt.studentProfileId) ?? "Student",
        groupName: groupNames.get(attempt.groupId) ?? "Unknown group"
      };
    })
  };
}
