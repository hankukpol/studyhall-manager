import { getAttendanceSnapshot } from "@/lib/services/attendance.service";
import { getDivisionRuleSettings } from "@/lib/services/settings.service";
import { listStudents } from "@/lib/services/student.service";
import {
  listManagedAdminAccounts,
  listManagedDivisions,
} from "@/lib/services/super-admin.service";

export type DivisionOverviewSummary = {
  slug: string;
  name: string;
  fullName: string;
  color: string;
  isActive: boolean;
  studentCount: number;
  activeStudentCount: number;
  riskStudentCount: number;
  withdrawalRiskCount: number;
  expiringCount: number;
  urgentExpiringCount: number;
  attendanceRate: number;
  attendedCount: number;
  expectedCount: number;
  uncheckedPeriodCount: number;
  adminCount: number;
  assistantCount: number;
};

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getDivisionSummary(
  slug: string,
  allAdmins: Awaited<ReturnType<typeof listManagedAdminAccounts>>,
  today: string,
): Promise<Omit<DivisionOverviewSummary, "name" | "fullName" | "color" | "isActive">> {
  const [students, settings, snapshot] = await Promise.all([
    listStudents(slug),
    getDivisionRuleSettings(slug),
    getAttendanceSnapshot(slug, today).catch(() => null),
  ]);

  // 학생 통계
  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const onLeaveStudents = students.filter((s) => s.status === "ON_LEAVE");
  const activeStudentCount = activeStudents.length;
  const studentCount = activeStudentCount + onLeaveStudents.length;

  const allActiveStudents = [...activeStudents, ...onLeaveStudents];

  const riskStudentCount = allActiveStudents.filter(
    (s) => s.netPoints >= settings.warnLevel1,
  ).length;

  const withdrawalRiskCount = allActiveStudents.filter(
    (s) => s.netPoints >= settings.warnWithdraw,
  ).length;

  const expiringCount = allActiveStudents.filter((s) => {
    if (!s.courseEndDate) return false;
    const end = new Date(s.courseEndDate);
    const todayDate = new Date(today);
    const diff = Math.floor((end.getTime() - todayDate.getTime()) / 86400000);
    return diff >= -3 && diff <= 14;
  }).length;

  const urgentExpiringCount = allActiveStudents.filter((s) => {
    if (!s.courseEndDate) return false;
    const end = new Date(s.courseEndDate);
    const todayDate = new Date(today);
    const diff = Math.floor((end.getTime() - todayDate.getTime()) / 86400000);
    return diff >= -3 && diff <= 3;
  }).length;

  // 출석 통계
  let attendanceRate = 0;
  let attendedCount = 0;
  let expectedCount = 0;
  let uncheckedPeriodCount = 0;

  if (snapshot) {
    const mandatoryPeriods = snapshot.periods.filter((p) => p.isActive && p.isMandatory);

    for (const period of mandatoryPeriods) {
      const records = snapshot.records.filter((r) => r.periodId === period.id);
      let periodAttended = 0;
      let periodExpected = 0;
      let notApplicable = 0;

      for (const record of records) {
        if (record.status === "NOT_APPLICABLE") {
          notApplicable += 1;
        } else if (
          record.status === "PRESENT" ||
          record.status === "TARDY" ||
          record.status === "HOLIDAY" ||
          record.status === "HALF_HOLIDAY"
        ) {
          periodAttended += 1;
        }
      }

      periodExpected = Math.max(activeStudentCount - notApplicable, 0);
      attendedCount += periodAttended;
      expectedCount += periodExpected;

      const isUnchecked =
        periodExpected > 0 && records.filter((r) => r.status !== "NOT_APPLICABLE").length === 0;
      if (isUnchecked) uncheckedPeriodCount += 1;
    }

    attendanceRate =
      expectedCount > 0 ? Number(((attendedCount / expectedCount) * 100).toFixed(1)) : 0;
  }

  // 직원 수
  const divisionAdmins = allAdmins.filter(
    (a) => a.divisionSlug === slug && a.isActive,
  );
  const adminCount = divisionAdmins.filter((a) => a.role === "ADMIN").length;
  const assistantCount = divisionAdmins.filter((a) => a.role === "ASSISTANT").length;

  return {
    slug,
    studentCount,
    activeStudentCount,
    riskStudentCount,
    withdrawalRiskCount,
    expiringCount,
    urgentExpiringCount,
    attendanceRate,
    attendedCount,
    expectedCount,
    uncheckedPeriodCount,
    adminCount,
    assistantCount,
  };
}

export async function getSuperAdminOverview(): Promise<DivisionOverviewSummary[]> {
  const today = getKstToday();
  const [divisions, allAdmins] = await Promise.all([
    listManagedDivisions(),
    listManagedAdminAccounts(),
  ]);

  const summaries = await Promise.all(
    divisions.map(async (division) => {
      const summary = await getDivisionSummary(division.slug, allAdmins, today).catch(() => ({
        slug: division.slug,
        studentCount: 0,
        activeStudentCount: 0,
        riskStudentCount: 0,
        withdrawalRiskCount: 0,
        expiringCount: 0,
        urgentExpiringCount: 0,
        attendanceRate: 0,
        attendedCount: 0,
        expectedCount: 0,
        uncheckedPeriodCount: 0,
        adminCount: 0,
        assistantCount: 0,
      }));

      return {
        ...summary,
        name: division.name,
        fullName: division.fullName,
        color: division.color,
        isActive: division.isActive,
      };
    }),
  );

  return summaries;
}
