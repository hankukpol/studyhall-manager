import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { toApiErrorResponse } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { getAttendanceExportRows } from "@/lib/services/report.service";

export async function GET(
  request: Request,
  { params }: { params: { division: string } },
) {
  const auth = await requireApiAuth(params.division, ["ADMIN", "SUPER_ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "dateFrom과 dateTo가 필요합니다." }, { status: 400 });
  }

  try {
    const rows = await getAttendanceExportRows(params.division, dateFrom, dateTo);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("attendance");

    worksheet.columns = [
      { header: "날짜", key: "date", width: 14 },
      { header: "수험번호", key: "studentNumber", width: 14 },
      { header: "이름", key: "studentName", width: 14 },
      { header: "좌석", key: "seatLabel", width: 12 },
      { header: "교시", key: "periodName", width: 14 },
      { header: "상태", key: "statusLabel", width: 14 },
      { header: "사유", key: "reason", width: 28 },
    ];

    rows.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${params.division}-attendance.xlsx"`,
      },
    });
  } catch (error) {
    return toApiErrorResponse(error, "출석 내보내기에 실패했습니다.");
  }
}
