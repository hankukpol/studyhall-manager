import { NextRequest, NextResponse } from "next/server";

import { getZodErrorMessage, toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { pointRuleSchema } from "@/lib/point-schemas";
import { deletePointRule, updatePointRule } from "@/lib/services/point.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { division: string; id: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = pointRuleSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getZodErrorMessage(parsed.error, "규칙 정보를 다시 확인해주세요.") },
      { status: 400 },
    );
  }

  try {
    const rule = await updatePointRule(params.division, params.id, parsed.data);
    return NextResponse.json({ rule });
  } catch (error) {
    return toApiErrorResponse(error, "상벌점 규칙 처리 중 오류가 발생했습니다.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { division: string; id: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deletePointRule(params.division, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error, "상벌점 규칙 처리 중 오류가 발생했습니다.");
  }
}
