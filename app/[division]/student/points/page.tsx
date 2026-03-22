import { notFound } from "next/navigation";

import { PointCategoryBadge, PointValueBadge } from "@/components/points/PointBadges";
import { StudentPortalFrame } from "@/components/student-view/StudentPortalFrame";
import { requireDivisionStudentAccess } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { getDivisionTheme } from "@/lib/services/settings.service";
import { listPointRecords } from "@/lib/services/point.service";
import { getStudentDetail } from "@/lib/services/student.service";

type StudentPointsPageProps = {
  params: {
    division: string;
  };
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StudentPointsPage({ params }: StudentPointsPageProps) {
  const session = await requireDivisionStudentAccess(params.division);

  try {
    const [division, student, records] = await Promise.all([
      getDivisionTheme(params.division),
      getStudentDetail(params.division, session.studentId),
      listPointRecords(params.division, { studentId: session.studentId }),
    ]);

    const rewardCount = records.filter((record) => record.points > 0).length;
    const penaltyCount = records.filter((record) => record.points < 0).length;

    return (
      <StudentPortalFrame
        division={{ slug: params.division, ...division }}
        student={student}
        current="points"
        title="상벌점 상세"
        description="학생 본인에게 등록된 상점과 벌점 기록을 시간순으로 확인합니다."
      >
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">현재 순벌점</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">{student.netPoints}점</p>
            <p className="mt-2 text-sm text-slate-600">상점 반영 후 기준</p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">상점 기록</p>
            <p className="mt-3 text-3xl font-extrabold text-emerald-700">{rewardCount}건</p>
            <p className="mt-2 text-sm text-slate-600">현재 저장된 누적 건수</p>
          </article>
          <article className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
            <p className="text-sm font-semibold text-slate-500">벌점 기록</p>
            <p className="mt-3 text-3xl font-extrabold text-rose-700">{penaltyCount}건</p>
            <p className="mt-2 text-sm text-slate-600">현재 저장된 누적 건수</p>
          </article>
        </section>

        <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(18,32,56,0.08)] md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Point History
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">전체 상벌점 기록</h2>

          {records.length > 0 ? (
            <div className="mt-5 space-y-3">
              {records.map((record) => (
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
                  <p className="mt-1 text-sm text-slate-600">기록자 {record.recordedByName}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {record.notes || "기록 메모가 없습니다."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">
              아직 등록된 상벌점 기록이 없습니다.
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
