import type { ReactNode } from "react";

import {
  portalContainerClass,
  portalPageClass,
} from "@/components/student-view/StudentPortalUi";
import { StudentLogoutButton } from "@/components/student-view/StudentLogoutButton";
import { StudentPortalTabs } from "@/components/student-view/StudentPortalTabs";
import {
  StudentStatusBadge,
  WarningStageBadge,
} from "@/components/students/StudentBadges";
import type { StudentDetail } from "@/lib/services/student.service";

type StudentPortalFrameProps = {
  division: {
    slug: string;
    name: string;
    fullName: string;
    color: string;
  };
  student: StudentDetail;
  current: "dashboard" | "attendance" | "points" | "exams";
  title: string;
  description: string;
  children: ReactNode;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

export function StudentPortalFrame({
  division,
  student,
  current,
  title,
  description,
  children,
}: StudentPortalFrameProps) {
  const accentMutedTextStyle = { color: "var(--division-on-accent-muted)" };
  const accentSurfaceStyle = {
    borderColor: "var(--division-accent-border)",
    backgroundColor: "var(--division-accent-surface)",
  };
  const accentSurfaceSoftStyle = {
    borderColor: "var(--division-accent-border)",
    backgroundColor: "var(--division-accent-surface-soft)",
  };
  const accentOutlineStyle = { borderColor: "var(--division-accent-outline)" };

  return (
    <main className={portalPageClass}>
      <div className={portalContainerClass}>
        <section
          className="relative overflow-hidden rounded-[10px] border border-slate-200"
          style={{
            background:
              "linear-gradient(145deg, var(--division-color-strong) 0%, var(--division-hero-end) 100%)",
            color: "var(--division-on-accent)",
          }}
        >
          <div className="relative z-10 grid gap-5 px-5 py-5 md:px-6 md:py-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={accentMutedTextStyle}>
                    Student Portal
                  </p>
                  <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] md:text-[38px]">
                    {title}
                  </h1>
                </div>
                <StudentLogoutButton divisionSlug={division.slug} />
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6" style={accentMutedTextStyle}>
                {description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StudentStatusBadge status={student.status} />
                <WarningStageBadge stage={student.warningStage} />
                <span className="inline-flex items-center rounded-[10px] border px-3 py-1.5 text-xs font-semibold" style={accentSurfaceStyle}>
                  {student.studentNumber}
                </span>
                {student.studyTrack ? (
                  <span className="inline-flex items-center rounded-[10px] border px-3 py-1.5 text-xs font-semibold" style={accentSurfaceStyle}>
                    {student.studyTrack}
                  </span>
                ) : null}
                {student.seatLabel ? (
                  <span className="inline-flex items-center rounded-[10px] border px-3 py-1.5 text-xs font-semibold" style={accentSurfaceStyle}>
                    좌석 {student.seatLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <article className="rounded-[10px] border p-4" style={accentSurfaceStyle}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={accentMutedTextStyle}>
                  Student
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                  {student.name}
                </p>
                <p className="mt-2 text-sm" style={accentMutedTextStyle}>
                  {division.fullName}
                  {student.phone ? ` · ${student.phone}` : ""}
                </p>
              </article>

              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-[10px] border p-4" style={accentSurfaceSoftStyle}>
                  <p className="text-xs uppercase tracking-[0.18em]" style={accentMutedTextStyle}>Division</p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                    {division.name}
                  </p>
                  <p className="mt-2 text-sm" style={accentMutedTextStyle}>{division.fullName}</p>
                </article>
                <article className="rounded-[10px] border p-4" style={accentSurfaceSoftStyle}>
                  <p className="text-xs uppercase tracking-[0.18em]" style={accentMutedTextStyle}>Net Points</p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                    {student.netPoints}점
                  </p>
                  <p className="mt-2 text-sm" style={accentMutedTextStyle}>현재 경고 단계 반영 기준</p>
                </article>
                <article className="rounded-[10px] border p-4" style={accentSurfaceSoftStyle}>
                  <p className="text-xs uppercase tracking-[0.18em]" style={accentMutedTextStyle}>Registered</p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                    {formatDate(student.createdAt)}
                  </p>
                  <p className="mt-2 text-sm" style={accentMutedTextStyle}>
                    {student.seatDisplay || "좌석 미배정"}
                  </p>
                </article>
              </div>
            </div>
          </div>

          <div className="absolute -right-8 top-8 h-28 w-28 rounded-full border" style={accentOutlineStyle} />
          <div className="absolute bottom-6 right-20 h-20 w-20 rounded-full border" style={accentOutlineStyle} />
        </section>

        <StudentPortalTabs divisionSlug={division.slug} current={current} />

        {children}
      </div>
    </main>
  );
}
