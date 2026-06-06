import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { openInvestmentPosition } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const body = (await request.json().catch(() => ({}))) as {
    accountId?: string;
    symbol?: string;
    side?: "long" | "short";
    quantity?: number;
    leverage?: number;
  };

  if (!body.accountId || !body.symbol || !body.side || typeof body.quantity !== "number" || typeof body.leverage !== "number") {
    return NextResponse.json({ ok: false, reason: "accountId, symbol, side, quantity, and leverage are required." }, { status: 400 });
  }
  if (access.access.allowed && body.accountId !== access.access.accountId) {
    return NextResponse.json({ ok: false, reason: "You can only trade from the current team portfolio." }, { status: 403 });
  }

  const result = await openInvestmentPosition({
    accountId: body.accountId,
    symbol: body.symbol,
    side: body.side,
    quantity: body.quantity,
    leverage: body.leverage
  });

  if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });

  return NextResponse.json({
    ok: true,
    account: result.account,
    price: result.price,
    fee: result.fee,
    margin: result.margin,
    exposure: result.exposure
  });
}
