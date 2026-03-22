import { NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { getAdminDashboardData } from "@/lib/services/admin-dashboard.service";

export async function GET(
  _request: Request,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getAdminDashboardData(params.division);
    return NextResponse.json({ data });
  } catch (error) {
    return toApiErrorResponse(error, "대시보드 데이터를 불러오지 못했습니다.", 500);
  }
}
