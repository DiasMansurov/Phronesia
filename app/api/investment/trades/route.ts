import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { executeInvestmentTrade } from "@/lib/server-investments";
import type { TradeSide } from "@/lib/investment-challenge";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const body = (await request.json().catch(() => ({}))) as {
    accountId?: string;
    symbol?: string;
    side?: TradeSide;
    quantity?: number;
  };

  if (!body.accountId || !body.symbol || !body.side || typeof body.quantity !== "number") {
    return NextResponse.json({ error: "accountId, symbol, side, and quantity are required." }, { status: 400 });
  }
  if (access.access.allowed && body.accountId !== access.access.accountId) {
    return NextResponse.json({ error: "You can only trade from the current team portfolio." }, { status: 403 });
  }

  try {
    const result = await executeInvestmentTrade({
      accountId: body.accountId,
      symbol: body.symbol,
      side: body.side,
      quantity: body.quantity
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true, account: result.account, price: result.price, fee: result.fee, gross: result.gross, net: result.net });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute investment trade." },
      { status: 500 }
    );
  }
}
