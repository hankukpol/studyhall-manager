import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Clock3, Users } from "lucide-react";

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
      <section className="rounded-[28px] border border-black/5 bg-white p-5">
        <div className="rounded-[24px] border border-[#dce8fb] bg-[linear-gradient(135deg,var(--division-color-light)_0%,#ffffff_72%)] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--division-color)]">
            Assistant Dashboard
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">조교 출결 체크</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            PC 화면과 같은 카드형 흐름으로 현재 교시와 처리 현황을 먼저 확인한 뒤, 출석체크 화면에서
            바로 저장할 수 있게 정리했습니다.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/${params.division}/assistant/check`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--division-color)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              출석체크 바로가기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              {today} 기준
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-[24px] border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock3 className="h-4 w-4" />
            <span className="text-sm">현재 교시</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {currentPeriod ? currentPeriod.name : "진행 중인 교시 없음"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {currentPeriod ? `${currentPeriod.startTime} - ${currentPeriod.endTime}` : today}
          </p>
        </article>

        <article className="rounded-[24px] border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BookOpenCheck className="h-4 w-4" />
            <span className="text-sm">오늘 처리 현황</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {currentPeriod ? `${processedCount}/${totalStudents}` : `${activePeriods.length}개 교시`}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {currentPeriod ? `미처리 ${remainingCount}명` : "오늘 운영 중인 교시 수"}
          </p>
        </article>

        <article className="rounded-[24px] border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">대상 인원</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">{totalStudents || "-"}</p>
          <p className="mt-2 text-sm text-slate-600">현재 교시 기준 출결 대상 학생 수</p>
        </article>

        <article className="rounded-[24px] border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">기준 날짜</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">{today}</p>
          <p className="mt-2 text-sm text-slate-600">출결 체크와 저장 기준 날짜</p>
        </article>
      </section>

      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-4 text-sm leading-6 text-slate-600">
        출석체크 화면에서는 오른쪽 스와이프로 출석, 왼쪽 스와이프로 결석을 빠르게 입력할 수 있고,
        상단 요약 카드는 스크롤 중 필요할 때 접어서 학생 명단을 더 넓게 볼 수 있습니다.
      </section>
    </div>
  );
}
