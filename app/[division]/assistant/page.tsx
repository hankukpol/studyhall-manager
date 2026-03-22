import Link from "next/link";
import { BookOpenCheck, CalendarDays, Clock3, Users } from "lucide-react";

import { getAttendanceSnapshot } from "@/lib/services/attendance.service";
import { getCurrentPeriod, getPeriods } from "@/lib/services/period.service";

type AssistantPageProps = {
  params: {
    division: string;
  };
};

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function AssistantPage({ params }: AssistantPageProps) {
  const today = getKstToday();
  const [currentPeriod, periods] = await Promise.all([
    getCurrentPeriod(params.division),
    getPeriods(params.division),
  ]);

  const activePeriods = periods.filter((period) => period.isActive);
  const snapshot = currentPeriod
    ? await getAttendanceSnapshot(params.division, today, currentPeriod.id)
    : null;
  const processedCount = snapshot?.records.length ?? 0;
  const totalStudents = snapshot?.students.length ?? 0;
  const remainingCount = Math.max(totalStudents - processedCount, 0);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200-white/10 bg-white/5 p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-white/55">Assistant Dashboard</p>
        <h1 className="mt-3 text-2xl font-bold">조교 출결 체크</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          조교 화면은 출결 확인과 저장만 할 수 있습니다. 현재 교시와 오늘 처리 현황을 확인한 뒤
          출결체크 화면으로 이동하세요.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-[24px] border border-slate-200-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white/70">
            <Clock3 className="h-4 w-4" />
            <span className="text-sm">현재 교시</span>
          </div>
          <p className="mt-3 text-2xl font-bold">
            {currentPeriod ? currentPeriod.name : "진행 중인 교시 없음"}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {currentPeriod ? `${currentPeriod.startTime} - ${currentPeriod.endTime}` : today}
          </p>
        </article>

        <article className="rounded-[24px] border border-slate-200-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white/70">
            <BookOpenCheck className="h-4 w-4" />
            <span className="text-sm">오늘 처리 현황</span>
          </div>
          <p className="mt-3 text-2xl font-bold">
            {currentPeriod ? `${processedCount}/${totalStudents}` : `${activePeriods.length}개 교시`}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {currentPeriod ? `미처리 ${remainingCount}명` : "오늘 운영 중인 교시 수"}
          </p>
        </article>

        <article className="rounded-[24px] border border-slate-200-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white/70">
            <Users className="h-4 w-4" />
            <span className="text-sm">대상 인원</span>
          </div>
          <p className="mt-3 text-2xl font-bold">{totalStudents || "-"}</p>
          <p className="mt-2 text-sm text-white/60">현재 교시 기준 출결 대상 학생 수</p>
        </article>

        <article className="rounded-[24px] border border-slate-200-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white/70">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">기준 날짜</span>
          </div>
          <p className="mt-3 text-2xl font-bold">{today}</p>
          <p className="mt-2 text-sm text-white/60">출결 체크와 저장 기준 날짜</p>
        </article>
      </section>

      <Link
        href={`/${params.division}/assistant/check`}
        className="inline-flex w-full items-center justify-center rounded-[24px] bg-white px-4 py-4 text-base font-bold text-slate-950"
      >
        출결체크 화면으로 이동
      </Link>
    </div>
  );
}
