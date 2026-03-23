import { cache } from "react";

import { notFound } from "@/lib/errors";

export async function getPrismaClient() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const getDivisionBySlugOrThrow = cache(async function getDivisionBySlugOrThrow(
  divisionSlug: string,
) {
  const prisma = await getPrismaClient();
  const division = await prisma.division.findUnique({
    where: {
      slug: divisionSlug,
    },
  });

  if (!division) {
    throw notFound("지점 정보를 찾을 수 없습니다.");
  }

  return division;
});
