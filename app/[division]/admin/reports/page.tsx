import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { requireDivisionAdminAccess } from "@/lib/auth";
import {
  getActivityLogData,
  getReportData,
  resolveReportSelection,
} from "@/lib/services/report.service";

type AdminReportsPageProps = {
  params: {
    division: string;
  };
  searchParams?: {
    period?: string;
    date?: string;
    month?: string;
    activityDateFrom?: string;
    activityDateTo?: string;
    activityActorId?: string;
    activityActionType?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  params,
  searchParams,
}: AdminReportsPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);

  const selection = resolveReportSelection(searchParams);
  const [data, initialActivityLog] = await Promise.all([
    getReportData(params.division, selection),
    getActivityLogData(params.division, {
      dateFrom: searchParams?.activityDateFrom,
      dateTo: searchParams?.activityDateTo,
      actorId: searchParams?.activityActorId ?? null,
      actionType: (searchParams?.activityActionType as
        | "POINT"
        | "ATTENDANCE_EDIT"
        | "STUDENT_STATUS"
        | "INTERVIEW"
        | undefined) ?? null,
    }),
  ]);
  const selectionKey =
    selection.period === "monthly"
      ? `${selection.period}:${selection.month}`
      : `${selection.period}:${selection.date}`;

  return (
    <ReportsDashboard
      key={selectionKey}
      divisionSlug={params.division}
      selection={selection}
      data={data}
      initialActivityLog={initialActivityLog}
    />
  );
}
