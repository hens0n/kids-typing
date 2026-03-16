import { redirect } from "next/navigation";

import { CourseShell } from "@/components/course-shell";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { getCourseProgressForUser } from "@/lib/progress";

export default async function LearnPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const progress = getCourseProgressForUser(user.id);

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Typing dojo</p>
          <h1>Typing course</h1>
        </div>
        <LogoutButton />
      </header>

      <CourseShell initialProgress={progress} userName={user.displayName} />
    </main>
  );
}
