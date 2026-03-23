import { NextResponse } from "next/server";

import { requireApiSuperAdminAuth } from "@/lib/api-auth";
import { getSuperAdminOverview } from "@/lib/services/super-admin-overview.service";

export async function GET() {
  const auth = await requireApiSuperAdminAuth();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const divisions = await getSuperAdminOverview();
    return NextResponse.json({ divisions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
