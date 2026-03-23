"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarX,
  LoaderCircle,
  RefreshCcw,
  Siren,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import type { DivisionOverviewSummary } from "@/lib/services/super-admin-overview.service";

type SuperAdminOverviewProps = {
  initialDivisions: DivisionOverviewSummary[];
};

// ─── 원형 게이지 ──────────────────────────────────────────────────────────────

function CircularGauge({ rate }: { rate: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(rate, 100) / 100);
  const color = rate >= 90 ? "#16a34a" : rate >= 70 ? "#d97706" : "#dc2626";
  const trackColor = rate >= 90 ? "#dcfce7" : rate >= 70 ? "#fef3c7" : "#fee2e2";

  return (
    <svg viewBox="0 0 100 100" className="h-[100px] w-[100px] -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── 지점 카드 ───────────────────────────────────────────────────────────────

function DivisionCard({ d }: { d: DivisionOverviewSummary }) {
  const rateTextColor =
    d.attendanceRate >= 90
      ? "text-green-700"
      : d.attendanceRate >= 70
        ? "text-amber-700"
        : "text-red-700";

  return (
    <article
      className={`overflow-hidden rounded-[10px] border bg-white shadow-sm transition hover:shadow-md ${
        d.isActive ? "border-slate-200" : "border-slate-200 opacity-50"
      }`}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          {/* division color 도트 — 헤더 한정 */}
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: d.color }}
          >
            {d.name.slice(0, 1)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{d.name}</span>
              <span className="text-sm text-slate-400">·</span>
              <span className="text-sm text-slate-500">{d.fullName}</span>
            </div>
            <span className="text-xs text-slate-400">/{d.slug}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!d.isActive && (
            <span className="rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-400">
              비운영
            </span>
          )}
          {d.uncheckedPeriodCount > 0 && (
            <span className="rounded-[4px] bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
              미처리 {d.uncheckedPeriodCount}교시
            </span>
          )}
          <Link
            href={`/${d.slug}/admin`}
            className="flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85"
            style={{ backgroundColor: d.color }}
          >
            어드민 입장
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 카드 본문: 출석률 + 지표 */}
      <div className="flex divide-x divide-slate-100">
        {/* 출석률 게이지 */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-8 py-6">
          <div className="relative flex items-center justify-center">
            <CircularGauge rate={d.attendanceRate} />
            <div className="absolute flex flex-col items-center">
              <span className={`text-xl font-extrabold tabular-nums leading-none ${rateTextColor}`}>
                {d.attendanceRate}%
              </span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500">오늘 출석률</p>
          <p className="text-sm text-slate-400">
            {d.attendedCount} / {d.expectedCount}명
          </p>
        </div>

        {/* 핵심 지표 2×2 */}
        <div className="flex flex-1 flex-col divide-y divide-slate-100">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            {/* 재실 학생 */}
            <div className="px-6 py-5">
              <p className="text-sm font-medium text-slate-400">재실 학생</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900 leading-none">
                {d.activeStudentCount}
              </p>
              <p className="mt-2 text-sm text-slate-400">전체 {d.studentCount}명 중</p>
            </div>

            {/* 경고 위험 */}
            <div className="px-6 py-5">
              <p className="text-sm font-medium text-slate-400">경고 위험</p>
              <p
                className={`mt-2 text-4xl font-extrabold tabular-nums leading-none ${
                  d.riskStudentCount > 0 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {d.riskStudentCount}
              </p>
              <p className="mt-2 text-sm text-slate-400">warnLevel1 이상</p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100">
            {/* 수강 만료 임박 */}
            <div className="px-6 py-5">
              <p className="text-sm font-medium text-slate-400">만료 임박</p>
              <p
                className={`mt-2 text-4xl font-extrabold tabular-nums leading-none ${
                  d.expiringCount > 0 ? "text-orange-600" : "text-slate-900"
                }`}
              >
                {d.expiringCount}
              </p>
              <p className="mt-2 text-sm text-slate-400">14일 이내 종료 예정</p>
            </div>

            {/* 직원 현황 */}
            <div className="flex flex-col justify-between px-6 py-5">
              <p className="text-sm font-medium text-slate-400">직원 현황</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    관리자
                  </span>
                  <span className="font-bold tabular-nums text-slate-900">
                    {d.adminCount}명
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                    조교
                  </span>
                  <span className="font-bold tabular-nums text-slate-900">
                    {d.assistantCount}명
                  </span>
                </div>
              </div>
              <Link
                href={`/${d.slug}/admin/staff`}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                직원 관리
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── 긴급 이슈 배너 ──────────────────────────────────────────────────────────

type IssueLevel = "critical" | "warning";
type Issue = { level: IssueLevel; divisionName: string; message: string; href: string };

function CriticalIssueBanner({ divisions }: { divisions: DivisionOverviewSummary[] }) {
  const issues: Issue[] = [];

  for (const d of divisions) {
    if (!d.isActive) continue;

    if (d.withdrawalRiskCount > 0) {
      issues.push({
        level: "critical",
        divisionName: d.name,
        message: `퇴실 대상 학생 ${d.withdrawalRiskCount}명 (기준 벌점 초과)`,
        href: `/${d.slug}/admin/warnings`,
      });
    }

    if (d.urgentExpiringCount > 0) {
      issues.push({
        level: "critical",
        divisionName: d.name,
        message: `수강 종료 3일 이내 학생 ${d.urgentExpiringCount}명`,
        href: `/${d.slug}/admin/students`,
      });
    }

    if (d.uncheckedPeriodCount >= 3) {
      issues.push({
        level: "warning",
        divisionName: d.name,
        message: `오늘 미처리 교시 ${d.uncheckedPeriodCount}개`,
        href: `/${d.slug}/admin/attendance`,
      });
    }
  }

  if (issues.length === 0) return null;

  return (
    <section className="space-y-2">
      {issues.map((issue, i) => (
        <Link
          key={i}
          href={issue.href}
          className={`flex items-center justify-between gap-3 rounded-[10px] px-5 py-3.5 text-sm font-semibold transition hover:opacity-90 ${
            issue.level === "critical"
              ? "bg-red-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Siren className="h-4 w-4 shrink-0" />
            <span className="opacity-75">[{issue.divisionName}]</span>
            {issue.message}
          </span>
          <span className="flex shrink-0 items-center gap-1 opacity-80">
            바로가기
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </section>
  );
}

// ─── 지점별 출석률 비교 차트 ─────────────────────────────────────────────────

function AttendanceComparisonChart({ divisions }: { divisions: DivisionOverviewSummary[] }) {
  const activeDivisions = divisions.filter((d) => d.isActive);
  if (activeDivisions.length < 2) return null;

  const chartData = activeDivisions.map((d) => ({
    name: d.name,
    rate: d.attendanceRate,
    color: d.color,
    attended: d.attendedCount,
    expected: d.expectedCount,
  }));

  return (
    <section className="rounded-[10px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">지점별 출석률 비교</h3>
          <p className="mt-0.5 text-sm text-slate-500">오늘 필수 교시 기준</p>
        </div>
      </div>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barSize={32} margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={56}
              tick={{ fontSize: 13, fontWeight: 600, fill: "#334155" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, _name, props) => [
                `${value}% (${(props as { payload?: { attended?: number; expected?: number } }).payload?.attended ?? 0}/${(props as { payload?: { attended?: number; expected?: number } }).payload?.expected ?? 0}명)`,
                "출석률",
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ─── 합산 지표 카드 ──────────────────────────────────────────────────────────

function AggCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  isAlert,
}: {
  label: string;
  value: number;
  unit: string;
  sub: string;
  icon: React.ElementType;
  isAlert?: boolean;
}) {
  const alert = isAlert && value > 0;

  return (
    <div
      className={`flex items-center gap-4 rounded-[10px] border bg-white px-6 py-5 shadow-sm ${
        alert ? "border-red-200 bg-red-50" : "border-slate-200"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-[8px] shrink-0 ${
          alert ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p
          className={`mt-0.5 text-3xl font-extrabold tabular-nums leading-tight ${
            alert ? "text-red-700" : "text-slate-900"
          }`}
        >
          {value}
          <span className="ml-1 text-base font-semibold text-slate-400">{unit}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export function SuperAdminOverview({ initialDivisions }: SuperAdminOverviewProps) {
  const [divisions, setDivisions] = useState(initialDivisions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const mountedRef = useRef(true);

  const refresh = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/super-admin/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "데이터를 불러오지 못했습니다.");
      if (!mountedRef.current) return;
      setDivisions(data.divisions);
      setLastUpdatedAt(new Date().toISOString());
      if (showToast) toast.success("전체 현황을 새로 불러왔습니다.");
    } catch (error) {
      if (showToast) toast.error(error instanceof Error ? error.message : "새로고침에 실패했습니다.");
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const interval = window.setInterval(() => void refresh(false), 30_000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [refresh]);

  const totalStudents = divisions.reduce((s, d) => s + d.studentCount, 0);
  const totalRisk = divisions.reduce((s, d) => s + d.riskStudentCount, 0);
  const totalUnchecked = divisions.reduce((s, d) => s + d.uncheckedPeriodCount, 0);
  const totalExpiring = divisions.reduce((s, d) => s + d.expiringCount, 0);
  const activeCount = divisions.filter((d) => d.isActive).length;

  const lastUpdatedLabel = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(lastUpdatedAt));

  return (
    <div className="space-y-6">
      {/* 긴급 이슈 배너 */}
      <CriticalIssueBanner divisions={divisions} />

      {/* 툴바 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">전체 지점 현황</h2>
          <p className="mt-1 text-sm text-slate-500">
            운영 중 {activeCount}개 지점 · 전체 {divisions.length}개 지점
            <span className="mx-2 text-slate-300">|</span>
            마지막 업데이트: {lastUpdatedLabel}
            {isRefreshing && (
              <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                갱신 중
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-[8px] border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isRefreshing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          새로고침
        </button>
      </div>

      {/* 합산 지표 4개 */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AggCard label="전체 학생 수" value={totalStudents} unit="명" sub={`${activeCount}개 지점 합산`} icon={Users} />
        <AggCard label="미처리 교시" value={totalUnchecked} unit="교시" sub="오늘 필수 교시 누락" icon={BookOpenCheck} isAlert />
        <AggCard label="경고 위험 학생" value={totalRisk} unit="명" sub="warnLevel1 이상 학생" icon={AlertTriangle} isAlert />
        <AggCard label="수강 만료 임박" value={totalExpiring} unit="명" sub="14일 이내 수강 종료" icon={CalendarX} isAlert />
      </section>

      {/* 지점별 출석률 비교 차트 */}
      <AttendanceComparisonChart divisions={divisions} />

      {/* 지점 카드 2단 그리드 */}
      <section>
        <p className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-widest">
          지점별 상세 현황
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          {divisions.map((d) => (
            <DivisionCard key={d.slug} d={d} />
          ))}
        </div>

        {divisions.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-slate-300 bg-white py-24 text-center text-base text-slate-400">
            등록된 지점이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
