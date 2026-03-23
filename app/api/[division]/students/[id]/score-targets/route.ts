import { NextRequest, NextResponse } from "next/server";

import { getZodErrorMessage, toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { scoreTargetUpsertSchema } from "@/lib/score-target-schemas";
import { listScoreTargets, upsertScoreTarget } from "@/lib/services/score-target.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { division: string; id: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const targets = await listScoreTargets(params.division, params.id);
    return NextResponse.json({ targets }, { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" } });
  } catch (error) {
    return toApiErrorResponse(error, "성적 목표를 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { division: string; id: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = scoreTargetUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getZodErrorMessage(parsed.error, "성적 목표 입력값을 다시 확인해 주세요.") },
      { status: 400 },
    );
  }

  try {
    const target = await upsertScoreTarget(params.division, params.id, parsed.data);
    const targets = await listScoreTargets(params.division, params.id);
    return NextResponse.json({ target, targets });
  } catch (error) {
    return toApiErrorResponse(error, "성적 목표 저장 중 오류가 발생했습니다.");
  }
}
