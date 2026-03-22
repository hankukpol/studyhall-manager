import { NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { deleteScoreTarget, listScoreTargets } from "@/lib/services/score-target.service";

export async function DELETE(
  _request: Request,
  { params }: { params: { division: string; id: string; targetId: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteScoreTarget(params.division, params.id, params.targetId);
    const targets = await listScoreTargets(params.division, params.id);
    return NextResponse.json({ targets });
  } catch (error) {
    return toApiErrorResponse(error, "성적 목표 삭제 중 오류가 발생했습니다.");
  }
}
