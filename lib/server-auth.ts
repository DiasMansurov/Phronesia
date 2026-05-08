import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireUserId() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      userId: null,
      errorResponse: NextResponse.json({ error: "Authentication is disabled in this local demo." }, { status: 401 })
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return { userId: null, errorResponse: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  return { userId, errorResponse: null };
}
