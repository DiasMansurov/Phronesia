import { NextResponse } from "next/server";

import { requireResultsOrganizer } from "@/lib/server-results-auth";
import { listInvestmentAdminBundle } from "@/lib/server-investments";

export async function GET(request: Request) {
  const organizer = await requireResultsOrganizer();
  if (organizer.errorResponse) return organizer.errorResponse;

  const bundle = await listInvestmentAdminBundle();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "trades") {
    const csv = toCsv(bundle.trades as Record<string, unknown>[], [
      "created_at",
      "team_name",
      "account_id",
      "symbol",
      "side",
      "quantity",
      "price",
      "gross_value",
      "fee_amount",
      "net_value",
      "rejected",
      "reject_reason"
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="phronesia-investment-trades.csv"'
      }
    });
  }
  if (searchParams.get("format") === "csv") {
    const csv = toCsv(bundle.leaderboard as Record<string, unknown>[]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="phronesia-investment-leaderboard.csv"'
      }
    });
  }

  return NextResponse.json({ ok: true, ...bundle });
}

function toCsv(rows: Record<string, unknown>[], customHeaders?: string[]) {
  const headers = customHeaders ?? [
    "rank_position",
    "team_name",
    "starting_cash",
    "total_value",
    "profit_loss",
    "total_return",
    "trade_count",
    "overall_score",
    "risk_adjusted_score",
    "diversification_score",
    "risk_score",
    "thesis_score",
    "drawdown_score",
    "updated_at"
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
