import { NextResponse } from "next/server";

import {
  clearInvestmentTeamSessionCookie,
  getInvestmentAccess,
  investmentTeamSessionConfigured,
  setInvestmentTeamSessionCookie
} from "@/lib/investment-access";
import {
  createOrEnterInvestmentTeam,
  type InvestmentTeamAccessDiagnostics
} from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TEAM_ACCESS_TIMEOUT_MS = 15_000;
const HIGH_LOAD_MESSAGE = "Server is processing many teams right now. Please wait 1–2 minutes and try once again.";

class TeamAccessTimeoutError extends Error {
  constructor() {
    super(HIGH_LOAD_MESSAGE);
    this.name = "TeamAccessTimeoutError";
  }
}

async function withTeamAccessTimeout<T>(operation: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new TeamAccessTimeoutError()), TEAM_ACCESS_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function errorDetails(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown team access error");
  const code =
    message.match(/"code"\s*:\s*"([^"]+)"/i)?.[1] ??
    message.match(/\b(23\d{3}|PGRST\d+)\b/i)?.[1] ??
    null;
  return { message, code };
}

function logTeamAccessFailure(input: {
  action: string;
  teamName: string;
  competitionCode: string;
  startedAt: number;
  diagnostics: InvestmentTeamAccessDiagnostics;
  sessionCreationDurationMs?: number | null;
  reason: string;
  error?: unknown;
}) {
  const thrown = input.error ? errorDetails(input.error) : null;
  console.error(
    "INVESTMENT_TEAM_ACCESS_FAILED",
    JSON.stringify({
      action: input.action,
      teamName: input.teamName,
      competitionCode: input.competitionCode,
      totalDurationMs: Date.now() - input.startedAt,
      stepDurationsMs: input.diagnostics.steps,
      passwordVerificationDurationMs: input.diagnostics.steps.passwordVerificationMs ?? null,
      sessionCreationDurationMs: input.sessionCreationDurationMs ?? null,
      supabaseErrorMessage: input.diagnostics.supabaseErrorMessage ?? thrown?.message ?? null,
      supabaseErrorCode: input.diagnostics.supabaseErrorCode ?? thrown?.code ?? null,
      finalErrorReason: input.reason
    })
  );
}

export async function GET() {
  const access = await getInvestmentAccess();
  return NextResponse.json({
    ok: access.allowed,
    accountId: access.allowed ? access.accountId : null,
    teamName: access.allowed ? access.teamName : null,
    competition: access.allowed ? access.competition : null,
    account: access.allowed ? access.account : null
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!investmentTeamSessionConfigured()) {
    return NextResponse.json({ ok: false, reason: "Team session secret is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    competitionCode?: string;
    teamName?: string;
    password?: string;
    confirmPassword?: string;
    mode?: "create" | "login";
  };
  const action = body.mode ?? "unknown";
  const teamName = body.teamName?.trim().replace(/\s+/g, " ") ?? "";
  const competitionCode = body.competitionCode?.trim() ?? "";
  const diagnostics: InvestmentTeamAccessDiagnostics = {
    steps: {},
    supabaseErrorMessage: null,
    supabaseErrorCode: null,
    finalErrorReason: null
  };

  if (body.mode !== "create" && body.mode !== "login") {
    return NextResponse.json({ ok: false, reason: "Choose whether to create a team or log in." }, { status: 400 });
  }

  if (body.mode === "create" && body.password !== body.confirmPassword) {
    return NextResponse.json({ ok: false, reason: "Passwords do not match." }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof createOrEnterInvestmentTeam>>;
  try {
    result = await withTeamAccessTimeout(
      createOrEnterInvestmentTeam(
        {
          competitionCode,
          teamName,
          password: body.password ?? "",
          mode: body.mode
        },
        diagnostics
      )
    );
  } catch (error) {
    const reason = error instanceof TeamAccessTimeoutError ? HIGH_LOAD_MESSAGE : "Team access is temporarily unavailable. Please wait 1–2 minutes and try once again.";
    diagnostics.finalErrorReason = reason;
    logTeamAccessFailure({ action, teamName, competitionCode, startedAt, diagnostics, reason, error });
    return NextResponse.json({ ok: false, reason }, { status: 503 });
  }

  if (!result.ok) {
    logTeamAccessFailure({
      action,
      teamName,
      competitionCode,
      startedAt,
      diagnostics,
      reason: result.reason
    });
    return NextResponse.json({ ok: false, reason: result.reason }, { status: result.status });
  }

  const sessionStartedAt = Date.now();
  const cookieResult = await setInvestmentTeamSessionCookie(result.session.account);
  const sessionCreationDurationMs = Date.now() - sessionStartedAt;
  if (!cookieResult.ok) {
    logTeamAccessFailure({
      action,
      teamName,
      competitionCode,
      startedAt,
      diagnostics,
      sessionCreationDurationMs,
      reason: cookieResult.reason
    });
    return NextResponse.json({ ok: false, reason: cookieResult.reason }, { status: 500 });
  }

  console.info(
    "INVESTMENT_TEAM_ACCESS_SUCCESS",
    JSON.stringify({
      action,
      teamName,
      competitionCode,
      created: result.session.created,
      totalDurationMs: Date.now() - startedAt,
      stepDurationsMs: diagnostics.steps,
      passwordVerificationDurationMs: diagnostics.steps.passwordVerificationMs ?? null,
      sessionCreationDurationMs
    })
  );

  return NextResponse.json({
    ok: true,
    message: result.session.message,
    created: result.session.created,
    competition: result.session.competition,
    account: result.session.account,
    redirectTo: "/investment-challenge/app"
  });
}

export async function DELETE() {
  await clearInvestmentTeamSessionCookie();
  return NextResponse.json({ ok: true });
}
