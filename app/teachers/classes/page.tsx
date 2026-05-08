import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { ClassroomsDashboard } from "@/components/teachers/classrooms-dashboard";

export default async function TeacherClassesPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const { isAuthenticated } = hasClerk ? await auth() : { isAuthenticated: false };

  if (!hasClerk || !isAuthenticated) {
    return (
      <section className="shell section">
        <div className="panel stack-md">
          <p className="eyebrow">Teacher Dashboard</p>
          <h1>Sign in to create classes</h1>
          <p className="muted">
            Classroom creation uses Clerk accounts plus server-side persistence. Add your Clerk keys and sign in to use
            this dashboard.
          </p>
          <Link className="button primary" href="/teachers">
            Back to For Teachers
          </Link>
        </div>
      </section>
    );
  }

  return <ClassroomsDashboard />;
}
