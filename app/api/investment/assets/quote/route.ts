import { NextResponse } from "next/server";

import { validateAsset } from "@/lib/server-investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol.trim()) {
    return NextResponse.json({ error: "symbol is required." }, { status: 400 });
  }

  const validation = await validateAsset(symbol);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, reason: validation.reason }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    quote: {
      ...validation.asset,
      latestClose: validation.price.latestClose,
      priceDate: validation.price.priceDate,
      provider: validation.price.provider,
      priceAvailable: validation.price.priceAvailable,
      priceSource: validation.price.priceSource,
      priceMessage: validation.price.priceMessage
    }
  });
}
