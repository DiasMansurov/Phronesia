import { auth } from "@clerk/nextjs/server";

import { JoinClassroomFlow } from "@/components/teachers/join-classroom-flow";

export default async function JoinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (hasClerk) {
    await auth();
  }

  const { token } = await params;
  return <JoinClassroomFlow token={token} />;
}
