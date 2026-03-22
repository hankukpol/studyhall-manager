"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { toast } from "sonner";

import {
  ATTENDANCE_STATUS_OPTIONS,
  getAttendanceStatusClasses,
  getAttendanceStatusLabel,
  type AttendanceOptionValue,
} from "@/lib/attendance-meta";

type PeriodItem = {
  id: string;
  name: string;
  label: string | null;
  startTime: string;
  endTime: string;
  isMandatory: boolean;
  isActive: boolean;
};

type StudentItem = {
  id: string;
  name: string;
  studentNumber: string;
  seatLabel: string | null;
  seatDisplay: string | null;
  studyRoomName: string | null;
  studyTrack: string | null;
};

type AttendanceRecordItem = {
  studentId: string;
  periodId: string;
  status: Exclude<AttendanceOptionValue, "">;
  reason: string | null;
};

export type MobileCheckFormProps = {
  divisionSlug: string;
  initialDate: string;
  initialPeriods: PeriodItem[];
  initialPeriodId: string | null;
  initialStudents: StudentItem[];
  initialRecords: AttendanceRecordItem[];
};

type FormState = Record<
  string,
  {
    status: AttendanceOptionValue;
    reason: string;
  }
>;

type SwipeContext = {
  studentId: string;
  startX: number;
  startY: number;
  width: number;
};

const QUICK_STATUS_BUTTONS: Array<{
  label: string;
  value: Extract<AttendanceOptionValue, "PRESENT" | "TARDY" | "ABSENT">;
  activeClassName: string;
}> = [
  { label: "출석", value: "PRESENT", activeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { label: "지각", value: "TARDY", activeClassName: "border-amber-200 bg-amber-50 text-amber-700" },
  { label: "결석", value: "ABSENT", activeClassName: "border-rose-200 bg-rose-50 text-rose-700" },
];

function buildInitialState(students: StudentItem[], records: AttendanceRecordItem[]): FormState {
  const recordMap = new Map(records.map((record) => [record.studentId, record]));
  const state: FormState = {};

  for (const student of students) {
    const record = recordMap.get(student.id);
    state[student.id] = {
      status: record?.status ?? "",
      reason: record?.reason ?? "",
    };
  }

  return state;
}

export function MobileCheckForm({
  divisionSlug,
  initialDate,
  initialPeriods,
  initialPeriodId,
  initialStudents,
  initialRecords,
}: MobileCheckFormProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPeriodId, setSelectedPeriodId] = useState(initialPeriodId ?? initialPeriods[0]?.id ?? "");
  const [students, setStudents] = useState(initialStudents);
  const [periods] = useState(initialPeriods);
  const [formState, setFormState] = useState<FormState>(() => buildInitialState(initialStudents, initialRecords));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState(false);
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const swipeRef = useRef<SwipeContext | null>(null);

  const selectedPeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) ?? null,
    [periods, selectedPeriodId],
  );

  const summary = useMemo(() => {
    let checkedCount = 0;
    let presentCount = 0;
    let absentCount = 0;

    for (const student of students) {
      const status = formState[student.id]?.status ?? "";

      if (status) {
        checkedCount += 1;
      }

      if (status === "PRESENT") {
        presentCount += 1;
      }

      if (status === "ABSENT") {
        absentCount += 1;
      }
    }

    return {
      checkedCount,
      uncheckedCount: Math.max(students.length - checkedCount, 0),
      presentCount,
      absentCount,
    };
  }, [formState, students]);

  const visibleStudents = useMemo(() => {
    if (!showOnlyUnchecked) {
      return students;
    }

    return students.filter((student) => !formState[student.id]?.status);
  }, [formState, showOnlyUnchecked, students]);

  useEffect(() => {
    if (!selectedPeriodId) {
      return;
    }

    let isMounted = true;

    async function loadSnapshot() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/${divisionSlug}/attendance?date=${selectedDate}&periodId=${selectedPeriodId}`,
          { cache: "no-store" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "출결 데이터를 불러오지 못했습니다.");
        }

        if (!isMounted) {
          return;
        }

        setStudents(data.students);
        setFormState(buildInitialState(data.students, data.records));
        setShowOnlyUnchecked(false);
        setSwipeOffsets({});
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "출결 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, [divisionSlug, selectedDate, selectedPeriodId]);

  function updateStudentState(studentId: string, value: Partial<{ status: AttendanceOptionValue; reason: string }>) {
    setFormState((current) => ({
      ...current,
      [studentId]: {
        status: value.status ?? current[studentId]?.status ?? "",
        reason: value.reason ?? current[studentId]?.reason ?? "",
      },
    }));
  }

  function applyStudentStatus(studentId: string, status: AttendanceOptionValue, vibrate = false) {
    updateStudentState(studentId, {
      status,
      reason: status === "ABSENT" || status === "EXCUSED" ? formState[studentId]?.reason ?? "" : "",
    });

    if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(25);
    }
  }

  function markAllPresent() {
    setFormState((current) => {
      const next: FormState = { ...current };
      for (const student of students) {
        next[student.id] = { status: "PRESENT", reason: "" };
      }
      return next;
    });
  }

  async function refreshCurrentPeriod() {
    try {
      const response = await fetch(`/api/${divisionSlug}/periods/current`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "현재 교시를 조회하지 못했습니다.");
      }

      if (data.period?.id) {
        setSelectedPeriodId(data.period.id);
        toast.success(`현재 교시를 ${data.period.name}로 맞췄습니다.`);
      } else {
        toast.message("현재 시간대에는 해당하는 활성 교시가 없습니다.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "현재 교시를 조회하지 못했습니다.");
    }
  }

  async function handleSave() {
    if (!selectedPeriodId) {
      toast.error("교시를 선택해 주세요.");
      return;
    }

    const unresolved = students.find((student) => !formState[student.id]?.status);
    if (unresolved) {
      toast.error(`${unresolved.name} 학생의 출결 상태가 비어 있습니다.`);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/${divisionSlug}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          date: selectedDate,
          records: students.map((student) => ({
            studentId: student.id,
            status: formState[student.id].status,
            reason: formState[student.id].reason || null,
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "출결 저장에 실패했습니다.");
      }

      setFormState(buildInitialState(data.students, data.records));
      setSwipeOffsets({});
      toast.success("출결 기록을 저장했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "출결 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSwipeStart(studentId: string, event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    const width = event.currentTarget.getBoundingClientRect().width;

    swipeRef.current = {
      studentId,
      startX: touch.clientX,
      startY: touch.clientY,
      width,
    };
  }

  function handleSwipeMove(studentId: string, event: TouchEvent<HTMLDivElement>) {
    const currentSwipe = swipeRef.current;
    if (!currentSwipe || currentSwipe.studentId !== studentId) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - currentSwipe.startX;
    const deltaY = touch.clientY - currentSwipe.startY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      setSwipeOffsets((current) => ({ ...current, [studentId]: 0 }));
      return;
    }

    const maxOffset = Math.min(120, currentSwipe.width * 0.34);
    const bounded = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    setSwipeOffsets((current) => ({ ...current, [studentId]: bounded }));
  }

  function handleSwipeEnd(studentId: string) {
    const currentSwipe = swipeRef.current;
    const offset = swipeOffsets[studentId] ?? 0;

    if (currentSwipe?.studentId === studentId) {
      const threshold = Math.min(88, currentSwipe.width * 0.24);

      if (offset >= threshold) {
        applyStudentStatus(studentId, "PRESENT", true);
      } else if (offset <= -threshold) {
        applyStudentStatus(studentId, "ABSENT", true);
      }
    }

    swipeRef.current = null;
    setSwipeOffsets((current) => ({ ...current, [studentId]: 0 }));
  }

  return (
    <div className="space-y-4">
      <section className="sticky top-[72px] z-20 rounded-[28px] border border-black/5 bg-white/95 p-4 shadow-[0_16px_36px_rgba(18,32,56,0.08)] backdrop-blur">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Mobile Attendance</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                {selectedPeriod ? selectedPeriod.name : "교시 선택"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {selectedPeriod
                  ? `${selectedPeriod.startTime} - ${selectedPeriod.endTime} · 오른쪽 스와이프는 출석, 왼쪽 스와이프는 결석`
                  : "교시를 먼저 선택해 주세요."}
              </p>
            </div>

            <div className="shrink-0 rounded-[22px] bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">진행률</p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {summary.checkedCount}/{students.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">미처리</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{summary.uncheckedCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">출석</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{summary.presentCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">결석</p>
              <p className="mt-1 text-lg font-bold text-rose-600">{summary.absentCount}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">날짜</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">교시</span>
              <select
                value={selectedPeriodId}
                onChange={(event) => setSelectedPeriodId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.startTime}-{period.endTime})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={refreshCurrentPeriod}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              현재 교시 맞추기
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyUnchecked((current) => !current)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                showOnlyUnchecked
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              미처리만 보기
            </button>
            <button
              type="button"
              onClick={markAllPresent}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
            >
              전원 출석 처리
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--division-color)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              저장
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3 pb-24">
        {isLoading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            출결 정보를 불러오는 중입니다.
          </div>
        ) : null}

        {!isLoading && visibleStudents.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {showOnlyUnchecked ? "미처리 학생이 없습니다." : "출결 대상 학생이 없습니다."}
          </div>
        ) : null}

        {visibleStudents.map((student) => {
          const state = formState[student.id] ?? { status: "", reason: "" };
          const needsReason = state.status === "ABSENT" || state.status === "EXCUSED";
          const swipeOffset = swipeOffsets[student.id] ?? 0;

          return (
            <div
              key={student.id}
              className="relative overflow-hidden rounded-[26px] bg-slate-50"
              onTouchStart={(event) => handleSwipeStart(student.id, event)}
              onTouchMove={(event) => handleSwipeMove(student.id, event)}
              onTouchEnd={() => handleSwipeEnd(student.id)}
              onTouchCancel={() => handleSwipeEnd(student.id)}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-emerald-500">
                오른쪽 밀기 · 출석
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-rose-500">
                왼쪽 밀기 · 결석
              </div>

              <article
                className={`relative rounded-[26px] border p-4 transition-transform duration-150 ${getAttendanceStatusClasses(state.status)}`}
                style={{ transform: `translateX(${swipeOffset}px)` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                      {student.seatDisplay || "좌석 미배정"}
                    </p>
                    <h2 className="mt-2 text-lg font-bold">{student.name}</h2>
                    <p className="mt-1 text-sm opacity-75">{student.studentNumber}</p>
                    <p className="mt-1 text-xs opacity-75">{student.studyTrack || "직렬 미지정"}</p>
                  </div>

                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getAttendanceStatusLabel(state.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {QUICK_STATUS_BUTTONS.map((button) => {
                    const isActive = state.status === button.value;

                    return (
                      <button
                        key={button.value}
                        type="button"
                        onClick={() => applyStudentStatus(student.id, button.value)}
                        className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                          isActive
                            ? button.activeClassName
                            : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {button.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    기타 상태
                  </label>
                  <select
                    value={state.status}
                    onChange={(event) => applyStudentStatus(student.id, event.target.value as AttendanceOptionValue)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {needsReason ? (
                  <div className="mt-3">
                    <input
                      value={state.reason}
                      onChange={(event) => updateStudentState(student.id, { reason: event.target.value })}
                      placeholder="사유를 입력해 주세요"
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                  </div>
                ) : null}
              </article>
            </div>
          );
        })}
      </section>
    </div>
  );
}
