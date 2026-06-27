import { NextResponse } from "next/server";

import { INVESTMENT_STARTING_CASH } from "@/lib/investment-challenge";
import { requireInvestmentAdmin } from "@/lib/server-investment-admin-auth";
import { selectRows } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Payload = Record<string, unknown>;

function rowStr(row: Payload, key: string) {
  return String(row[key] ?? "");
}

function rowNullStr(row: Payload, key: string): string | null {
  const v = row[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function rowNum(row: Payload, key: string, fallback = 0) {
  const v = row[key];
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function isPositionOpenAction(action: string) {
  return action === "open_long" || action === "open_short";
}

function isPositionCloseAction(action: string) {
  return action === "close_long" || action === "close_short" || action === "liquidated";
}

function calcPositionPnl(side: "long" | "short", entry: number, exit: number, qty: number) {
  return side === "short" ? (entry - exit) * qty : (exit - entry) * qty;
}

function correctedCloseMetrics(input: {
  action: string | null;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  marginLocked: number;
  closingCommission: number;
}) {
  const rawPnl = calcPositionPnl(input.side, input.entryPrice, input.exitPrice, input.quantity);
  const liquidated = input.action === "liquidated" || rawPnl <= -input.marginLocked;
  const correctRealizedPnl = liquidated ? -input.marginLocked : Math.max(rawPnl, -input.marginLocked);
  const closingCommission = liquidated ? 0 : input.closingCommission;
  const cashReturned = Math.max(0, liquidated ? 0 : input.marginLocked + correctRealizedPnl - closingCommission);
  return { correctRealizedPnl, cashReturned, closingCommission, liquidated };
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

export async function POST(request: Request) {
  const admin = await requireInvestmentAdmin();
  if (admin.errorResponse) return admin.errorResponse;

  const body = (await request.json().catch(() => ({}))) as { teamId?: unknown };
  const teamId = String(body.teamId ?? "").trim();
  if (!teamId) return NextResponse.json({ ok: false, error: "teamId required" }, { status: 400 });

  // Load account
  const accountRows = await selectRows("investment_accounts", { select: "*", id: `eq.${teamId}`, limit: "1" });
  const account = Array.isArray(accountRows) && accountRows[0] ? (accountRows[0] as Payload) : null;
  if (!account) return NextResponse.json({ ok: false, error: "Team not found" }, { status: 404 });

  const startingCash = rowNum(account, "starting_cash", INVESTMENT_STARTING_CASH);
  const storedCash = rowNum(account, "cash", rowNum(account, "cash_balance", startingCash));

  // Load current holdings for "before" snapshot
  const holdingPayloads = await selectRows("investment_holdings", {
    select: "*",
    account_id: `eq.${teamId}`,
    order: "symbol.asc"
  });
  const holdingRows = Array.isArray(holdingPayloads) ? (holdingPayloads as Payload[]) : [];
  const storedHoldingsCostBasis = holdingRows
    .filter((h) => rowNum(h, "quantity") > 0)
    .reduce((sum, h) => sum + rowNum(h, "quantity") * rowNum(h, "average_buy_price"), 0);

  // Load current positions for "before" snapshot and close-metrics lookup
  let positionRows: Payload[] = [];
  try {
    const rows = await selectRows("investment_positions", {
      select: "*",
      team_id: `eq.${teamId}`,
      order: "opened_at.asc",
      limit: "1000"
    });
    positionRows = Array.isArray(rows) ? (rows as Payload[]) : [];
  } catch {
    positionRows = [];
  }

  const openPositions = positionRows.filter((p) => rowStr(p, "status") !== "closed" && rowStr(p, "status") !== "liquidated");
  const storedLockedMargin = openPositions.reduce((sum, p) => sum + rowNum(p, "margin_locked"), 0);
  const storedUnrealizedPnl = openPositions.reduce((sum, p) => sum + rowNum(p, "unrealized_pnl"), 0);

  const before = {
    cash: storedCash,
    normalHoldingsCostBasis: round4(storedHoldingsCostBasis),
    lockedMargin: round4(storedLockedMargin),
    unrealizedPnl: round4(storedUnrealizedPnl),
    openPositionsCount: openPositions.length,
    totalValue: round4(storedCash + storedHoldingsCostBasis + storedLockedMargin + storedUnrealizedPnl)
  };

  // Load all trades chronologically for replay
  let tradeRows: Payload[] = [];
  try {
    const rows = await selectRows("investment_trades", {
      select: "*",
      account_id: `eq.${teamId}`,
      order: "created_at.asc",
      limit: "5000"
    });
    tradeRows = Array.isArray(rows) ? (rows as Payload[]) : [];
  } catch {
    tradeRows = [];
  }

  // Index positions by ID for close-metrics lookup
  const positionById = new Map<string, Payload>();
  for (const p of positionRows) {
    const pid = rowStr(p, "id");
    if (pid) positionById.set(pid, p);
  }

  // Index first (open) trade per position for entry-price lookup
  const openTradeByPositionId = new Map<string, Payload>();
  for (const t of tradeRows) {
    const action = rowStr(t, "action");
    const pid = rowNullStr(t, "position_id");
    if (pid && isPositionOpenAction(action)) openTradeByPositionId.set(pid, t);
  }

  // Replay: start from starting_cash and apply each executed trade
  let cash = startingCash;
  const handledPositionIds = new Set<string>();

  // Holdings state built from buy/sell trades (symbol → { quantity, avgBuyPrice, realizedPnl })
  const holdingState = new Map<string, { quantity: number; avgBuyPrice: number; realizedPnl: number }>();

  type BreakdownEntry = {
    tradeId: string;
    createdAt: string;
    action: string | null;
    side: string;
    symbol: string;
    quantity: number;
    price: number;
    positionId: string | null;
    cashBefore: number;
    cashChange: number;
    cashAfter: number;
    note: string;
  };
  const breakdown: BreakdownEntry[] = [];

  for (const trade of tradeRows) {
    if (Boolean(trade.rejected)) continue;

    const tradeId = rowStr(trade, "id");
    const action = rowStr(trade, "action");
    const side = rowStr(trade, "side");
    const symbol = rowStr(trade, "symbol");
    const quantity = rowNum(trade, "quantity");
    const price = rowNum(trade, "price");
    const gross = rowNum(trade, "gross_value", rowNum(trade, "gross_amount", price * quantity));
    const fee = rowNum(trade, "fee_amount");
    const net = rowNum(trade, "net_value", rowNum(trade, "net_amount"));
    const positionId = rowNullStr(trade, "position_id");
    const cashBefore = cash;
    let cashChange = 0;
    let note = "";

    if (isPositionOpenAction(action)) {
      // Leveraged position open: deduct margin + fee
      const margin = rowNum(trade, "margin_used", Math.max(0, net - fee));
      cashChange = -(margin + fee);
      cash += cashChange;
      note = `${action}: margin=${margin.toFixed(2)} fee=${fee.toFixed(2)}`;
      if (positionId) handledPositionIds.add(positionId);
    } else if (isPositionCloseAction(action)) {
      // Leveraged position close: return cash using corrected metrics
      const position = positionId ? positionById.get(positionId) : undefined;
      const openTrade = positionId ? openTradeByPositionId.get(positionId) : undefined;
      const closeSide: "long" | "short" =
        position
          ? rowStr(position, "side") === "short" ? "short" : "long"
          : rowStr(trade, "side") === "short" || action === "close_short" ? "short" : "long";
      const entryPrice = rowNum(position ?? {}, "entry_price", rowNum(openTrade ?? {}, "price"));
      const closeQty = quantity || rowNum(position ?? {}, "quantity", rowNum(openTrade ?? {}, "quantity"));
      const marginLocked = rowNum(trade, "margin_used", rowNum(position ?? {}, "margin_locked"));

      if (entryPrice > 0 && closeQty > 0 && marginLocked > 0) {
        const metrics = correctedCloseMetrics({
          action,
          side: closeSide,
          entryPrice,
          exitPrice: price,
          quantity: closeQty,
          marginLocked,
          closingCommission: fee
        });
        cashChange = metrics.cashReturned;
        cash += cashChange;
        note = `${action}: pnl=${metrics.correctRealizedPnl.toFixed(2)} returned=${metrics.cashReturned.toFixed(2)}${metrics.liquidated ? " [liquidated]" : ""}`;
      } else {
        note = `${action}: insufficient data (entry=${entryPrice} qty=${closeQty} margin=${marginLocked})`;
      }
      if (positionId) handledPositionIds.add(positionId);
    } else if (positionId) {
      // Legacy position trade stored without action column
      if (!handledPositionIds.has(positionId)) {
        // First trade for this position → open (deduct margin + fee)
        const margin = rowNum(trade, "margin_used", Math.max(0, net - fee));
        cashChange = -(margin + fee);
        cash += cashChange;
        note = `legacy open: margin=${margin.toFixed(2)} fee=${fee.toFixed(2)}`;
        handledPositionIds.add(positionId);
      } else {
        // Subsequent trade for this position → close (return cash)
        const position = positionById.get(positionId);
        const closeSide: "long" | "short" = position ? (rowStr(position, "side") === "short" ? "short" : "long") : "long";
        const entryPrice = rowNum(position ?? {}, "entry_price");
        const closeQty = quantity || rowNum(position ?? {}, "quantity");
        const marginLocked = rowNum(position ?? {}, "margin_locked");
        if (price > 0 && closeQty > 0 && marginLocked > 0) {
          const metrics = correctedCloseMetrics({
            action: null,
            side: closeSide,
            entryPrice: entryPrice || price,
            exitPrice: price,
            quantity: closeQty,
            marginLocked,
            closingCommission: fee
          });
          cashChange = metrics.cashReturned;
          cash += cashChange;
          note = `legacy close: returned=${metrics.cashReturned.toFixed(2)}`;
        } else {
          note = `legacy close: insufficient data`;
        }
        handledPositionIds.add(positionId);
      }
    } else if (side === "buy") {
      // Normal stock buy
      cashChange = -(net || gross + fee);
      cash += cashChange;
      const h = holdingState.get(symbol) ?? { quantity: 0, avgBuyPrice: 0, realizedPnl: 0 };
      const totalCost = h.quantity * h.avgBuyPrice + quantity * price;
      h.quantity += quantity;
      h.avgBuyPrice = h.quantity > 0 ? totalCost / h.quantity : 0;
      holdingState.set(symbol, h);
      note = `buy ${quantity} ${symbol} @ ${price.toFixed(2)}`;
    } else if (side === "sell") {
      // Normal stock sell
      cashChange = net || Math.max(0, gross - fee);
      cash += cashChange;
      const h = holdingState.get(symbol);
      if (h && h.quantity > 0) {
        h.realizedPnl += (price - h.avgBuyPrice) * quantity - fee;
        h.quantity = Math.max(0, h.quantity - quantity);
        if (h.quantity === 0) h.avgBuyPrice = 0;
        holdingState.set(symbol, h);
      }
      note = `sell ${quantity} ${symbol} @ ${price.toFixed(2)}`;
    } else {
      note = `skipped (side="${side}" action="${action}")`;
    }

    breakdown.push({
      tradeId,
      createdAt: rowStr(trade, "created_at"),
      action: action || null,
      side,
      symbol,
      quantity,
      price,
      positionId,
      cashBefore: round4(cashBefore),
      cashChange: round4(cashChange),
      cashAfter: round4(cash),
      note
    });
  }

  // "After" holdings cost basis from replayed buy/sell trades
  const afterHoldingsCostBasis = Array.from(holdingState.values())
    .filter((h) => h.quantity > 0)
    .reduce((sum, h) => sum + h.quantity * h.avgBuyPrice, 0);

  const afterHoldings = Array.from(holdingState.entries())
    .filter(([, h]) => h.quantity > 0)
    .map(([sym, h]) => ({
      symbol: sym,
      quantity: round4(h.quantity),
      avgBuyPrice: round4(h.avgBuyPrice),
      costBasis: round4(h.quantity * h.avgBuyPrice),
      realizedPnl: round4(h.realizedPnl)
    }));

  const after = {
    cash: round4(cash),
    normalHoldingsCostBasis: round4(afterHoldingsCostBasis),
    lockedMargin: round4(storedLockedMargin),
    unrealizedPnl: round4(storedUnrealizedPnl),
    openPositionsCount: openPositions.length,
    totalValue: round4(cash + afterHoldingsCostBasis + storedLockedMargin + storedUnrealizedPnl),
    holdingsDetail: afterHoldings
  };

  return NextResponse.json({
    ok: true,
    teamId,
    teamName: rowStr(account, "team_name"),
    startingCash,
    tradesReplayed: breakdown.length,
    before,
    after,
    cashDiff: round4(after.cash - before.cash),
    breakdown
  });
}
