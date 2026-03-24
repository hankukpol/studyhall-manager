import { StudentListManager } from "@/components/students/StudentListManager";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { listSeatOptions } from "@/lib/services/seat.service";
import { getDivisionGeneralSettings } from "@/lib/services/settings.service";
import { listStudents } from "@/lib/services/student.service";
import { listTuitionPlans } from "@/lib/services/tuition-plan.service";

type StudentsPageProps = {
  params: {
    division: string;
  };
  searchParams?: {
    panel?: string;
  };
};

export default async function StudentsPage({ params, searchParams }: StudentsPageProps) {
  const session = await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);
  const [students, generalSettings, seatOptions, tuitionPlans] = await Promise.all([
    listStudents(params.division),
    getDivisionGeneralSettings(params.division),
    listSeatOptions(params.division, { activeOnly: true }),
    listTuitionPlans(params.division, { activeOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-slate-200-black/5 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
          학생 명단 관리
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          학생 검색, 상태 및 직렬 필터, 경고 단계 확인, 상세 페이지 이동까지 한 화면에서 처리합니다.
        </p>
      </section>

      <StudentListManager
        divisionSlug={params.division}
        initialStudents={students}
        canManage={session.role === "ADMIN" || session.role === "SUPER_ADMIN"}
        studyTrackOptions={generalSettings.studyTracks}
        seatOptions={seatOptions}
        tuitionPlans={tuitionPlans}
        initialCreateOpen={searchParams?.panel === "create"}
      />
    </div>
  );
}
