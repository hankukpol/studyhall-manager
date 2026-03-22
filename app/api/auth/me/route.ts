import { NextResponse } from "next/server";

import { getCurrentAdminSession, getCurrentStudentSession } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdminSession();

  if (admin) {
    return NextResponse.json({ kind: "admin", session: admin });
  }

  const student = await getCurrentStudentSession();

  if (student) {
    return NextResponse.json({ kind: "student", session: student });
  }

  return NextResponse.json({ error: "인증 정보가 없습니다." }, { status: 401 });
}
