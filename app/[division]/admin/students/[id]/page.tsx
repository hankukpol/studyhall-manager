import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { StudentDetailView } from "@/components/students/StudentDetailView";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { listExamTypes, listStudentExamResults } from "@/lib/services/exam.service";
import { listInterviews } from "@/lib/services/interview.service";
import { listLeavePermissions } from "@/lib/services/leave.service";
import { listPaymentCategories, listPayments } from "@/lib/services/payment.service";
import { listPointRecords, listPointRules } from "@/lib/services/point.service";
import { listScoreTargets } from "@/lib/services/score-target.service";
import { listSeatOptions } from "@/lib/services/seat.service";
import { getDivisionGeneralSettings, getDivisionRuleSettings } from "@/lib/services/settings.service";
import { getStudentDashboardData } from "@/lib/services/student-dashboard.service";
import { listTuitionPlans } from "@/lib/services/tuition-plan.service";

type StudentDetailPageProps = {
  params: {
    division: string;
    id: string;
  };
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const session = await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);

  try {
    const [
      dashboardData,
      pointRecords,
      examResults,
      scoreTargets,
      examTypes,
      paymentRecords,
      paymentCategories,
      interviews,
      leavePermissions,
      generalSettings,
      seatOptions,
      tuitionPlans,
      ruleSettings,
      pointRules,
    ] = await Promise.all([
      getStudentDashboardData(params.division, params.id),
      listPointRecords(params.division, { studentId: params.id }),
      listStudentExamResults(params.division, params.id),
      listScoreTargets(params.division, params.id),
      listExamTypes(params.division),
      listPayments(params.division, { studentId: params.id }),
      listPaymentCategories(params.division, { activeOnly: true }),
      listInterviews(params.division, { studentId: params.id }),
      listLeavePermissions(params.division, { studentId: params.id }),
      getDivisionGeneralSettings(params.division),
      listSeatOptions(params.division),
      listTuitionPlans(params.division),
      getDivisionRuleSettings(params.division),
      listPointRules(params.division),
    ]);

    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/${params.division}/admin/students`}
            className="inline-flex items-center gap-2 text-base font-bold text-slate-600 transition hover:text-slate-950"
          >
            <ChevronLeft className="h-4 w-4" />
            학생 명단으로 돌아가기
          </Link>
        </div>

        <StudentDetailView
          divisionSlug={params.division}
          initialStudent={dashboardData.student}
          canEdit={session.role === "ADMIN" || session.role === "SUPER_ADMIN"}
          studyTrackOptions={generalSettings.studyTracks}
          seatOptions={seatOptions}
          tuitionPlans={tuitionPlans}
          attendanceSummary={dashboardData.summary}
          weeklyAttendance={dashboardData.weeklyAttendance}
          leavePermissions={leavePermissions}
          pointRecords={pointRecords}
          examResults={examResults}
          scoreTargets={scoreTargets}
          availableScoreTargetExamTypes={examTypes.filter(
            (examType) =>
              !examType.studyTrack ||
              !dashboardData.student.studyTrack ||
              examType.studyTrack === dashboardData.student.studyTrack,
          )}
          paymentRecords={paymentRecords}
          paymentCategories={paymentCategories}
          pointRules={pointRules.filter((r) => r.isActive)}
          interviews={interviews}
          warningThresholds={ruleSettings}
        />
      </div>
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
