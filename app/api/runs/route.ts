import { NextResponse } from "next/server";

import { insertRow, selectRows, supabaseConfigured } from "@/lib/supabase-rest";

export async function GET() {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: true, persisted: false, runs: [] });
    }

    const rows = await selectRows("run_submissions", {
      select:
        "run_id,scenario_id,scenario_title,difficulty_id,score,rank_title,victory,rounds_completed,avg_growth,avg_inflation,avg_unemployment,avg_approval,created_at",
      order: "score.desc",
      limit: "50"
    });

    if ("ok" in rows && rows.ok === false) {
      return NextResponse.json({ ok: true, persisted: false, runs: [] });
    }

    return NextResponse.json({ ok: true, persisted: true, runs: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      runId?: string;
      scenarioId?: string;
      scenarioTitle?: string;
      difficultyId?: string;
      score?: number;
      rankTitle?: string;
      victory?: boolean;
      summary?: string;
      roundsCompleted?: number;
      avgGrowth?: number;
      avgInflation?: number;
      avgUnemployment?: number;
      avgApproval?: number;
    };

    if (!body.runId || !body.scenarioId || typeof body.score !== "number") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: true, persisted: false, reason: "missing_supabase_env" });
    }

    await insertRow("run_submissions", {
      run_id: body.runId,
      scenario_id: body.scenarioId,
      scenario_title: body.scenarioTitle ?? null,
      difficulty_id: body.difficultyId ?? null,
      score: body.score,
      rank_title: body.rankTitle ?? null,
      victory: Boolean(body.victory),
      summary: body.summary ?? null,
      rounds_completed: body.roundsCompleted ?? null,
      avg_growth: body.avgGrowth ?? null,
      avg_inflation: body.avgInflation ?? null,
      avg_unemployment: body.avgUnemployment ?? null,
      avg_approval: body.avgApproval ?? null
    });

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
