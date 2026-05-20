import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getInvestmentTeamSession,
  type InvestmentAccountView,
  type InvestmentCompetitionView
} from "@/lib/server-investments";

export const INVESTMENT_COMPETITION_COOKIE = "phronesia_investment_competition_code";
export const INVESTMENT_TEAM_SESSION_COOKIE = "phronesia_investment_team_session";

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
      reason: "missing_access";
      accountId: null;
      teamName: null;
      account: null;
      competition: null;
      competitionCode: null;
      expiresAt: null;
    };

export async function getInvestmentTeamSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(INVESTMENT_TEAM_SESSION_COOKIE)?.value ?? null;
}

export async function setInvestmentTeamSessionCookie(token: string, expiresAt: string) {
  const cookieStore = await cookies();
  const expires = new Date(expiresAt);
  cookieStore.set(INVESTMENT_TEAM_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
  cookieStore.delete(INVESTMENT_COMPETITION_COOKIE);
}

export async function clearInvestmentTeamSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(INVESTMENT_TEAM_SESSION_COOKIE);
  cookieStore.delete(INVESTMENT_COMPETITION_COOKIE);
}

export async function getInvestmentAccess(): Promise<InvestmentAccess> {
  const token = await getInvestmentTeamSessionCookie();
  const session = await getInvestmentTeamSession(token);
  if (session) {
    return {
      allowed: true,
      reason: "team_session",
      accountId: session.accountId,
      teamName: session.teamName,
      account: session.account,
      competition: session.competition,
      competitionCode: session.competitionCode,
      expiresAt: session.expiresAt
    };
  }

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

export async function requireInvestmentStudentAccess() {
  const access = await getInvestmentAccess();
  if (access.allowed) return { access, errorResponse: null };

  return {
    access,
    errorResponse: NextResponse.json(
      {
        ok: false,
        error:
          "Investment Challenge market data is available only inside the protected student competition area. Enter a valid competition code, team name, and team password."
      },
      { status: 401 }
    )
  };
}
