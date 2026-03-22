"use client";

import { Check, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { PhoneSubmissionSnapshot } from "@/lib/services/phone-submission.service";

type PhoneCheckFormProps = {
  divisionSlug: string;
  initialDate: string;
  initialSnapshot: PhoneSubmissionSnapshot;
};

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function PhoneCheckForm({ divisionSlug, initialDate, initialSnapshot }: PhoneCheckFormProps) {
  const [date, setDate] = useState(initialDate);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [submissions, setSubmissions] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const student of initialSnapshot.students) {
      const record = initialSnapshot.records.find((r) => r.studentId === student.id);
      map[student.id] = record ? record.submitted : true; // 기본: 제출로 설정
    }
    return map;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadSnapshot(newDate: string) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${divisionSlug}/phone-submissions?mode=snapshot&date=${newDate}`,
      );
      if (!res.ok) {
        toast.error("데이터를 불러오는 데 실패했습니다.");
        return;
      }
      const { snapshot: newSnapshot } = await res.json();
      setSnapshot(newSnapshot);
      // reset submissions from loaded records
      const map: Record<string, boolean> = {};
      for (const student of newSnapshot.students) {
        const record = (newSnapshot.records as Array<{ studentId: string; submitted: boolean }>).find(
          (r) => r.studentId === student.id,
        );
        map[student.id] = record ? record.submitted : true;
      }
      setSubmissions(map);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    loadSnapshot(newDate);
  }

  function setAllSubmitted() {
    setSubmissions((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, true])));
  }

  function setAllNotSubmitted() {
    setSubmissions((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, false])));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const records = snapshot.students.map((s) => ({
        studentId: s.id,
        submitted: submissions[s.id] ?? true,
      }));

      const res = await fetch(`/api/${divisionSlug}/phone-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "저장에 실패했습니다.");
        return;
      }

      const { snapshot: newSnapshot } = await res.json();
      setSnapshot(newSnapshot);
      toast.success("저장되었습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  const notSubmittedCount = Object.values(submissions).filter((v) => !v).length;
  const submittedCount = Object.values(submissions).filter((v) => v).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-slate-700" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Phone Check
            </p>
            <h1 className="text-lg font-bold text-slate-950">휴대폰 제출 체크</h1>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            max={getKstToday()}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700">
              제출 {submittedCount}명
            </span>
            <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-600">
              미제출 {notSubmittedCount}명
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={setAllSubmitted}
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
          >
            전원 제출
          </button>
          <button
            type="button"
            onClick={setAllNotSubmitted}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
          >
            전원 미제출
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="ml-auto rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
        ) : snapshot.students.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">재원 학생이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {snapshot.students.map((student) => {
              const isSubmitted = submissions[student.id] ?? true;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() =>
                    setSubmissions((prev) => ({ ...prev, [student.id]: !prev[student.id] }))
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    isSubmitted
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isSubmitted ? "bg-green-200 text-green-700" : "bg-red-200 text-red-600"
                    }`}
                  >
                    {isSubmitted ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.studentNumber}
                      {student.studyTrack && ` · ${student.studyTrack}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isSubmitted ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {isSubmitted ? "제출" : "미제출"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
