import {
  BellRing,
  CalendarDays,
  ClipboardList,
  MapPinned,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";

import { PointCategoryBadge, PointValueBadge } from "@/components/points/PointBadges";
import { AttendanceCalendar } from "@/components/student-view/AttendanceCalendar";
import { StudentStatusBadge, WarningStageBadge } from "@/components/students/StudentBadges";
import { StudentLogoutButton } from "@/components/student-view/StudentLogoutButton";
import { StudentPortalTabs } from "@/components/student-view/StudentPortalTabs";
import { getWarningStageLabel } from "@/lib/student-meta";
import type { StudentDashboardData } from "@/lib/services/student-dashboard.service";

type StudentDashboardProps = {
  data: StudentDashboardData;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("ko-KR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRatio(current: number, total: number) {
  return `${current}/${total}`;
}

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <main className="min-h-screen bg-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className="relative overflow-hidden rounded-[32px] px-6 py-8 text-white shadow-[0_28px_80px_rgba(18,32,56,0.24)] md:px-8"
          style={{
            backgroundColor: `${data.division.color}`,
          }}
        >
          <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                Student Dashboard
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  {data.student.name}
                </h1>
                <StudentLogoutButton divisionSlug={data.division.slug} />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/78">
                {data.division.fullName} · 수험번호 {data.student.studentNumber}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StudentStatusBadge status={data.student.status} />
                <WarningStageBadge stage={data.student.warningStage} />
                <span className="inline-flex rounded-full border border-slate-200-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  직렬 {data.student.studyTrack || "미지정"}
                </span>
                <span className="inline-flex rounded-full border border-slate-200-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  좌석 {data.student.seatLabel || "미배정"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">연락처</p>
                  <p className="mt-3 text-lg font-bold">{data.student.phone || "미등록"}</p>
                </article>
                <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">등록일</p>
                  <p className="mt-3 text-lg font-bold">{formatDate(data.student.createdAt)}</p>
                </article>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">이번 달 출석률</p>
                <p className="mt-3 text-3xl font-extrabold">{data.summary.monthlyAttendanceRate}%</p>
                <p className="mt-2 text-sm text-white/72">
                  {formatRatio(data.summary.monthlyAttendedCount, data.summary.monthlyExpectedCount)} 교시
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">이번 주 출석</p>
                <p className="mt-3 text-3xl font-extrabold">
                  {formatRatio(data.summary.weeklyAttendedCount, data.summary.weeklyExpectedCount)}
                </p>
                <p className="mt-2 text-sm text-white/72">필수 교시 기준 누적</p>
              </article>
              <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">누적 벌점</p>
                <p className="mt-3 text-3xl font-extrabold">{data.student.netPoints}점</p>
                <p className="mt-2 text-sm text-white/72">상점 반영 후 현재 기준</p>
              </article>
              <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">현재 경고 단계</p>
                <p className="mt-3 text-xl font-bold">
                  {getWarningStageLabel(data.student.warningStage)}
                </p>
                <p className="mt-2 text-sm text-white/72">관리자 설정 기준 자동 반영</p>
              </article>
            </div>
          </div>
        </section>

        {data.upcomingExamSchedule && (
          <section
            className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(18,32,56,0.06)]"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: data.division.color }}
            >
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming Exam</p>
              <p className="mt-0.5 font-bold text-slate-950 truncate">{data.upcomingExamSchedule.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{data.upcomingExamSchedule.examDate}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold ${
                data.upcomingExamSchedule.dDayValue === 0
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {data.upcomingExamSchedule.dDayLabel}
            </span>
          </section>
        )}

        <StudentPortalTabs divisionSlug={data.division.slug} current="dashboard" />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-slate-700" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Attendance
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">이번 주 교시별 출석 현황</h2>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              오늘 이후 교시는 예정으로 표시되고, 운영하지 않는 요일은 휴무로 구분됩니다.
            </p>

            <div className="mt-6">
              <AttendanceCalendar weeklyAttendance={data.weeklyAttendance} />
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Point History
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">최근 상벌점 기록</h2>
                </div>
              </div>

              {data.recentPoints.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {data.recentPoints.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-[24px] border border-slate-200-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <PointCategoryBadge category={record.category} />
                        <PointValueBadge points={record.points} />
                        <span className="text-xs text-slate-500">{formatDateTime(record.date)}</span>
                      </div>
                      <p className="mt-3 text-xl font-bold text-slate-950">
                        {record.ruleName || "직접 기록"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {record.notes || "기록 메모가 없습니다."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                  아직 등록된 상벌점 기록이 없습니다.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Seat
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">현재 좌석 정보</h2>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200-slate-200 bg-white px-4 py-5">
                <p className="text-sm text-slate-500">배정 좌석</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-950">
                  {data.student.seatLabel || "미배정"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  좌석 배치 변경은 관리자 화면에서 반영됩니다.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-slate-700" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Latest Exam
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">최근 모의고사</h2>
              </div>
            </div>

            {data.latestExam ? (
              <div className="mt-5 rounded-[24px] border border-slate-200-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{data.latestExam.examTypeName}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">
                  {data.latestExam.examRound}회차
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  시험일 {formatDate(data.latestExam.examDate)}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200-white bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">총점</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {data.latestExam.totalScore ?? "-"}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-200-white bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">반 석차</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {data.latestExam.rankInClass ? `${data.latestExam.rankInClass}등` : "-"}
                    </p>
                  </article>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {data.latestExam.notes || "등록된 시험 메모가 없습니다."}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                아직 등록된 모의고사 기록이 없습니다.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-slate-700" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Announcements
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">고정 공지사항</h2>
              </div>
            </div>

            {data.pinnedAnnouncements.length > 0 ? (
              <div className="mt-5 space-y-3">
                {data.pinnedAnnouncements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-[24px] border border-slate-200-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{announcement.divisionName || "전체 공지"}</span>
                      <span>·</span>
                      <span>{formatDateTime(announcement.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {announcement.title}
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {announcement.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                현재 고정 공지사항이 없습니다.
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-slate-700" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Memo
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">관리 메모</h2>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200-slate-200 bg-white px-4 py-5 text-sm leading-7 text-slate-700">
            {data.student.memo || "등록된 메모가 없습니다."}
          </div>
        </section>
      </div>
    </main>
  );
}
