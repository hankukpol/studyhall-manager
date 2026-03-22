import { NextRequest, NextResponse } from "next/server";

import { getZodErrorMessage, toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { pointRecordSchema } from "@/lib/point-schemas";
import { createPointRecord, listPointRecords } from "@/lib/services/point.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const records = await listPointRecords(params.division, {
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ records });
  } catch (error) {
    return toApiErrorResponse(error, "상벌점 기록을 불러오지 못했습니다.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = pointRecordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getZodErrorMessage(parsed.error, "상벌점 입력값을 다시 확인해주세요.") },
      { status: 400 },
    );
  }

  try {
    const record = await createPointRecord(params.division, auth.session, parsed.data);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error, "상벌점 기록을 저장하지 못했습니다.");
  }
}
