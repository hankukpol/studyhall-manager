import { NextRequest, NextResponse } from "next/server";

import { getZodErrorMessage, toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { phoneSubmissionBatchSchema } from "@/lib/phone-submission-schemas";
import {
  getPhoneDaySnapshot,
  listPhoneRecords,
  upsertPhoneCheckBatch,
} from "@/lib/services/phone-submission.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const mode = searchParams.get("mode");

  try {
    if (mode === "snapshot" && date) {
      const snapshot = await getPhoneDaySnapshot(params.division, date);
      return NextResponse.json({ snapshot });
    }

    const records = await listPhoneRecords(params.division, {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
    });
    return NextResponse.json({ records });
  } catch (error) {
    return toApiErrorResponse(error, "휴대폰 제출 현황 처리 중 오류가 발생했습니다.");
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
  const parsed = phoneSubmissionBatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getZodErrorMessage(parsed.error, "제출 정보를 다시 확인해주세요.") },
      { status: 400 },
    );
  }

  try {
    const snapshot = await upsertPhoneCheckBatch(params.division, auth.session, parsed.data);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error, "휴대폰 제출 현황 처리 중 오류가 발생했습니다.");
  }
}
