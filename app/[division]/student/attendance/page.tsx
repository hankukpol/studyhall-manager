import { notFound } from "next/navigation";

import { AttendanceCalendar } from "@/components/student-view/AttendanceCalendar";
import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
import { requireDivisionStudentAccess } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { getStudentDashboardData } from "@/lib/services/student-dashboard.service";

type StudentAttendancePageProps = {
  params: {
    division: string;
  };
};

const legendItems = [
  { label: "출석", className: "border-slate-200 bg-white text-emerald-700" },
  { label: "지각", className: "border-slate-200 bg-white text-amber-700" },
  { label: "결석", className: "border-slate-200 bg-white text-rose-700" },
  { label: "사유/외출", className: "border-slate-300 bg-slate-100 text-slate-700" },
  { label: "미처리 일정", className: "border-slate-200 bg-white text-slate-500" },
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
        description="이번 주 교시별 출석 현황과 월간 필수 교시 기준 출석률을 확인합니다."
      >
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">이번 달 출석률</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">
              {data.summary.monthlyAttendanceRate}%
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {data.summary.monthlyAttendedCount}/{data.summary.monthlyExpectedCount} 교시
            </p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">이번 주 출석</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">
              {data.summary.weeklyAttendedCount}/{data.summary.weeklyExpectedCount}
            </p>
            <p className="mt-2 text-sm text-slate-600">필수 교시 종료분 기준</p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">운영 안내</p>
            <p className="mt-3 text-xl font-bold text-slate-950">운영 요일과 교시 기준 자동 반영</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              휴무일은 별도 색으로 표시하고, 아직 시작 전 교시는 예정으로 보입니다.
            </p>
          </article>
        </section>

        <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Attendance
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">주간 교시별 출석표</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {legendItems.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${item.className}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
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
