import { parseUtcDateFromYmd } from "@/lib/date-utils";
import { isMockMode } from "@/lib/mock-data";
import { getPrismaClient } from "@/lib/service-helpers";
import { getAttendanceSnapshot } from "@/lib/services/attendance.service";
import { getDivisionRuleSettings } from "@/lib/services/settings.service";
import { listStudents } from "@/lib/services/student.service";
import {
  listManagedAdminAssignments,
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

type OverviewStudentMetric = {
  id: string;
  status: "ACTIVE" | "ON_LEAVE";
  courseEndDate: string | null;
  netPoints: number;
};

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toNetPoints(points: number | null | undefined) {
  return Math.abs(Math.min(points ?? 0, 0));
}

function toDateOnlyString(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function getDayDiff(baseDate: Date, targetDate: string | null) {
  if (!targetDate) {
    return null;
  }

  return Math.floor((parseUtcDateFromYmd(targetDate).getTime() - baseDate.getTime()) / 86400000);
}

async function getMockDivisionOverviewMetrics(slug: string, today: string) {
  const [students, snapshot] = await Promise.all([
    listStudents(slug),
    getAttendanceSnapshot(slug, today).catch(() => null),
  ]);

  return {
    students: students
      .filter((student) => student.status === "ACTIVE" || student.status === "ON_LEAVE")
      .map((student) => ({
        id: student.id,
        status: student.status as OverviewStudentMetric["status"],
        courseEndDate: student.courseEndDate,
        netPoints: student.netPoints,
      })) satisfies OverviewStudentMetric[],
    attendance: snapshot
      ? {
          periods: snapshot.periods
            .filter((period) => period.isActive && period.isMandatory)
            .map((period) => ({ id: period.id })),
          records: snapshot.records.map((record) => ({
            periodId: record.periodId,
            status: record.status,
          })),
        }
      : null,
  };
}

async function getDbDivisionOverviewMetrics(divisionId: string, today: string) {
  const prisma = await getPrismaClient();
  const students = await prisma.student.findMany({
    where: {
      divisionId,
      status: {
        in: ["ACTIVE", "ON_LEAVE"],
      },
    },
    select: {
      id: true,
      status: true,
      courseEndDate: true,
    },
  });
  const studentIds = students.map((student) => student.id);
  const [pointTotals, periods] = await Promise.all([
    studentIds.length > 0
      ? prisma.pointRecord.groupBy({
          by: ["studentId"],
          where: {
            studentId: {
              in: studentIds,
            },
          },
          _sum: {
            points: true,
          },
        })
      : Promise.resolve([]),
    prisma.period.findMany({
      where: {
        divisionId,
        isActive: true,
        isMandatory: true,
      },
      select: {
        id: true,
      },
    }),
  ]);

  const pointTotalByStudentId = new Map(
    pointTotals.map((record) => [record.studentId, toNetPoints(record._sum.points)]),
  );
  const periodIds = periods.map((period) => period.id);
  const start = parseUtcDateFromYmd(today);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const attendanceRecords =
    studentIds.length > 0 && periodIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            date: {
              gte: start,
              lt: end,
            },
            studentId: {
              in: studentIds,
            },
            periodId: {
              in: periodIds,
            },
          },
          select: {
            periodId: true,
            status: true,
          },
        })
      : [];

  return {
    students: students.map((student) => ({
      id: student.id,
      status: student.status as OverviewStudentMetric["status"],
      courseEndDate: toDateOnlyString(student.courseEndDate),
      netPoints: pointTotalByStudentId.get(student.id) ?? 0,
    })) satisfies OverviewStudentMetric[],
    attendance: {
      periods,
      records: attendanceRecords,
    },
  };
}

async function getDivisionSummary(
  division: Awaited<ReturnType<typeof listManagedDivisions>>[number],
  allAdmins: Awaited<ReturnType<typeof listManagedAdminAssignments>>,
  today: string,
): Promise<Omit<DivisionOverviewSummary, "name" | "fullName" | "color" | "isActive">> {
  const [metrics, settings] = await Promise.all([
    isMockMode()
      ? getMockDivisionOverviewMetrics(division.slug, today)
      : getDbDivisionOverviewMetrics(division.id, today),
    getDivisionRuleSettings(division.slug),
  ]);
  const { students, attendance } = metrics;
  const todayDate = parseUtcDateFromYmd(today);

  // 학생 통계
  const activeStudents = students.filter((student) => student.status === "ACTIVE");
  const onLeaveStudents = students.filter((student) => student.status === "ON_LEAVE");
  const activeStudentCount = activeStudents.length;
  const studentCount = activeStudentCount + onLeaveStudents.length;

  const allActiveStudents = [...activeStudents, ...onLeaveStudents];

  const riskStudentCount = allActiveStudents.filter(
    (student) => student.netPoints >= settings.warnLevel1,
  ).length;

  const withdrawalRiskCount = allActiveStudents.filter(
    (student) => student.netPoints >= settings.warnWithdraw,
  ).length;

  const expiringCount = allActiveStudents.filter((s) => {
    const diff = getDayDiff(todayDate, s.courseEndDate);
    if (diff === null) return false;
    return diff >= -3 && diff <= 14;
  }).length;

  const urgentExpiringCount = allActiveStudents.filter((s) => {
    const diff = getDayDiff(todayDate, s.courseEndDate);
    if (diff === null) return false;
    return diff >= -3 && diff <= 3;
  }).length;

  // 출석 통계
  let attendanceRate = 0;
  let attendedCount = 0;
  let expectedCount = 0;
  let uncheckedPeriodCount = 0;

  if (attendance) {
    const mandatoryPeriods = attendance.periods;

    for (const period of mandatoryPeriods) {
      const records = attendance.records.filter((record) => record.periodId === period.id);
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
    (admin) => admin.divisionSlug === division.slug && admin.isActive,
  );
  const adminCount = divisionAdmins.filter((a) => a.role === "ADMIN").length;
  const assistantCount = divisionAdmins.filter((a) => a.role === "ASSISTANT").length;

  return {
    slug: division.slug,
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
    listManagedAdminAssignments(),
  ]);

  const summaries = await Promise.all(
    divisions.map(async (division) => {
      const summary = await getDivisionSummary(division, allAdmins, today).catch(() => ({
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
