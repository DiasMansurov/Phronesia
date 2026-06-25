import { NextResponse } from "next/server";

import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { getInvestmentAdminTeamDetail, listInvestmentAdminResults } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type CsvRow = Record<string, unknown>;

export async function GET(request: Request) {
  const organizer = await requireInvestmentAdmin();
  if (organizer.errorResponse) {
    return noStoreJson({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "leaderboard";
  const competitionCode = searchParams.get("competitionCode") || "Teenvestor.school";
  try {
    const results = await listInvestmentAdminResults(competitionCode);

    if (type === "trades") {
      const detailRows = await Promise.all(results.teams.map((team) => getInvestmentAdminTeamDetail(team.teamId, competitionCode)));
      const rows = detailRows.flatMap((detail) =>
        detail.trades.map((trade) => ({
          team_name: trade.teamName,
          date_time: trade.createdAt,
          action: trade.action ?? trade.side,
          side: trade.side.toUpperCase(),
          symbol: trade.symbol,
          asset_name: trade.assetName,
          quantity: trade.quantity,
          leverage: trade.leverage,
          price: trade.price,
          gross_value: trade.grossValue,
          margin_used: trade.marginUsed,
          exposure_value: trade.exposureValue,
          fee: trade.feeAmount,
          net_value: trade.netValue,
          realized_pnl: trade.realizedPnl,
          price_source: trade.priceSource,
          price_timestamp: trade.priceTimestamp,
          rejected: trade.rejected,
          reject_reason: trade.rejectReason
        }))
      );

      return csvResponse(rows, [
        "team_name",
        "date_time",
        "action",
        "side",
        "symbol",
        "asset_name",
        "quantity",
        "leverage",
        "price",
        "gross_value",
        "margin_used",
        "exposure_value",
        "fee",
        "net_value",
        "realized_pnl",
        "price_source",
        "price_timestamp",
        "rejected",
        "reject_reason"
      ], "teenvestor-investment-trades.csv");
    }

    const rows = results.teams.map((team) => ({
      rank: team.rank,
      team_name: team.teamName,
      cash_balance: team.cashBalance,
      holdings_value: team.holdingsValue,
      locked_margin: team.lockedMargin,
      total_exposure: team.totalExposure,
      unrealized_pnl: team.unrealizedPnl,
      total_portfolio_value: team.totalPortfolioValue,
      profit_loss: team.profitLoss,
      return_percent: team.returnPercent,
      trades_count: team.tradesCount,
      holdings_count: team.holdingsCount,
      open_positions_count: team.openPositionsCount,
      last_activity: team.lastActivity,
      status: team.status
    }));

    return csvResponse(rows, [
      "rank",
      "team_name",
      "cash_balance",
      "holdings_value",
      "locked_margin",
      "total_exposure",
      "unrealized_pnl",
      "total_portfolio_value",
      "profit_loss",
      "return_percent",
      "trades_count",
      "holdings_count",
      "open_positions_count",
      "last_activity",
      "status"
    ], "teenvestor-investment-leaderboard.csv");
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error ?? "Failed to export admin results.")
      },
      { status: 500 }
    );
  }
}

function csvResponse(rows: CsvRow[], headers: string[], filename: string) {
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
