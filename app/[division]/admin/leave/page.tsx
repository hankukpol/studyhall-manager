import { LeaveManager } from "@/components/leave/LeaveManager";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { getDivisionSettings } from "@/lib/services/settings.service";
import { listLeavePermissions } from "@/lib/services/leave.service";
import { listStudents } from "@/lib/services/student.service";

type AdminLeavePageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminLeavePage({ params }: AdminLeavePageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);

  const [students, permissions, settings] = await Promise.all([
    listStudents(params.division),
    listLeavePermissions(params.division),
    getDivisionSettings(params.division),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200-black/5 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Phase 5-C
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">외출/휴가 관리</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          학생별 외출과 휴가를 등록하고, 월별 사용 현황과 남은 휴가권을 확인할 수 있습니다.
          지난달 미사용 휴가권은 월말 정산으로 일괄 상점 지급까지 이어집니다.
        </p>
      </section>

      <LeaveManager
        divisionSlug={params.division}
        students={students}
        initialPermissions={permissions}
        settings={{
          holidayLimit: settings.holidayLimit,
          halfDayLimit: settings.halfDayLimit,
          healthLimit: settings.healthLimit,
          holidayUnusedPts: settings.holidayUnusedPts,
          halfDayUnusedPts: settings.halfDayUnusedPts,
        }}
      />
    </div>
  );
}
