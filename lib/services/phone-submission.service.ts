import { getMockDivisionBySlug, isMockMode } from "@/lib/mock-data";
import { notFound } from "@/lib/errors";
import {
  readMockState,
  updateMockState,
  type MockPhoneSubmissionRecord,
} from "@/lib/mock-store";
import type { PhoneSubmissionBatchSchemaInput } from "@/lib/phone-submission-schemas";
import { getPrismaClient, getDivisionBySlugOrThrow } from "@/lib/service-helpers";
import { listStudents, type StudentListItem } from "@/lib/services/student.service";

type PhoneActor = {
  id: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ASSISTANT";
};

export type PhoneSubmissionItem = {
  id: string;
  divisionId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  date: string;
  submitted: boolean;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
};

export type PhoneSubmissionSnapshot = {
  date: string;
  students: StudentListItem[];
  records: PhoneSubmissionItem[];
  submittedCount: number;
  notSubmittedCount: number;
  uncheckedCount: number;
};

function serializeRecord(
  record: MockPhoneSubmissionRecord,
  student: StudentListItem,
): PhoneSubmissionItem {
  return {
    id: record.id,
    divisionId: record.divisionId,
    studentId: record.studentId,
    studentName: student.name,
    studentNumber: student.studentNumber,
    date: record.date,
    submitted: record.submitted,
    recordedById: record.recordedById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function serializeDbRecord(
  record: {
    id: string;
    divisionId: string;
    studentId: string;
    date: Date;
    submitted: boolean;
    recordedById: string;
    createdAt: Date;
    updatedAt: Date;
  },
  student: StudentListItem,
): PhoneSubmissionItem {
  return {
    id: record.id,
    divisionId: record.divisionId,
    studentId: record.studentId,
    studentName: student.name,
    studentNumber: student.studentNumber,
    date: record.date.toISOString().slice(0, 10),
    submitted: record.submitted,
    recordedById: record.recordedById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPhoneSubmissionSnapshot(
  divisionSlug: string,
  date: string,
): Promise<PhoneSubmissionSnapshot> {
  const allStudents = await listStudents(divisionSlug);
  const students = allStudents.filter((s) => s.status === "ACTIVE" || s.status === "ON_LEAVE");

  if (isMockMode()) {
    const state = await readMockState();
    const records = (state.phoneSubmissionsByDivision[divisionSlug] ?? []).filter(
      (r) => r.date === date,
    );
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const items = records
      .map((r) => {
        const student = studentMap.get(r.studentId);
        return student ? serializeRecord(r, student) : null;
      })
      .filter((item): item is PhoneSubmissionItem => item !== null);

    const submittedCount = items.filter((i) => i.submitted).length;
    const notSubmittedCount = items.filter((i) => !i.submitted).length;
    const uncheckedCount = students.length - items.length;

    return { date, students, records: items, submittedCount, notSubmittedCount, uncheckedCount };
  }

  const division = await getDivisionBySlugOrThrow(divisionSlug);
  const prisma = await getPrismaClient();
  const [y, m, d] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d));

  const records = await prisma.phoneSubmission.findMany({
    where: { divisionId: division.id, date: targetDate },
    orderBy: { createdAt: "asc" },
  });

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const items = records
    .map((r) => {
      const student = studentMap.get(r.studentId);
      return student ? serializeDbRecord(r, student) : null;
    })
    .filter((item): item is PhoneSubmissionItem => item !== null);

  const submittedCount = items.filter((i) => i.submitted).length;
  const notSubmittedCount = items.filter((i) => !i.submitted).length;
  const uncheckedCount = students.length - items.length;

  return { date, students, records: items, submittedCount, notSubmittedCount, uncheckedCount };
}

export async function upsertPhoneSubmissionBatch(
  divisionSlug: string,
  actor: PhoneActor,
  input: PhoneSubmissionBatchSchemaInput,
): Promise<PhoneSubmissionSnapshot> {
  const { date, records } = input;

  if (isMockMode()) {
    const division = getMockDivisionBySlug(divisionSlug);
    if (!division) throw notFound("지점 정보를 찾을 수 없습니다.");

    await updateMockState((state) => {
      const existing = state.phoneSubmissionsByDivision[divisionSlug] ?? [];
      const now = new Date().toISOString();

      for (const r of records) {
        const idx = existing.findIndex((e) => e.studentId === r.studentId && e.date === date);
        if (idx === -1) {
          existing.push({
            id: `mock-phone-${divisionSlug}-${r.studentId}-${date}-${Date.now()}`,
            divisionId: division.id,
            studentId: r.studentId,
            date,
            submitted: r.submitted,
            recordedById: actor.id,
            createdAt: now,
            updatedAt: now,
          } satisfies MockPhoneSubmissionRecord);
        } else {
          existing[idx] = {
            ...existing[idx],
            submitted: r.submitted,
            recordedById: actor.id,
            updatedAt: now,
          };
        }
      }

      state.phoneSubmissionsByDivision[divisionSlug] = existing;
      return null;
    });

    return getPhoneSubmissionSnapshot(divisionSlug, date);
  }

  const division = await getDivisionBySlugOrThrow(divisionSlug);
  const prisma = await getPrismaClient();
  const [y, m, d] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d));

  await prisma.$transaction(
    records.map((r) =>
      prisma.phoneSubmission.upsert({
        where: {
          studentId_date: { studentId: r.studentId, date: targetDate },
        },
        create: {
          divisionId: division.id,
          studentId: r.studentId,
          date: targetDate,
          submitted: r.submitted,
          recordedById: actor.id,
        },
        update: {
          submitted: r.submitted,
          recordedById: actor.id,
        },
      }),
    ),
  );

  return getPhoneSubmissionSnapshot(divisionSlug, date);
}

export async function listPhoneSubmissions(
  divisionSlug: string,
  options?: {
    dateFrom?: string;
    dateTo?: string;
    studentId?: string;
    onlyNotSubmitted?: boolean;
  },
): Promise<PhoneSubmissionItem[]> {
  const students = await listStudents(divisionSlug);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  if (isMockMode()) {
    const state = await readMockState();
    let records = state.phoneSubmissionsByDivision[divisionSlug] ?? [];
    if (options?.dateFrom) records = records.filter((r) => r.date >= options.dateFrom!);
    if (options?.dateTo) records = records.filter((r) => r.date <= options.dateTo!);
    if (options?.studentId) records = records.filter((r) => r.studentId === options.studentId);
    if (options?.onlyNotSubmitted) records = records.filter((r) => !r.submitted);

    return records
      .map((r) => {
        const student = studentMap.get(r.studentId);
        return student ? serializeRecord(r, student) : null;
      })
      .filter((item): item is PhoneSubmissionItem => item !== null)
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }

  const division = await getDivisionBySlugOrThrow(divisionSlug);
  const prisma = await getPrismaClient();

  const where: Record<string, unknown> = { divisionId: division.id };
  if (options?.dateFrom) {
    const [y, m, d] = options.dateFrom.split("-").map(Number);
    where.date = { ...(where.date as object ?? {}), gte: new Date(Date.UTC(y, m - 1, d)) };
  }
  if (options?.dateTo) {
    const [y, m, d] = options.dateTo.split("-").map(Number);
    where.date = { ...(where.date as object ?? {}), lte: new Date(Date.UTC(y, m - 1, d)) };
  }
  if (options?.studentId) where.studentId = options.studentId;
  if (options?.onlyNotSubmitted) where.submitted = false;

  const records = await prisma.phoneSubmission.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });

  return records
    .map((r) => {
      const student = studentMap.get(r.studentId);
      return student ? serializeDbRecord(r, student) : null;
    })
    .filter((item): item is PhoneSubmissionItem => item !== null);
}
