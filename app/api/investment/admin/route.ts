import { NextResponse } from "next/server";

import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { listInvestmentAdminBundle } from "@/lib/server-investments";

export async function GET(request: Request) {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

  const bundle = await listInvestmentAdminBundle();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "csv") {
    const csv = toCsv(bundle.leaderboard);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="phronesia-investment-leaderboard.csv"'
      }
    });
  }

  return NextResponse.json({ ok: true, ...bundle });
}

function toCsv(rows: Record<string, unknown>[]) {
  const headers = [
    "rank_position",
    "team_name",
    "total_value",
    "total_return",
    "overall_score",
    "risk_adjusted_score",
    "diversification_score",
    "thesis_score",
    "drawdown_score",
    "updated_at"
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
