import { ExamScoreManager } from "@/components/exams/ExamScoreManager";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { listExamTypes } from "@/lib/services/exam.service";

type AdminExamsPageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminExamsPage({ params }: AdminExamsPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);
  const examTypes = (await listExamTypes(params.division)).filter((examType) => examType.isActive);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200-black/5 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Exams
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          시험 성적 관리
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          시험 템플릿과 회차를 선택하면 해당 지점, 해당 직렬 학생만 성적 시트에 표시됩니다.
          과목별 점수 입력, 탭 구분 붙여넣기, 총점 및 석차 계산까지 한 화면에서 처리합니다.
        </p>
      </section>

      <ExamScoreManager divisionSlug={params.division} initialExamTypes={examTypes} />
    </div>
  );
}
