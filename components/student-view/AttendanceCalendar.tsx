import {
  portalCardClass,
  portalInsetClass,
} from "@/components/student-view/StudentPortalUi";
import type { StudentDashboardData } from "@/lib/services/student-dashboard.service";

type AttendanceCalendarProps = {
  weeklyAttendance: StudentDashboardData["weeklyAttendance"];
};

function getStatusClasses(
  status: StudentDashboardData["weeklyAttendance"]["rows"][number]["cells"][number]["status"],
) {
  switch (status) {
    case "PRESENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "TARDY":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ABSENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "EXCUSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "HOLIDAY":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "HALF_HOLIDAY":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "NOT_APPLICABLE":
      return "border-slate-200 bg-slate-50 text-slate-500";
    case "UPCOMING":
      return "border-slate-200 bg-slate-50 text-slate-500";
    case "OFF":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700";
  }
}

function getDateBadgeClass(isToday: boolean) {
  return isToday
    ? "border-transparent"
    : "border-slate-200 bg-white text-slate-700";
}

export function AttendanceCalendar({ weeklyAttendance }: AttendanceCalendarProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {weeklyAttendance.rows.map((row) => (
          <article key={row.periodId} className={`${portalCardClass} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
                  {row.periodName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {row.startTime} - {row.endTime}
                </p>
              </div>
              <span className="inline-flex rounded-[10px] border border-slate-200 bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-slate-600">
                {row.label || (row.isMandatory ? "필수 교시" : "선택 교시")}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {row.cells.map((cell, index) => {
                const date = weeklyAttendance.dates[index];

                return (
                  <div
                    key={`${row.periodId}-${cell.date}`}
                    className={`rounded-[10px] border p-3 ${getStatusClasses(cell.status)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                          {date.shortLabel}
                        </p>
                        <p className="mt-1 text-sm font-medium">{date.label}</p>
                      </div>
                      <span
                        className={`rounded-[10px] border px-2 py-1 text-[11px] font-semibold ${getDateBadgeClass(date.isToday)}`}
                        style={
                          date.isToday
                            ? {
                                backgroundColor: "var(--division-color)",
                                color: "var(--division-on-accent)",
                              }
                            : undefined
                        }
                      >
                        {date.isToday ? "TODAY" : "DAY"}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold">{cell.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-80">
                      {cell.reason || row.label || row.periodName}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[860px] space-y-3">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `196px repeat(${weeklyAttendance.dates.length}, minmax(92px, 1fr))`,
            }}
          >
            <div className={`${portalInsetClass} flex items-center text-sm font-semibold text-slate-700`}>
              교시
            </div>

            {weeklyAttendance.dates.map((date) => (
              <div
                key={date.date}
                className={`rounded-[10px] border px-3 py-3 text-center ${getDateBadgeClass(date.isToday)}`}
                style={
                  date.isToday
                    ? {
                        backgroundColor: "var(--division-color)",
                        color: "var(--division-on-accent)",
                      }
                    : undefined
                }
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {date.shortLabel}
                </p>
                <p className="mt-1 text-sm font-medium">{date.label}</p>
                <p
                  className={`mt-1 text-[11px] ${date.isToday ? "" : "text-slate-500"}`}
                  style={
                    date.isToday
                      ? { color: "var(--division-on-accent-muted)" }
                      : undefined
                  }
                >
                  {date.isOperatingDay ? "운영일" : "휴무일"}
                </p>
              </div>
            ))}
          </div>

          {weeklyAttendance.rows.map((row) => (
            <div
              key={row.periodId}
              className="grid gap-3"
              style={{
                gridTemplateColumns: `196px repeat(${weeklyAttendance.dates.length}, minmax(92px, 1fr))`,
              }}
            >
              <div className={`${portalCardClass} p-4`}>
                <p className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  {row.periodName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.startTime} - {row.endTime}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {row.label || (row.isMandatory ? "필수 교시" : "선택 교시")}
                </p>
              </div>

              {row.cells.map((cell) => (
                <div
                  key={`${row.periodId}-${cell.date}`}
                  className={`rounded-[10px] border px-3 py-4 text-center ${getStatusClasses(cell.status)}`}
                  title={cell.reason || cell.label}
                >
                  <p className="text-sm font-semibold">{cell.label}</p>
                  <p className="mt-1 text-[11px] leading-5 opacity-80">
                    {cell.reason || row.label || row.periodName}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
