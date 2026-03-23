import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { AttendanceCalendar } from "@/components/student-view/AttendanceCalendar";
import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
import {
  PortalMetricCard,
  PortalSectionHeader,
  portalSectionClass,
} from "@/components/student-view/StudentPortalUi";
import { requireDivisionStudentAccess } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { getStudentDashboardData } from "@/lib/services/student-dashboard.service";

type StudentAttendancePageProps = {
  params: {
    division: string;
  };
};

const legendItems = [
  { label: "출석", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { label: "지각", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { label: "결석", className: "border-rose-200 bg-rose-50 text-rose-700" },
  { label: "사유·휴일", className: "border-slate-300 bg-slate-100 text-slate-700" },
  { label: "예정·미처리", className: "border-slate-200 bg-slate-50 text-slate-500" },
] as const;

export default async function StudentAttendancePage({
  params,
}: StudentAttendancePageProps) {
  const session = await requireDivisionStudentAccess(params.division);

  try {
    const data = await getStudentDashboardData(params.division, session.studentId);

    return (
      <StudentPortalFrame
        division={data.division}
        student={data.student}
        current="attendance"
        title="출석 상세"
        description="이번 주 교시별 출석 상태와 월간 출석률을 모바일 기준으로 보기 쉽게 정리했습니다."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PortalMetricCard
            label="이번 달 출석률"
            value={`${data.summary.monthlyAttendanceRate}%`}
            caption={`${data.summary.monthlyAttendedCount}/${data.summary.monthlyExpectedCount} 교시 반영`}
          />
          <PortalMetricCard
            label="이번 주 출석"
            value={`${data.summary.weeklyAttendedCount}/${data.summary.weeklyExpectedCount}`}
            caption="필수 교시 종료분 기준"
          />
          <PortalMetricCard
            label="운영 안내"
            value="운영 요일 자동 반영"
            caption="휴무일은 별도 상태로 표시되고, 아직 시작 전인 교시는 예정으로 표시됩니다."
            valueToneClassName="text-[var(--division-color)]"
          />
        </section>

        <section className={portalSectionClass}>
          <PortalSectionHeader
            eyebrow="Attendance"
            title="주간 교시별 출석 현황"
            description="모바일에서는 교시별 카드, 넓은 화면에서는 표 형태로 자동 전환됩니다."
            icon={<ClipboardList className="h-4 w-4" />}
            action={
              <div className="flex flex-wrap justify-end gap-2">
                {legendItems.map((item) => (
                  <span
                    key={item.label}
                    className={`inline-flex rounded-[10px] border px-3 py-1.5 text-xs font-semibold ${item.className}`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            }
          />

          <div className="mt-5">
            <AttendanceCalendar weeklyAttendance={data.weeklyAttendance} />
          </div>
        </section>
      </StudentPortalFrame>
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
