import { NextResponse } from "next/server";

import { searchAssets } from "@/lib/server-investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await searchAssets(query);
  return NextResponse.json({ ok: true, results });
}
