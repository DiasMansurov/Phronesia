import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getInvestmentAccountView,
  type InvestmentAccountView,
  type InvestmentCompetitionView
} from "@/lib/server-investments";

export const INVESTMENT_COMPETITION_COOKIE = "phronesia_investment_competition_code";
export const INVESTMENT_TEAM_SESSION_COOKIE = "investment_team_session";
const LEGACY_INVESTMENT_TEAM_SESSION_COOKIE = "phronesia_investment_team_session";
const TEAM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SignedTeamSessionPayload = {
  teamId: string;
  competitionId: string;
  teamName: string;
  expiresAt: string;
};

export type InvestmentAccess =
  | {
      allowed: true;
      reason: "team_session";
      accountId: string;
      teamName: string;
      account: InvestmentAccountView;
      competition: InvestmentCompetitionView;
      competitionCode: string;
      expiresAt: string;
    }
  | {
      allowed: false;
      reason: "missing_access" | "missing_secret";
      accountId: null;
      teamName: null;
      account: null;
      competition: null;
      competitionCode: null;
      expiresAt: null;
    };

function getTeamSessionSecret() {
  return process.env.INVESTMENT_TEAM_SESSION_SECRET?.trim() ?? "";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function createSignedTeamSession(payload: SignedTeamSessionPayload, secret: string) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifySignedTeamSession(value: string, secret: string): SignedTeamSessionPayload | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = signPayload(encodedPayload, secret);
  if (!signaturesMatch(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SignedTeamSessionPayload>;
    if (!payload.teamId || !payload.competitionId || !payload.teamName || !payload.expiresAt) return null;
    if (Date.parse(payload.expiresAt) <= Date.now()) return null;
    return {
      teamId: payload.teamId,
      competitionId: payload.competitionId,
      teamName: payload.teamName,
      expiresAt: payload.expiresAt
    };
  } catch {
    return null;
  }
}

export async function getInvestmentTeamSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(INVESTMENT_TEAM_SESSION_COOKIE)?.value ?? cookieStore.get(LEGACY_INVESTMENT_TEAM_SESSION_COOKIE)?.value ?? null;
}

export async function setInvestmentTeamSessionCookie(account: InvestmentAccountView) {
  const secret = getTeamSessionSecret();
  if (!secret) {
    return { ok: false as const, reason: "Team session secret is not configured." };
  }

  const expiresAt = new Date(Date.now() + TEAM_SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const payload: SignedTeamSessionPayload = {
    teamId: account.account.id,
    competitionId: account.account.competitionId,
    teamName: account.account.teamName,
    expiresAt
  };
  const signedSession = createSignedTeamSession(payload, secret);
  const cookieStore = await cookies();
  cookieStore.set(INVESTMENT_TEAM_SESSION_COOKIE, signedSession, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEAM_SESSION_MAX_AGE_SECONDS
  });
  cookieStore.delete(INVESTMENT_COMPETITION_COOKIE);
  cookieStore.delete(LEGACY_INVESTMENT_TEAM_SESSION_COOKIE);
  return { ok: true as const, expiresAt };
}

export async function clearInvestmentTeamSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(INVESTMENT_TEAM_SESSION_COOKIE);
  cookieStore.delete(LEGACY_INVESTMENT_TEAM_SESSION_COOKIE);
  cookieStore.delete(INVESTMENT_COMPETITION_COOKIE);
}

export async function getInvestmentAccess(): Promise<InvestmentAccess> {
  const secret = getTeamSessionSecret();
  if (!secret) {
    return {
      allowed: false,
      reason: "missing_secret",
      accountId: null,
      teamName: null,
      account: null,
      competition: null,
      competitionCode: null,
      expiresAt: null
    };
  }

  const cookieValue = await getInvestmentTeamSessionCookie();
  const payload = cookieValue ? verifySignedTeamSession(cookieValue, secret) : null;
  if (!payload) {
    return {
      allowed: false,
      reason: "missing_access",
      accountId: null,
      teamName: null,
      account: null,
      competition: null,
      competitionCode: null,
      expiresAt: null
    };
  }

  const account = await getInvestmentAccountView(payload.teamId);
  if (!account || account.account.competitionId !== payload.competitionId) {
    return {
      allowed: false,
      reason: "missing_access",
      accountId: null,
      teamName: null,
      account: null,
      competition: null,
      competitionCode: null,
      expiresAt: null
    };
  }

  return {
    allowed: true,
    reason: "team_session",
    accountId: account.account.id,
    teamName: account.account.teamName,
    account,
    competition: account.competition,
    competitionCode: account.competition.code,
    expiresAt: payload.expiresAt
  };
}

export async function requireInvestmentStudentAccess() {
  const access = await getInvestmentAccess();
  if (access.allowed) return { access, errorResponse: null };

  return {
    access,
    errorResponse: NextResponse.json(
      {
        ok: false,
        error:
          access.reason === "missing_secret"
            ? "Team session secret is not configured."
            : "Student competition access required."
      },
      { status: access.reason === "missing_secret" ? 500 : 401 }
    )
  };
}
