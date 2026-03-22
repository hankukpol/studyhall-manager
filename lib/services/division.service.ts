import { getMockDivisionBySlug, isMockMode } from "@/lib/mock-data";
import { readMockState } from "@/lib/mock-store";

async function getPrismaClient() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getDivisions(options?: { includeInactive?: boolean }) {
  if (isMockMode()) {
    const state = await readMockState();
    const divisions = state.divisions ?? [];

    return options?.includeInactive
      ? divisions
      : divisions.filter((division) => division.isActive);
  }

  const prisma = await getPrismaClient();

  return prisma.division.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getDivisionBySlug(slug: string) {
  if (isMockMode()) {
    const state = await readMockState();
    return state.divisions.find((division) => division.slug === slug) ?? getMockDivisionBySlug(slug);
  }

  const prisma = await getPrismaClient();

  return prisma.division.findUnique({
    where: { slug },
  });
}
