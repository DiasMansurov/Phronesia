import { NextResponse } from "next/server";

import { requireInvestmentStudentAccess } from "@/lib/investment-access";
import { saveInvestmentThesis } from "@/lib/server-investments";

export async function POST(request: Request) {
  const access = await requireInvestmentStudentAccess();
  if (access.errorResponse) return access.errorResponse;

  const body = (await request.json().catch(() => ({}))) as {
    accountId?: string;
    thesis?: string;
    risks?: string;
    diversificationLogic?: string;
    macroView?: string;
  };

  if (!body.accountId) {
    return NextResponse.json({ error: "accountId is required." }, { status: 400 });
  }
  if (access.access.allowed && body.accountId !== access.access.accountId) {
    return NextResponse.json({ error: "You can only edit the current team thesis." }, { status: 403 });
  }

  try {
    const account = await saveInvestmentThesis({
      accountId: body.accountId,
      thesis: body.thesis ?? "",
      risks: body.risks ?? "",
      diversificationLogic: body.diversificationLogic ?? "",
      macroView: body.macroView ?? ""
    });

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save investment thesis." },
      { status: 500 }
    );
  }
}
