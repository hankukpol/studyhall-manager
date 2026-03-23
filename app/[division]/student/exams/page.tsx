import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ChartNoAxesColumn } from "lucide-react";

import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalSectionHeader,
  portalInsetClass,
  portalSectionClass,
} from "@/components/student-view/StudentPortalUi";
import { requireDivisionStudentAccess } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { listStudentExamResults } from "@/lib/services/exam.service";
import { listScoreTargets } from "@/lib/services/score-target.service";
import { getDivisionTheme } from "@/lib/services/settings.service";
import { getStudentDetail } from "@/lib/services/student.service";

type StudentExamsPageProps = {
  params: {
    division: string;
  };
};

const panelFallback = (
  <section className={`${portalSectionClass} animate-pulse rounded-[10px] border border-slate-200 bg-white p-5`}>
    <div className="h-28 rounded-[10px] bg-slate-50" />
  </section>
);

const ScoreTargetPanel = dynamic(
  () => import("@/components/exams/ScoreTargetPanel").then((mod) => mod.ScoreTargetPanel),
  { ssr: false, loading: () => panelFallback },
);

const ExamScoreChart = dynamic(
  () => import("@/components/exams/ExamScoreChart").then((mod) => mod.ExamScoreChart),
  { ssr: false, loading: () => panelFallback },
);

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("ko-KR");
}

export default async function StudentExamsPage({ params }: StudentExamsPageProps) {
  const session = await requireDivisionStudentAccess(params.division);

  try {
    const [division, student, exams, scoreTargets] = await Promise.all([
      getDivisionTheme(params.division),
      getStudentDetail(params.division, session.studentId),
      listStudentExamResults(params.division, session.studentId),
      listScoreTargets(params.division, session.studentId),
    ]);

    return (
      <StudentPortalFrame
        division={{ slug: params.division, ...division }}
        student={student}
        current="exams"
        title="성적 상세"
        description="본인 모의고사 회차별 총점, 반 석차, 과목별 점수를 한 화면에서 확인할 수 있습니다."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PortalMetricCard
            label="응시 회차"
            value={`${exams.length}회`}
            caption="현재 등록된 전체 시험 수"
          />
          <PortalMetricCard
            label="최신 총점"
            value={exams[0]?.totalScore ?? "-"}
            caption="가장 최근 시험 기준"
          />
          <PortalMetricCard
            label="최신 반 석차"
            value={exams[0]?.rankInClass ? `${exams[0].rankInClass}등` : "-"}
            caption="가장 최근 시험 기준"
          />
        </section>

        <ScoreTargetPanel
          divisionSlug={params.division}
          studentId={session.studentId}
          initialTargets={scoreTargets}
        />

        <ExamScoreChart results={exams} />

        <section className={portalSectionClass}>
          <PortalSectionHeader
            eyebrow="Exam Results"
            title="회차별 성적 기록"
            description="모바일에서는 카드 단위로 요약하고, 과목 점수는 2단 그리드로 읽기 쉽게 배치했습니다."
            icon={<ChartNoAxesColumn className="h-4 w-4" />}
          />

          {exams.length > 0 ? (
            <div className="mt-5 space-y-4">
              {exams.map((exam) => (
                <article key={exam.id} className={portalInsetClass}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {exam.examTypeName}
                      </p>
                      <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                        {exam.examRound}회차
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        시험일 {formatDate(exam.examDate)}
                      </p>
                    </div>

                    <div className="grid w-full gap-3 sm:w-auto sm:min-w-[280px] sm:grid-cols-2">
                      <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          총점
                        </p>
                        <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                          {exam.totalScore ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          반 석차
                        </p>
                        <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                          {exam.rankInClass ? `${exam.rankInClass}등` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {exam.subjects.map((subject) => (
                      <div
                        key={`${exam.id}-${subject.subjectId}`}
                        className="rounded-[10px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {subject.score ?? "-"}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {subject.maxScore ? `만점 ${subject.maxScore}` : "만점 정보 없음"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    {exam.notes || "시험 메모가 없습니다."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <PortalEmptyState
                title="시험 기록이 없습니다."
                description="시험 결과가 등록되면 회차별 성적 카드가 이 영역에 표시됩니다."
              />
            </div>
          )}
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
