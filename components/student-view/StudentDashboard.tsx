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
import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalSectionHeader,
  portalCardClass,
  portalInsetClass,
  portalSectionClass,
} from "@/components/student-view/StudentPortalUi";
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

function formatStudyDuration(data: StudentDashboardData["summary"]) {
  if (data.monthlyStudyMinutes === 0) {
    return "0분";
  }

  if (data.monthlyStudyHours > 0) {
    return `${data.monthlyStudyHours}시간 ${data.monthlyStudyMinutesRemainder}분`;
  }

  return `${data.monthlyStudyMinutesRemainder}분`;
}

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <StudentPortalFrame
      division={data.division}
      student={data.student}
      current="dashboard"
      title={`${data.student.name} 학생 포털`}
      description={`${data.division.fullName} 학생 전용 모바일 포털입니다. 출석, 상벌점, 성적, 공지사항을 현재 기준으로 정리해 보여줍니다.`}
    >
      {data.upcomingExamSchedule ? (
        <section className={`${portalSectionClass} flex flex-wrap items-center gap-4`}>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-slate-200"
            style={{
              backgroundColor: "var(--division-color)",
              color: "var(--division-on-accent)",
            }}
          >
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Upcoming Exam
            </p>
            <p className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] text-slate-950">
              {data.upcomingExamSchedule.name}
            </p>
            <p className="mt-1 text-sm text-slate-600">{data.upcomingExamSchedule.examDate}</p>
          </div>
          <span
            className="inline-flex rounded-[10px] px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor:
                data.upcomingExamSchedule.dDayValue === 0
                  ? "#fee2e2"
                  : "rgb(var(--division-color-rgb) / 0.12)",
              color:
                data.upcomingExamSchedule.dDayValue === 0
                  ? "#b91c1c"
                  : "var(--division-color)",
            }}
          >
            {data.upcomingExamSchedule.dDayLabel}
          </span>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortalMetricCard
          label="이번 달 출석률"
          value={`${data.summary.monthlyAttendanceRate}%`}
          caption={`${formatRatio(data.summary.monthlyAttendedCount, data.summary.monthlyExpectedCount)} 교시 기준`}
        />
        <PortalMetricCard
          label="이번 주 출석"
          value={formatRatio(data.summary.weeklyAttendedCount, data.summary.weeklyExpectedCount)}
          caption="필수 교시 종료분 반영"
        />
        <PortalMetricCard
          label="월간 학습 시간"
          value={formatStudyDuration(data.summary)}
          caption="입퇴실 기록 기준 누적 시간"
        />
        <PortalMetricCard
          label="현재 경고 단계"
          value={getWarningStageLabel(data.student.warningStage)}
          caption={`누적 벌점 ${data.student.netPoints}점 기준`}
          valueToneClassName="text-amber-700"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <section className={portalSectionClass}>
          <PortalSectionHeader
            eyebrow="Attendance"
            title="이번 주 교시별 출석 현황"
            description="오늘 이후 교시는 예정으로 표시되고, 운영하지 않는 요일은 휴무로 구분됩니다."
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <div className="mt-5">
            <AttendanceCalendar weeklyAttendance={data.weeklyAttendance} />
          </div>
        </section>

        <div className="space-y-4">
          <section className={portalSectionClass}>
            <PortalSectionHeader
              eyebrow="Point History"
              title="최근 상벌점 기록"
              icon={<ShieldAlert className="h-4 w-4" />}
            />

            {data.recentPoints.length > 0 ? (
              <div className="mt-5 space-y-3">
                {data.recentPoints.map((record) => (
                  <article key={record.id} className={portalInsetClass}>
                    <div className="flex flex-wrap items-center gap-2">
                      <PointCategoryBadge category={record.category} />
                      <PointValueBadge points={record.points} />
                      <span className="text-xs text-slate-500">{formatDateTime(record.date)}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                      {record.ruleName || "직접 기록"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {record.notes || "기록 메모가 없습니다."}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <PortalEmptyState
                  title="상벌점 기록이 없습니다."
                  description="최근 등록된 상점 또는 벌점 내역이 없으면 이 영역이 비어 있습니다."
                />
              </div>
            )}
          </section>

          <section className={portalSectionClass}>
            <PortalSectionHeader
              eyebrow="Seat"
              title="현재 좌석 정보"
              icon={<MapPinned className="h-4 w-4" />}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className={portalInsetClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  배정 좌석
                </p>
                <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                  {data.student.seatLabel || "미배정"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {data.student.studyRoomName || "학습실 정보 없음"}
                </p>
              </div>
              <div className={portalInsetClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  등록일
                </p>
                <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                  {formatDate(data.student.createdAt)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  좌석 변경은 관리자 화면에서 반영됩니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={portalSectionClass}>
          <PortalSectionHeader
            eyebrow="Latest Exam"
            title="최근 모의고사"
            icon={<Target className="h-4 w-4" />}
          />

          {data.latestExam ? (
            <div className="mt-5 space-y-4">
              <div className={portalInsetClass}>
                <p className="text-sm text-slate-500">{data.latestExam.examTypeName}</p>
                <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                  {data.latestExam.examRound}회차
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  시험일 {formatDate(data.latestExam.examDate)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={portalInsetClass}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    총점
                  </p>
                  <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                    {data.latestExam.totalScore ?? "-"}
                  </p>
                </div>
                <div className={portalInsetClass}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    반 석차
                  </p>
                  <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                    {data.latestExam.rankInClass ? `${data.latestExam.rankInClass}등` : "-"}
                  </p>
                </div>
              </div>

              <div className={portalInsetClass}>
                <p className="text-sm leading-6 text-slate-600">
                  {data.latestExam.notes || "시험 메모가 없습니다."}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <PortalEmptyState
                title="모의고사 기록이 없습니다."
                description="등록된 시험 결과가 생기면 최근 시험 요약이 이 영역에 표시됩니다."
              />
            </div>
          )}
        </section>

        <section className={portalSectionClass}>
          <PortalSectionHeader
            eyebrow="Announcements"
            title="고정 공지사항"
            icon={<BellRing className="h-4 w-4" />}
          />

          {data.pinnedAnnouncements.length > 0 ? (
            <div className="mt-5 space-y-3">
              {data.pinnedAnnouncements.map((announcement) => (
                <article key={announcement.id} className={`${portalCardClass} p-4`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{announcement.divisionName || "전체 공지"}</span>
                    <span>·</span>
                    <span>{formatDateTime(announcement.createdAt)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    {announcement.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {announcement.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <PortalEmptyState
                title="고정 공지사항이 없습니다."
                description="중요 공지 등록 시 학생 포털 상단에서 바로 확인할 수 있습니다."
              />
            </div>
          )}
        </section>
      </div>

      <section className={portalSectionClass}>
        <PortalSectionHeader
          eyebrow="Memo"
          title="관리자 메모"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <div className="mt-5 rounded-[10px] border border-slate-200 bg-[#f8fafc] px-4 py-5 text-sm leading-7 text-slate-700">
          {data.student.memo || "등록된 메모가 없습니다."}
        </div>
      </section>
    </StudentPortalFrame>
  );
}
