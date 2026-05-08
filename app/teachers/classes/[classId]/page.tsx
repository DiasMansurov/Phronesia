import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { ClassroomDetail } from "@/components/teachers/classroom-detail";

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const { isAuthenticated } = hasClerk ? await auth() : { isAuthenticated: false };

  if (!hasClerk || !isAuthenticated) {
    return (
      <section className="shell section">
        <div className="panel stack-md">
          <p className="eyebrow">Teacher Dashboard</p>
          <h1>Sign in to open class dashboards</h1>
          <p className="muted">This area is protected so only the teacher who created the class can manage join links.</p>
          <Link className="button primary" href="/teachers/classes">
            Back to classes
          </Link>
        </div>
      </section>
    );
  }

  const { classId } = await params;
  return <ClassroomDetail classId={classId} />;
}
