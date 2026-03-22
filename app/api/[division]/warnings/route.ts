import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { listWarningStudents } from "@/lib/services/point.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const students = await listWarningStudents(params.division);
    return NextResponse.json({ students });
  } catch (error) {
    return toApiErrorResponse(error, "경고 대상자 정보를 불러오지 못했습니다.");
  }
}
