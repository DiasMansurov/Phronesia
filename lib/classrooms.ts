import type { AgeBand, Classroom, ClassroomGroup, ClassroomRunAttempt, JoinToken, UserProfile } from "@/lib/game/types";

export function makeJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function defaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

export function buildJoinUrl(token: string, origin?: string) {
  if (origin) {
    return `${origin.replace(/\/$/, "")}/join/${token}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const fallback = "http://localhost:3000";
  return `${appUrl ?? fallback}/join/${token}`;
}

export function profileDisplayName(profile: Pick<UserProfile, "displayName" | "role">) {
  return profile.displayName || (profile.role === "teacher" ? "Teacher" : "Student");
}

export function classroomAgeBandLabel(ageBand: AgeBand) {
  switch (ageBand) {
    case "under_13":
      return "Under 13";
    case "13_to_local_digital_consent_age":
      return "13 to local digital consent age";
    case "above_local_digital_consent_age":
      return "Above local digital consent age";
  }
}

export type ClassroomBundle = {
  classroom: Classroom;
  groups: ClassroomGroup[];
  tokens: JoinToken[];
  memberships: Array<{
    id: string;
    role: string;
    status: string;
    profileId: string;
    groupId: string;
    displayName: string;
  }>;
  attempts: ClassroomRunAttempt[];
};
