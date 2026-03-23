import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import {
  type ActivityLogData,
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


export default async function AdminReportsPage({
  params,
  searchParams,
}: AdminReportsPageProps) {

  const selection = resolveReportSelection(searchParams);
  const data = await getReportData(params.division, selection);
  const initialActivityLog = {
    dateFrom: searchParams?.activityDateFrom ?? data.range.dateFrom,
    dateTo: searchParams?.activityDateTo ?? data.range.dateTo,
    actorId: searchParams?.activityActorId ?? null,
    actionType: (searchParams?.activityActionType as
      | "POINT"
      | "ATTENDANCE_EDIT"
      | "STUDENT_STATUS"
      | "INTERVIEW"
      | undefined) ?? null,
    items: [],
    actorOptions: [],
  } satisfies ActivityLogData;
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
