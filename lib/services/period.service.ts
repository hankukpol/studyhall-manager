import { readMockState, type MockPeriodRecord, updateMockState } from "@/lib/mock-store";
import { getMockDivisionBySlug, isMockMode } from "@/lib/mock-data";

export type PeriodRecord = {
  id: string;
  divisionId: string;
  name: string;
  label: string | null;
  displayOrder: number;
  startTime: string;
  endTime: string;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type PeriodInput = {
  name: string;
  label?: string | null;
  startTime: string;
  endTime: string;
  isMandatory: boolean;
  isActive: boolean;
};

async function getPrismaClient() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function sortPeriods<T extends { displayOrder: number }>(periods: T[]) {
  return [...periods].sort((left, right) => left.displayOrder - right.displayOrder);
}

function reindexMockPeriods(periods: MockPeriodRecord[]) {
  return sortPeriods(periods).map((period, index) => ({
    ...period,
    displayOrder: index,
    updatedAt: new Date().toISOString(),
  }));
}

async function getDivisionOrThrow(divisionSlug: string) {
  const prisma = await getPrismaClient();
  const division = await prisma.division.findUnique({
    where: { slug: divisionSlug },
  });

  if (!division) {
    throw new Error(`Division not found for slug: ${divisionSlug}`);
  }

  return division;
}

async function reorderDivisionPeriodsInDb(divisionId: string, orderedIds: string[]) {
  const prisma = await getPrismaClient();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.period.update({
        where: { id },
        data: { displayOrder: index + 1000 },
      }),
    ),
  );

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.period.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
  );

  return prisma.period.findMany({
    where: { divisionId },
    orderBy: { displayOrder: "asc" },
  });
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function getPeriods(divisionSlug: string) {
  if (isMockMode()) {
    const state = await readMockState();
    return sortPeriods(state.periodsByDivision[divisionSlug] ?? []);
  }

  const division = await getDivisionOrThrow(divisionSlug);
  const prisma = await getPrismaClient();

  return prisma.period.findMany({
    where: { divisionId: division.id },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createPeriod(divisionSlug: string, input: PeriodInput) {
  if (isMockMode()) {
    return updateMockState(async (state) => {
      const division = getMockDivisionBySlug(divisionSlug);
      if (!division) {
        throw new Error(`Mock division not found for slug: ${divisionSlug}`);
      }
      const periods = state.periodsByDivision[divisionSlug] ?? [];
      const nextPeriod: MockPeriodRecord = {
        id: `mock-period-${divisionSlug}-${Date.now()}`,
        divisionId: division.id,
        name: input.name,
        label: input.label?.trim() ? input.label.trim() : null,
        displayOrder: periods.length,
        startTime: input.startTime,
        endTime: input.endTime,
        isMandatory: input.isMandatory,
        isActive: input.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.periodsByDivision[divisionSlug] = reindexMockPeriods([...periods, nextPeriod]);
      return state.periodsByDivision[divisionSlug].find((period) => period.id === nextPeriod.id) ?? nextPeriod;
    });
  }

  const prisma = await getPrismaClient();
  const division = await getDivisionOrThrow(divisionSlug);
  const count = await prisma.period.count({ where: { divisionId: division.id } });

  return prisma.period.create({
    data: {
      divisionId: division.id,
      name: input.name,
      label: input.label?.trim() ? input.label.trim() : null,
      displayOrder: count,
      startTime: input.startTime,
      endTime: input.endTime,
      isMandatory: input.isMandatory,
      isActive: input.isActive,
    },
  });
}

export async function updatePeriod(
  divisionSlug: string,
  periodId: string,
  input: Partial<PeriodInput> & { reorderIds?: string[] },
) {
  if (isMockMode()) {
    return updateMockState(async (state) => {
      const periods = state.periodsByDivision[divisionSlug] ?? [];
      if (input.reorderIds?.length) {
        const reordered = input.reorderIds
          .map((id) => periods.find((period) => period.id === id))
          .filter(Boolean) as MockPeriodRecord[];
        state.periodsByDivision[divisionSlug] = reindexMockPeriods(reordered);
        return state.periodsByDivision[divisionSlug];
      }
      state.periodsByDivision[divisionSlug] = periods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              name: input.name ?? period.name,
              label: input.label === undefined ? period.label : input.label?.trim() ? input.label.trim() : null,
              startTime: input.startTime ?? period.startTime,
              endTime: input.endTime ?? period.endTime,
              isMandatory: input.isMandatory ?? period.isMandatory,
              isActive: input.isActive ?? period.isActive,
              updatedAt: new Date().toISOString(),
            }
          : period,
      );
      return state.periodsByDivision[divisionSlug].find((period) => period.id === periodId) ?? null;
    });
  }

  const prisma = await getPrismaClient();
  const division = await getDivisionOrThrow(divisionSlug);

  if (input.reorderIds?.length) {
    return reorderDivisionPeriodsInDb(division.id, input.reorderIds);
  }

  const period = await prisma.period.findFirst({
    where: {
      id: periodId,
      divisionId: division.id,
    },
  });

  if (!period) {
    throw new Error("Period not found.");
  }

  return prisma.period.update({
    where: { id: periodId },
    data: {
      name: input.name ?? undefined,
      label:
        input.label === undefined
          ? undefined
          : input.label?.trim()
            ? input.label.trim()
            : null,
      startTime: input.startTime ?? undefined,
      endTime: input.endTime ?? undefined,
      isMandatory: input.isMandatory ?? undefined,
      isActive: input.isActive ?? undefined,
    },
  });
}

export async function deletePeriod(divisionSlug: string, periodId: string) {
  if (isMockMode()) {
    return updateMockState(async (state) => {
      const periods = state.periodsByDivision[divisionSlug] ?? [];
      state.periodsByDivision[divisionSlug] = reindexMockPeriods(
        periods.filter((period) => period.id !== periodId),
      );
      return state.periodsByDivision[divisionSlug];
    });
  }

  const prisma = await getPrismaClient();
  const division = await getDivisionOrThrow(divisionSlug);
  const period = await prisma.period.findFirst({
    where: {
      id: periodId,
      divisionId: division.id,
    },
    select: { id: true },
  });

  if (!period) {
    throw new Error("Period not found.");
  }

  await prisma.period.delete({
    where: { id: periodId },
  });

  const remaining = await prisma.period.findMany({
    where: { divisionId: division.id },
    orderBy: { displayOrder: "asc" },
    select: { id: true },
  });

  return reorderDivisionPeriodsInDb(
    division.id,
    remaining.map((item) => item.id),
  );
}

export async function getCurrentPeriod(divisionSlug: string, now = new Date()) {
  const periods = await getPeriods(divisionSlug);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return periods.find((period) => {
    if (!period.isActive) {
      return false;
    }

    const start = timeToMinutes(period.startTime);
    const end = timeToMinutes(period.endTime) + 5;

    return currentMinutes >= start && currentMinutes <= end;
  }) ?? null;
}

