import {
  getStudentStatusClasses,
  getStudentStatusLabel,
  getWarningStageClasses,
  getWarningStageLabel,
} from "@/lib/student-meta";

export function StudentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStudentStatusClasses(status)}`}
    >
      {getStudentStatusLabel(status)}
    </span>
  );
}

export function WarningStageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getWarningStageClasses(stage)}`}
    >
      {getWarningStageLabel(stage)}
    </span>
  );
}
