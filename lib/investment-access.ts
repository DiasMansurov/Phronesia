import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveInvestmentCompetition, type InvestmentCompetitionView } from "@/lib/server-investments";

export const INVESTMENT_COMPETITION_COOKIE = "phronesia_investment_competition_code";

export type InvestmentAccess =
  | {
      allowed: true;
      reason: "clerk" | "competition_code";
      userId: string | null;
      competition: InvestmentCompetitionView | null;
      competitionCode: string | null;
    }
  | {
      allowed: false;
      reason: "missing_access";
      userId: null;
      competition: null;
      competitionCode: null;
    };

async function getClerkUserId() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}

export async function getInvestmentCompetitionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(INVESTMENT_COMPETITION_COOKIE)?.value ?? null;
}

export async function setInvestmentCompetitionCookie(code: string) {
  const cookieStore = await cookies();
  cookieStore.set(INVESTMENT_COMPETITION_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearInvestmentCompetitionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(INVESTMENT_COMPETITION_COOKIE);
}

export async function getInvestmentAccess(): Promise<InvestmentAccess> {
  const userId = await getClerkUserId();
  if (userId) {
    const cookieCode = await getInvestmentCompetitionCookie();
    const competition = cookieCode ? await resolveInvestmentCompetition(cookieCode) : null;
    return {
      allowed: true,
      reason: "clerk",
      userId,
      competition,
      competitionCode: competition?.code ?? cookieCode
    };
  }

  const competitionCode = await getInvestmentCompetitionCookie();
  if (competitionCode) {
    const competition = await resolveInvestmentCompetition(competitionCode);
    if (competition) {
      return {
        allowed: true,
        reason: "competition_code",
        userId: null,
        competition,
        competitionCode: competition.code
      };
    }
  }

  return {
    allowed: false,
    reason: "missing_access",
    userId: null,
    competition: null,
    competitionCode: null
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
          "Investment Challenge market data is available only inside the protected student competition area. Sign in or enter a valid competition code."
      },
      { status: 401 }
    )
  };
}
