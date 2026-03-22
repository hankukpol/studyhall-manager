import type { ReactNode } from "react";

import { StudentLogoutButton } from "@/components/student-view/StudentLogoutButton";
import { StudentPortalTabs } from "@/components/student-view/StudentPortalTabs";
import { StudentStatusBadge, WarningStageBadge } from "@/components/students/StudentBadges";
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
  return (
    <main className="min-h-screen bg-white px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className="rounded-[32px] px-6 py-8 text-white shadow-[0_28px_80px_rgba(18,32,56,0.24)] md:px-8"
          style={{
            backgroundColor: `${division.color}`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                Student Portal
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">{description}</p>
            </div>
            <StudentLogoutButton divisionSlug={division.slug} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <StudentStatusBadge status={student.status} />
            <WarningStageBadge stage={student.warningStage} />
            <span className="inline-flex rounded-full border border-slate-200-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {student.name} · {student.studentNumber}
            </span>
            <span className="inline-flex rounded-full border border-slate-200-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              좌석 {student.seatLabel || "미배정"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Division</p>
              <p className="mt-3 text-lg font-bold">{division.name}</p>
              <p className="mt-2 text-sm text-white/72">{division.fullName}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Net Points</p>
              <p className="mt-3 text-lg font-bold">{student.netPoints}점</p>
              <p className="mt-2 text-sm text-white/72">현재 경고 단계 반영 기준</p>
            </article>
            <article className="rounded-[24px] border border-slate-200-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Registered</p>
              <p className="mt-3 text-lg font-bold">{formatDate(student.createdAt)}</p>
              <p className="mt-2 text-sm text-white/72">{student.phone || "연락처 미등록"}</p>
            </article>
          </div>
        </section>

        <StudentPortalTabs divisionSlug={division.slug} current={current} />

        {children}
      </div>
    </main>
  );
}
