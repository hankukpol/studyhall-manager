import { listPointRecords, type PointRecordItem } from "@/lib/services/point.service";
import { listPayments } from "@/lib/services/payment.service";
import { getDivisionSettings, getDivisionTheme } from "@/lib/services/settings.service";
import { listStudents } from "@/lib/services/student.service";
import { getAttendanceSnapshots, type AttendanceSnapshot } from "@/lib/services/attendance.service";
import {
  detectRepeatedAbsent,
  detectRepeatedTardy,
} from "@/lib/services/attendance-pattern.service";
import { listExamSchedules, type ExamScheduleItem } from "@/lib/services/exam-schedule.service";
import { listLeavePermissions } from "@/lib/services/leave.service";
import { getPrismaClient } from "@/lib/service-helpers";

export type AdminDashboardData = {
  division: {
    slug: string;
    name: string;
    fullName: string;
    color: string;
  };
  summary: {
    todayDate: string;
    attendanceRate: number;
    attendedCount: number;
    expectedCount: number;
    deltaFromYesterday: number;
    riskStudentCount: number;
    uncheckedPeriodCount: number;
    weeklyTardyAbsentCount: number;
    weeklyTardyCount: number;
    weeklyAbsentCount: number;
  };
  periodRows: Array<{
    periodId: string;
    periodName: string;
    label: string | null;
    attendanceRate: number;
    isUnchecked: boolean;
    counts: {
      present: number;
      tardy: number;
      absent: number;
      excused: number;
      holiday: number;
      halfHoliday: number;
      notApplicable: number;
      unprocessed: number;
    };
  }>;
  riskStudents: Array<{
    id: string;
    name: string;
    studentNumber: string;
    phone: string | null;
    seatLabel: string | null;
    netPoints: number;
    warningStage: string;
  }>;
  attentionStudents: Array<{
    studentId: string;
    studentName: string;
    studentNumber: string;
    seatLabel: string | null;
    phone: string | null;
    type: "TARDY" | "ABSENT";
    count: number;
    message: string;
  }>;
  recentPoints: PointRecordItem[];
  periodSchedules: Array<{
    periodId: string;
    periodName: string;
    startTime: string;
    endTime: string;
  }>;
  studentOverview: {
    activeCount: number;
    onLeaveCount: number;
  };
  paymentStats: {
    thisMonthTotal: number;
    thisMonthCount: number;
    recentPayments: Array<{
      studentName: string;
      studentNumber: string;
      amount: number;
      paymentDate: string;
      paymentTypeName: string;
      method: string | null;
    }>;
  };
  expiringStudents: Array<{
    id: string;
    name: string;
    studentNumber: string;
    studyTrack: string | null;
    phone: string | null;
    seatLabel: string | null;
    courseEndDate: string;
    daysRemaining: number;
  }>;
  upcomingExamSchedules: ExamScheduleItem[];
  newStudents: Array<{
    id: string;
    name: string;
    studentNumber: string;
    studyTrack: string | null;
    phone: string | null;
    seatLabel: string | null;
    enrolledAt: string;
    daysAgo: number;
  }>;
  todayLeaveStudents: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentNumber: string;
    seatLabel: string | null;
    type: string;
    status: string;
  }>;
  interviewNeededStudents: Array<{
    id: string;
    name: string;
    studentNumber: string;
    seatLabel: string | null;
    phone: string | null;
    netPoints: number;
    warningStage: string;
    lastInterviewDate: string | null;
  }>;
};

function getKstDate(offsetDays = 0) {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + offsetDays);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

function getKstDateFromString(date: string, offsetDays: number) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  target.setUTCDate(target.getUTCDate() + offsetDays);
  return target.toISOString().slice(0, 10);
}

function getPreviousDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  target.setUTCDate(target.getUTCDate() - 1);
  return target.toISOString().slice(0, 10);
}

function getWeekStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const weekday = target.getUTCDay();
  const diffToMonday = weekday === 0 ? 6 : weekday - 1;
  target.setUTCDate(target.getUTCDate() - diffToMonday);
  return target.toISOString().slice(0, 10);
}

function createCounts() {
  return {
    present: 0,
    tardy: 0,
    absent: 0,
    excused: 0,
    holiday: 0,
    halfHoliday: 0,
    notApplicable: 0,
    unprocessed: 0,
  };
}

function buildRateSummary(
  snapshot: AttendanceSnapshot,
  activeStudentCount: number,
) {
  const mandatoryPeriods = snapshot.periods.filter((period) => period.isActive && period.isMandatory);
  let attendedCount = 0;
  let expectedCount = 0;

  for (const period of mandatoryPeriods) {
    const records = snapshot.records.filter((record) => record.periodId === period.id);
    const counts = createCounts();

    for (const record of records) {
      switch (record.status) {
        case "PRESENT":
          counts.present += 1;
          break;
        case "TARDY":
          counts.tardy += 1;
          break;
        case "ABSENT":
          counts.absent += 1;
          break;
        case "EXCUSED":
          counts.excused += 1;
          break;
        case "HOLIDAY":
          counts.holiday += 1;
          break;
        case "HALF_HOLIDAY":
          counts.halfHoliday += 1;
          break;
        case "NOT_APPLICABLE":
          counts.notApplicable += 1;
          break;
      }
    }

    attendedCount += counts.present + counts.tardy + counts.holiday + counts.halfHoliday;
    expectedCount += Math.max(activeStudentCount - counts.notApplicable, 0);
  }

  return {
    attendedCount,
    expectedCount,
    attendanceRate:
      expectedCount > 0 ? Number(((attendedCount / expectedCount) * 100).toFixed(1)) : 0,
  };
}

function buildPeriodRows(
  snapshot: AttendanceSnapshot,
  activeStudentCount: number,
) {
  return snapshot.periods
    .filter((period) => period.isActive)
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((period) => {
      const counts = createCounts();

      for (const record of snapshot.records.filter((candidate) => candidate.periodId === period.id)) {
        switch (record.status) {
          case "PRESENT":
            counts.present += 1;
            break;
          case "TARDY":
            counts.tardy += 1;
            break;
          case "ABSENT":
            counts.absent += 1;
            break;
          case "EXCUSED":
            counts.excused += 1;
            break;
          case "HOLIDAY":
            counts.holiday += 1;
            break;
          case "HALF_HOLIDAY":
            counts.halfHoliday += 1;
            break;
          case "NOT_APPLICABLE":
            counts.notApplicable += 1;
            break;
        }
      }

      const processed =
        counts.present +
        counts.tardy +
        counts.absent +
        counts.excused +
        counts.holiday +
        counts.halfHoliday +
        counts.notApplicable;
      counts.unprocessed = Math.max(activeStudentCount - processed, 0);

      const attended = counts.present + counts.tardy + counts.holiday + counts.halfHoliday;
      const expected = Math.max(activeStudentCount - counts.notApplicable, 0);
      const attendanceRate = expected > 0 ? Number(((attended / expected) * 100).toFixed(1)) : 0;

      return {
        periodId: period.id,
        periodName: period.name,
        label: period.label,
        attendanceRate,
        isUnchecked: period.isMandatory && counts.unprocessed > 0,
        counts,
      };
    });
}

function countWeeklyIssues(
  snapshots: AttendanceSnapshot[],
) {
  let tardyCount = 0;
  let absentCount = 0;

  for (const snapshot of snapshots) {
    for (const record of snapshot.records) {
      if (record.status === "TARDY") {
        tardyCount += 1;
      }

      if (record.status === "ABSENT") {
        absentCount += 1;
      }
    }
  }

  return {
    weeklyTardyCount: tardyCount,
    weeklyAbsentCount: absentCount,
    weeklyTardyAbsentCount: tardyCount + absentCount,
  };
}

function getSnapshotOrThrow(snapshotMap: Map<string, AttendanceSnapshot>, date: string) {
  const snapshot = snapshotMap.get(date);

  if (!snapshot) {
    throw new Error(`출석 스냅샷을 찾을 수 없습니다: ${date}`);
  }

  return snapshot;
}

export async function getAdminDashboardData(divisionSlug: string): Promise<AdminDashboardData> {
  const today = getKstDate();
  const yesterday = getPreviousDate(today);
  const weekStart = getWeekStart(today);
  const weekDates: string[] = [];
  let cursor = weekStart;

  while (cursor <= today) {
    weekDates.push(cursor);
    cursor = getKstDateFromString(cursor, 1);
  }

  const snapshotDates = Array.from(new Set([today, yesterday, ...weekDates]));
  const firstDayOfMonth = today.slice(0, 7) + "-01";

  const thirtyDaysAgo = getKstDateFromString(today, -30);

  const prismaClient = await getPrismaClient();
  const divisionRow = await prismaClient.division.findUnique({
    where: { slug: divisionSlug },
    select: { id: true },
  });
  const divisionId = divisionRow?.id;

  const results = await Promise.allSettled([
    getDivisionTheme(divisionSlug),
    getDivisionSettings(divisionSlug),
    listStudents(divisionSlug),
    getAttendanceSnapshots(divisionSlug, snapshotDates),
    listPointRecords(divisionSlug, { limit: 5 }),
    listPayments(divisionSlug, { dateFrom: firstDayOfMonth, dateTo: today }),
    listLeavePermissions(divisionSlug, { month: today.slice(0, 7) }),
    divisionId
      ? prismaClient.interview.groupBy({
          by: ["studentId"],
          where: {
            student: { divisionId },
            date: { gte: new Date(thirtyDaysAgo + "T00:00:00Z") },
          },
          _max: { date: true },
        })
      : Promise.resolve([]),
    listExamSchedules(divisionSlug, { onlyActive: true }),
  ]);

  const [division, settings, students, snapshots, recentPoints, thisMonthPayments, todayLeaves, interviewGroups, examSchedules] = results.map(
    (r) => (r.status === "fulfilled" ? r.value : null),
  ) as [
    Awaited<ReturnType<typeof getDivisionTheme>>,
    Awaited<ReturnType<typeof getDivisionSettings>>,
    Awaited<ReturnType<typeof listStudents>>,
    Awaited<ReturnType<typeof getAttendanceSnapshots>>,
    Awaited<ReturnType<typeof listPointRecords>>,
    Awaited<ReturnType<typeof listPayments>>,
    Awaited<ReturnType<typeof listLeavePermissions>>,
    { studentId: string; _max: { date: Date | null } }[],
    Awaited<ReturnType<typeof listExamSchedules>>,
  ];

  if (!division || !settings || !students || !snapshots) {
    throw new Error("Failed to load required dashboard data");
  }
  const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));
  const todaySnapshot = getSnapshotOrThrow(snapshotMap, today);
  const yesterdaySnapshot = getSnapshotOrThrow(snapshotMap, yesterday);

  const activeStudents = students.filter(
    (student) => student.status === "ACTIVE" || student.status === "ON_LEAVE",
  );
  const weeklySnapshots = weekDates.map((date) => getSnapshotOrThrow(snapshotMap, date));

  const todaySummary = buildRateSummary(todaySnapshot, activeStudents.length);
  const yesterdaySummary = buildRateSummary(yesterdaySnapshot, activeStudents.length);
  const periodRows = buildPeriodRows(todaySnapshot, activeStudents.length);
  const weeklyIssues = countWeeklyIssues(weeklySnapshots);
  const [repeatedTardyResult, repeatedAbsentResult] = await Promise.allSettled([
    detectRepeatedTardy(divisionSlug),
    detectRepeatedAbsent(divisionSlug),
  ]);
  const repeatedTardy = repeatedTardyResult.status === "fulfilled" ? repeatedTardyResult.value : [];
  const repeatedAbsent = repeatedAbsentResult.status === "fulfilled" ? repeatedAbsentResult.value : [];
  const attentionStudentMap = new Map(
    [...repeatedAbsent, ...repeatedTardy].map((student) => [student.studentId, student]),
  );
  const riskStudents = students
    .filter((student) => student.netPoints >= settings.warnLevel1)
    .sort((left, right) => right.netPoints - left.netPoints)
    .map((student) => ({
      id: student.id,
      name: student.name,
      studentNumber: student.studentNumber,
      phone: student.phone,
      seatLabel: student.seatLabel,
      netPoints: student.netPoints,
      warningStage: student.warningStage,
    }));

  // ── 학생 현황 ──────────────────────────────────────────────────────────────
  const studentOverview = {
    activeCount: students.filter((s) => s.status === "ACTIVE").length,
    onLeaveCount: students.filter((s) => s.status === "ON_LEAVE").length,
  };

  // ── 수납 현황 ──────────────────────────────────────────────────────────────
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const paymentStats = {
    thisMonthTotal,
    thisMonthCount: thisMonthPayments.length,
    recentPayments: [...thisMonthPayments]
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
      .slice(0, 5)
      .map((p) => ({
        studentName: p.studentName,
        studentNumber: p.studentNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentTypeName: p.paymentTypeName,
        method: p.method,
      })),
  };

  // ── 수강 만료 임박 ─────────────────────────────────────────────────────────
  const todayMs = new Date(today + "T00:00:00Z").getTime();
  const expiringStudents = activeStudents
    .filter((s) => s.courseEndDate !== null)
    .map((s) => {
      const endMs = new Date(s.courseEndDate! + "T00:00:00Z").getTime();
      const daysRemaining = Math.round((endMs - todayMs) / 86400000);
      return { ...s, daysRemaining };
    })
    .filter((s) => s.daysRemaining >= -3 && s.daysRemaining <= 14)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map((s) => ({
      id: s.id,
      name: s.name,
      studentNumber: s.studentNumber,
      studyTrack: s.studyTrack,
      phone: s.phone,
      seatLabel: s.seatLabel,
      courseEndDate: s.courseEndDate!,
      daysRemaining: s.daysRemaining,
    }));

  // ── 신규 입실 ──────────────────────────────────────────────────────────────
  const tenDaysAgoMs = todayMs - 10 * 86400000;
  const newStudents = students
    .filter((s) => s.status === "ACTIVE" || s.status === "ON_LEAVE")
    .map((s) => {
      const enrolledMs = new Date(s.enrolledAt).getTime();
      const daysAgo = Math.round((todayMs - enrolledMs) / 86400000);
      return { ...s, daysAgo };
    })
    .filter((s) => s.daysAgo >= 0 && new Date(s.enrolledAt).getTime() >= tenDaysAgoMs)
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .map((s) => ({
      id: s.id,
      name: s.name,
      studentNumber: s.studentNumber,
      studyTrack: s.studyTrack,
      phone: s.phone,
      seatLabel: s.seatLabel,
      enrolledAt: s.enrolledAt,
      daysAgo: s.daysAgo,
    }));

  // ── 오늘 외출/휴가 학생 ────────────────────────────────────────────────────
  const studentSeatMap = new Map(students.map((s) => [s.id, s.seatLabel]));
  const todayLeaveStudents = todayLeaves
    .filter((l) => l.date === today && l.status !== "REJECTED")
    .map((l) => ({
      id: l.id,
      studentId: l.studentId,
      studentName: l.studentName,
      studentNumber: l.studentNumber,
      seatLabel: studentSeatMap.get(l.studentId) ?? null,
      type: l.type,
      status: l.status,
    }));

  // ── 면담 필요 학생 (면담 기준 벌점 이상 + 30일 내 면담 없음) ─────────────
  const latestInterviewByStudent = new Map<string, string>(
    (interviewGroups ?? [])
      .filter((g) => g._max.date != null)
      .map((g) => [g.studentId, g._max.date!.toISOString().slice(0, 10)]),
  );
  const interviewNeededStudents = students
    .filter((s) => s.status === "ACTIVE" && s.netPoints >= settings.warnInterview)
    .filter((s) => {
      const lastDate = latestInterviewByStudent.get(s.id) ?? null;
      if (!lastDate) return true;
      return lastDate < thirtyDaysAgo;
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      studentNumber: s.studentNumber,
      seatLabel: s.seatLabel,
      phone: s.phone,
      netPoints: s.netPoints,
      warningStage: s.warningStage,
      lastInterviewDate: latestInterviewByStudent.get(s.id) ?? null,
    }))
    .sort((a, b) => b.netPoints - a.netPoints);

  return {
    division: {
      slug: divisionSlug,
      name: division.name,
      fullName: division.fullName,
      color: division.color,
    },
    summary: {
      todayDate: today,
      attendanceRate: todaySummary.attendanceRate,
      attendedCount: todaySummary.attendedCount,
      expectedCount: todaySummary.expectedCount,
      deltaFromYesterday: Number(
        (todaySummary.attendanceRate - yesterdaySummary.attendanceRate).toFixed(1),
      ),
      riskStudentCount: riskStudents.length,
      uncheckedPeriodCount: periodRows.filter((row) => row.isUnchecked).length,
      weeklyTardyAbsentCount: weeklyIssues.weeklyTardyAbsentCount,
      weeklyTardyCount: weeklyIssues.weeklyTardyCount,
      weeklyAbsentCount: weeklyIssues.weeklyAbsentCount,
    },
    periodRows,
    periodSchedules: todaySnapshot.periods
      .filter((p) => p.isActive && p.startTime && p.endTime)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => ({
        periodId: p.id,
        periodName: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
    riskStudents,
    attentionStudents: Array.from(attentionStudentMap.values()).sort(
      (left, right) =>
        right.count - left.count ||
        left.studentNumber.localeCompare(right.studentNumber, "ko"),
    ),
    recentPoints,
    studentOverview,
    paymentStats,
    expiringStudents,
    newStudents,
    upcomingExamSchedules: examSchedules ?? [],
    todayLeaveStudents,
    interviewNeededStudents,
  };
}
