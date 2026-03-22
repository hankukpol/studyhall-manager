import { notFound } from "next/navigation";

import { ExamScoreChart } from "@/components/exams/ExamScoreChart";
import { ScoreTargetPanel } from "@/components/exams/ScoreTargetPanel";
import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
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
        description="본인 모의고사 회차별 총점, 반 석차, 과목 점수를 확인합니다."
      >
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">응시 회차</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">{exams.length}회</p>
            <p className="mt-2 text-sm text-slate-600">현재 등록된 전체 시험 수</p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">최신 총점</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">
              {exams[0]?.totalScore ?? "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">가장 최근 시험 기준</p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">최신 반 석차</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">
              {exams[0]?.rankInClass ? `${exams[0].rankInClass}등` : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">가장 최근 시험 기준</p>
          </article>
        </section>

        <ScoreTargetPanel
          divisionSlug={params.division}
          studentId={session.studentId}
          initialTargets={scoreTargets}
        />

        <ExamScoreChart results={exams} />

        <section className="space-y-4">
          {exams.length > 0 ? (
            exams.map((exam) => (
              <article
                key={exam.id}
                className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {exam.examTypeName}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      {exam.examRound}회차
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">시험일 {formatDate(exam.examDate)}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">총점</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {exam.totalScore ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">반 석차</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {exam.rankInClass ? `${exam.rankInClass}등` : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {exam.subjects.map((subject) => (
                    <div
                      key={`${exam.id}-${subject.subjectId}`}
                      className="rounded-[22px] border border-slate-200-slate-200 bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                      <p className="mt-3 text-2xl font-bold text-slate-950">
                        {subject.score ?? "-"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {subject.maxScore ? `만점 ${subject.maxScore}` : "만점 미설정"}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">
                  {exam.notes || "등록된 시험 메모가 없습니다."}
                </p>
              </article>
            ))
          ) : (
            <section className="rounded-[28px] border border-slate-200-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-600 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
              아직 등록된 모의고사 기록이 없습니다.
            </section>
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
