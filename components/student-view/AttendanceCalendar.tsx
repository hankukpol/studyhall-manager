import type { StudentDashboardData } from "@/lib/services/student-dashboard.service";

type AttendanceCalendarProps = {
  weeklyAttendance: StudentDashboardData["weeklyAttendance"];
};

function getStatusClasses(status: StudentDashboardData["weeklyAttendance"]["rows"][number]["cells"][number]["status"]) {
  switch (status) {
    case "PRESENT":
      return "border-slate-200 bg-white text-emerald-700";
    case "TARDY":
      return "border-slate-200 bg-white text-amber-700";
    case "ABSENT":
      return "border-slate-200 bg-white text-rose-700";
    case "EXCUSED":
      return "border-slate-200 bg-white text-blue-700";
    case "HOLIDAY":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "HALF_HOLIDAY":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "NOT_APPLICABLE":
      return "border-slate-200 bg-white text-slate-500";
    case "UPCOMING":
      return "border-slate-200 bg-white text-slate-500";
    case "OFF":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-slate-200 bg-white text-orange-700";
  }
}

export function AttendanceCalendar({ weeklyAttendance }: AttendanceCalendarProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[780px] space-y-3">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `180px repeat(${weeklyAttendance.dates.length}, minmax(88px, 1fr))`,
          }}
        >
          <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            교시
          </div>

          {weeklyAttendance.dates.map((date) => (
            <div
              key={date.date}
              className={`rounded-2xl border px-3 py-3 text-center ${
                date.isToday
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                {date.shortLabel}
              </p>
              <p className="mt-1 text-sm font-medium">{date.label}</p>
              <p className={`mt-1 text-[11px] ${date.isToday ? "text-white/70" : "text-slate-500"}`}>
                {date.isOperatingDay ? "운영일" : "휴무"}
              </p>
            </div>
          ))}
        </div>

        {weeklyAttendance.rows.map((row) => (
          <div
            key={row.periodId}
            className="grid gap-3"
            style={{
              gridTemplateColumns: `180px repeat(${weeklyAttendance.dates.length}, minmax(88px, 1fr))`,
            }}
          >
            <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-4">
              <p className="text-xl font-bold text-slate-950">{row.periodName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {row.startTime} - {row.endTime}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {row.label || (row.isMandatory ? "필수 교시" : "선택 교시")}
              </p>
            </div>

            {row.cells.map((cell) => (
              <div
                key={`${row.periodId}-${cell.date}`}
                className={`rounded-2xl border px-3 py-4 text-center ${getStatusClasses(cell.status)}`}
                title={cell.reason || cell.label}
              >
                <p className="text-sm font-semibold">{cell.label}</p>
                <p className="mt-1 text-[11px]">
                  {cell.reason ? cell.reason : row.label || row.periodName}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
