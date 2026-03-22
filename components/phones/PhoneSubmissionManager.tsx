"use client";

import { AlertTriangle, Check, RefreshCcw, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { PhoneSubmissionItem } from "@/lib/services/phone-submission.service";
import type { PointRuleItem } from "@/lib/services/point.service";

type PhoneSubmissionManagerProps = {
  divisionSlug: string;
  initialSubmissions: PhoneSubmissionItem[];
  phonePointRule: PointRuleItem | null;
};

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthStart() {
  const today = getKstToday();
  return `${today.slice(0, 7)}-01`;
}

export function PhoneSubmissionManager({
  divisionSlug,
  initialSubmissions,
  phonePointRule,
}: PhoneSubmissionManagerProps) {
  const [submissions, setSubmissions] = useState<PhoneSubmissionItem[]>(initialSubmissions);
  const [dateFrom, setDateFrom] = useState(getMonthStart());
  const [dateTo, setDateTo] = useState(getKstToday());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isGranting, setIsGranting] = useState(false);

  const notSubmittedList = submissions.filter((s) => !s.submitted);

  async function handleSearch() {
    setIsLoading(true);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/${divisionSlug}/phone-submissions?${params}`);
      if (!res.ok) {
        toast.error("데이터를 불러오는 데 실패했습니다.");
        return;
      }
      const { submissions: data } = await res.json();
      setSubmissions(data);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllNotSubmitted() {
    setSelectedIds(new Set(notSubmittedList.map((s) => s.studentId)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleGrantPoints() {
    const studentIds = Array.from(selectedIds);
    if (studentIds.length === 0) {
      toast.error("벌점을 부여할 학생을 선택해주세요.");
      return;
    }

    const points = phonePointRule ? phonePointRule.points : -1;
    const confirmMsg = phonePointRule
      ? `선택한 ${studentIds.length}명에게 "${phonePointRule.name}" 규칙으로 ${points}점을 부여하시겠습니까?`
      : `선택한 ${studentIds.length}명에게 벌점 1점을 부여하시겠습니까?\n(휴대폰 미제출 규칙이 없어 직접 부여됩니다.)`;

    if (!confirm(confirmMsg)) return;

    setIsGranting(true);
    try {
      const today = getKstToday();
      const res = await fetch(`/api/${divisionSlug}/points/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds,
          ruleId: phonePointRule?.id ?? null,
          points: phonePointRule ? undefined : points,
          notes: "휴대폰 미제출",
          date: today,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "벌점 부여에 실패했습니다.");
        return;
      }

      toast.success(`${studentIds.length}명에게 벌점이 부여되었습니다.`);
      setSelectedIds(new Set());
    } finally {
      setIsGranting(false);
    }
  }

  const submittedCount = submissions.filter((s) => s.submitted).length;
  const notSubmittedCount = notSubmittedList.length;

  return (
    <div className="space-y-5">
      {/* 검색 필터 */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700">시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          조회
        </button>
      </div>

      {/* 요약 */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm">
          <span className="font-semibold text-green-700">제출 {submittedCount}건</span>
        </div>
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm">
          <span className="font-semibold text-red-600">미제출 {notSubmittedCount}건</span>
        </div>
      </div>

      {/* 미제출자 벌점 부여 */}
      {notSubmittedCount > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-red-700">미제출자 벌점 부여</p>
          </div>
          {phonePointRule ? (
            <p className="text-xs text-red-600">
              규칙: &ldquo;{phonePointRule.name}&rdquo; ({phonePointRule.points}점) · 선택 후 일괄 부여
            </p>
          ) : (
            <p className="text-xs text-red-600">
              휴대폰 미제출 벌점 규칙이 설정되지 않았습니다. 벌점 -1점이 직접 부여됩니다.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAllNotSubmitted}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition"
            >
              미제출자 전체 선택 ({notSubmittedCount}명)
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition"
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  onClick={handleGrantPoints}
                  disabled={isGranting}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
                >
                  {isGranting ? "처리 중..." : `선택 ${selectedIds.size}명 벌점 부여`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 목록 */}
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Smartphone className="h-10 w-10" />
          <p className="text-sm">해당 기간의 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 pr-4 font-semibold text-slate-600 w-10">선택</th>
                <th className="pb-3 pr-4 font-semibold text-slate-600">날짜</th>
                <th className="pb-3 pr-4 font-semibold text-slate-600">이름</th>
                <th className="pb-3 pr-4 font-semibold text-slate-600">수험번호</th>
                <th className="pb-3 font-semibold text-slate-600">제출 여부</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((item) => (
                <tr
                  key={item.id}
                  className={`transition ${!item.submitted && selectedIds.has(item.studentId) ? "bg-red-50" : ""}`}
                >
                  <td className="py-3 pr-4">
                    {!item.submitted && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.studentId)}
                        onChange={() => toggleSelect(item.studentId)}
                        className="h-4 w-4 rounded"
                      />
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{item.date}</td>
                  <td className="py-3 pr-4 font-medium text-slate-900">{item.studentName}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.studentNumber}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.submitted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.submitted ? (
                        <><Check className="h-3 w-3" />제출</>
                      ) : (
                        <><X className="h-3 w-3" />미제출</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
