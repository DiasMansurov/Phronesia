import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { closeInvestmentPosition } from "@/lib/server-investments";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ positionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const { positionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { accountId?: string };
  if (!body.accountId) return NextResponse.json({ ok: false, reason: "accountId is required." }, { status: 400 });
  if (access.access.allowed && body.accountId !== access.access.accountId) {
    return NextResponse.json({ ok: false, reason: "You can only trade from the current team portfolio." }, { status: 403 });
  }

  const result = await closeInvestmentPosition({ accountId: body.accountId, positionId });
  if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });

  return NextResponse.json({
    ok: true,
    account: result.account,
    price: result.price,
    fee: result.fee,
    margin: result.margin,
    exposure: result.exposure,
    realizedPnl: result.realizedPnl,
    liquidated: result.liquidated
  });
}
