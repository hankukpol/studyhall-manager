import { NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { getMonthlyExportRows } from "@/lib/services/report.service";

export async function GET(
  request: Request,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "month가 필요합니다." }, { status: 400 });
  }

  try {
    const rows = await getMonthlyExportRows(params.division, month);
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("monthly");

    worksheet.columns = [
      { header: "수험번호", key: "studentNumber", width: 14 },
      { header: "이름", key: "studentName", width: 14 },
      { header: "좌석", key: "seatLabel", width: 12 },
      { header: "출석률", key: "attendanceRate", width: 12 },
      { header: "출석", key: "presentCount", width: 10 },
      { header: "지각", key: "tardyCount", width: 10 },
      { header: "결석", key: "absentCount", width: 10 },
      { header: "순벌점", key: "netPoints", width: 10 },
      { header: "경고 단계", key: "warningStage", width: 14 },
    ];

    rows.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${params.division}-monthly.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toApiErrorResponse(error, "월간 리포트 내보내기에 실패했습니다.");
  }
}
