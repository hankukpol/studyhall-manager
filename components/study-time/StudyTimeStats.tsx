"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { StudentStudyTimeStats } from "@/lib/services/study-time.service";

type StudyTimeStatsProps = {
  divisionSlug: string;
  studentId: string;
};

function getKstMonth() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return today.slice(0, 7);
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

export function StudyTimeStats({ divisionSlug, studentId }: StudyTimeStatsProps) {
  const [month, setMonth] = useState(getKstMonth());
  const [stats, setStats] = useState<StudentStudyTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const byDate = stats?.byDate ?? [];
  const byPeriod = stats?.byPeriod ?? [];

  async function fetchStats(targetMonth: string) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${divisionSlug}/study-time?studentId=${studentId}&month=${targetMonth}`,
      );
      if (!res.ok) {
        toast.error("데이터를 불러오는 데 실패했습니다.");
        return;
      }
      const { stats: newStats } = await res.json();
      setStats(newStats);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats(month);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    await fetchStats(newMonth);
  }

  const maxMinutes = Math.max(...byDate.map((d) => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* 월 선택 및 요약 */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs font-medium text-slate-700">조회 월</label>
          <input
            type="month"
            value={month}
            max={getKstMonth()}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="rounded-2xl bg-blue-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Total</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-700">
            {isLoading || !stats ? "..." : formatMinutes(stats.totalMinutes)}
          </p>
          <p className="mt-0.5 text-xs text-blue-500">{month} 기준</p>
        </div>
      </div>

      {/* 일별 막대 차트 */}
      {!stats || isLoading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <Clock className="h-8 w-8 animate-pulse" />
          <p className="text-sm">불러오는 중...</p>
        </div>
      ) : byDate.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <Clock className="h-8 w-8" />
          <p className="text-sm">해당 월의 학습 기록이 없습니다.</p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            일별 학습 시간
          </p>
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {byDate.map(({ date, minutes }) => {
              const heightPct = maxMinutes > 0 ? Math.round((minutes / maxMinutes) * 100) : 0;
              return (
                <div key={date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: "28px" }}>
                  <span className="text-[10px] text-slate-500">{formatMinutes(minutes)}</span>
                  <div
                    className="w-5 rounded-t-sm bg-blue-400 transition-all"
                    style={{ height: `${Math.max(heightPct, 2)}px`, maxHeight: "80px" }}
                    title={`${date}: ${formatMinutes(minutes)}`}
                  />
                  <span className="text-[10px] text-slate-500">{date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 교시별 평균 */}
      {byPeriod.filter((p) => p.avgMinutes > 0).length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            교시별 평균 학습 시간
          </p>
          <div className="space-y-2">
            {byPeriod
              .filter((p) => p.avgMinutes > 0)
              .map((p) => (
                <div key={p.periodId} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-slate-600">{p.periodName}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2">
                    <div
                      className="h-2 rounded-full bg-blue-400"
                      style={{
                        width: `${Math.min(100, Math.round((p.avgMinutes / 300) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-slate-700">
                    {formatMinutes(p.avgMinutes)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
