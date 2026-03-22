import { redirect } from "next/navigation";

import { StudentLoginForm } from "@/components/student-view/StudentLoginForm";
import { getCurrentStudentSession } from "@/lib/auth";
import { isMockMode } from "@/lib/mock-data";
import { getDivisionTheme } from "@/lib/services/settings.service";
import { getDivisionStudents } from "@/lib/services/student.service";

type StudentLoginPageProps = {
  params: {
    division: string;
  };
};

export default async function StudentLoginPage({ params }: StudentLoginPageProps) {
  const currentSession = await getCurrentStudentSession(params.division);

  if (currentSession) {
    redirect(`/${params.division}/student`);
  }

  const [division, students] = await Promise.all([
    getDivisionTheme(params.division),
    isMockMode() ? getDivisionStudents(params.division) : Promise.resolve([]),
  ]);

  const sampleLogin =
    students[0]
      ? {
          studentNumber: students[0].studentNumber,
          name: students[0].name,
        }
      : null;

  return (
    <StudentLoginForm
      divisionSlug={params.division}
      divisionName={division.fullName}
      sampleLogin={sampleLogin}
    />
  );
}
