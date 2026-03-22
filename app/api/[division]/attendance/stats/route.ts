import { NextRequest, NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api-auth";
import { getAttendanceStats } from "@/lib/services/attendance.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo") ?? dateFrom;

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "dateFrom 및 dateTo 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const stats = await getAttendanceStats(params.division, dateFrom, dateTo);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "출석 통계를 계산하지 못했습니다." },
      { status: 400 },
    );
  }
}
