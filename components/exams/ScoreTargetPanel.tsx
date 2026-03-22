"use client";

import { LoaderCircle, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ExamTypeItem } from "@/lib/services/exam.service";
import type { ScoreTargetItem } from "@/lib/services/score-target.service";

type ScoreTargetPanelProps = {
  divisionSlug: string;
  studentId: string;
  initialTargets: ScoreTargetItem[];
  availableExamTypes?: Array<Pick<ExamTypeItem, "id" | "name" | "studyTrack">>;
  canEdit?: boolean;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("ko-KR");
}

function getStatusTone(target: ScoreTargetItem) {
  if (target.isAchieved) {
    return "border-slate-200 bg-white text-emerald-700";
  }

  if (target.latestScore === null) {
    return "border-slate-200 bg-white text-slate-600";
  }

  return "border-slate-200 bg-white text-amber-700";
}

export function ScoreTargetPanel({
  divisionSlug,
  studentId,
  initialTargets,
  availableExamTypes = [],
  canEdit = false,
}: ScoreTargetPanelProps) {
  const [targets, setTargets] = useState(initialTargets);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState(
    initialTargets[0]?.examTypeId ?? availableExamTypes[0]?.id ?? "",
  );
  const [targetScore, setTargetScore] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTargetId, setDeletingTargetId] = useState<string | null>(null);

  const selectedExistingTarget = useMemo(
    () => targets.find((target) => target.examTypeId === selectedExamTypeId) ?? null,
    [selectedExamTypeId, targets],
  );

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    if (!selectedExamTypeId && availableExamTypes[0]?.id) {
      setSelectedExamTypeId(availableExamTypes[0].id);
      return;
    }

    if (selectedExistingTarget) {
      setTargetScore(String(selectedExistingTarget.targetScore));
      setNote(selectedExistingTarget.note ?? "");
      return;
    }

    setTargetScore("");
    setNote("");
  }, [availableExamTypes, canEdit, selectedExamTypeId, selectedExistingTarget]);

  async function handleSave() {
    if (!selectedExamTypeId) {
      toast.error("시험 종류를 먼저 선택해 주세요.");
      return;
    }

    const parsedScore = Number(targetScore);
    if (!Number.isInteger(parsedScore) || parsedScore < 0) {
      toast.error("목표 점수는 0 이상의 정수로 입력해 주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/${divisionSlug}/students/${studentId}/score-targets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examTypeId: selectedExamTypeId,
          targetScore: parsedScore,
          note: note.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "성적 목표 저장에 실패했습니다.");
      }

      setTargets(data.targets ?? []);
      toast.success("성적 목표를 저장했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "성적 목표 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(targetId: string) {
    setDeletingTargetId(targetId);

    try {
      const response = await fetch(
        `/api/${divisionSlug}/students/${studentId}/score-targets/${targetId}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "성적 목표 삭제에 실패했습니다.");
      }

      setTargets(data.targets ?? []);
      toast.success("성적 목표를 삭제했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "성적 목표 삭제에 실패했습니다.");
    } finally {
      setDeletingTargetId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <Target className="h-4 w-4" />
        <h3 className="text-sm font-semibold">성적 목표</h3>
      </div>

      {canEdit ? (
        <div className="rounded-[22px] border border-slate-200-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.8fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">시험 종류</span>
              <select
                value={selectedExamTypeId}
                onChange={(event) => setSelectedExamTypeId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {availableExamTypes.length > 0 ? (
                  availableExamTypes.map((examType) => (
                    <option key={examType.id} value={examType.id}>
                      {examType.name}
                      {examType.studyTrack ? ` · ${examType.studyTrack}` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">설정 가능한 시험이 없습니다.</option>
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">목표 점수</span>
              <input
                type="number"
                min={0}
                step={1}
                value={targetScore}
                onChange={(event) => setTargetScore(event.target.value)}
                className="w-full rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="예: 420"
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">메모</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[96px] w-full rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="예: 4월 말까지 주간 모의고사 420점 이상"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              같은 시험 종류를 다시 저장하면 기존 목표가 최신 값으로 갱신됩니다.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || availableExamTypes.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--division-color)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              목표 저장
            </button>
          </div>
        </div>
      ) : null}

      {targets.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {targets.map((target) => (
            <article key={target.id} className="rounded-[22px] border border-slate-200-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {target.studyTrack || "공통"}
                  </p>
                  <h4 className="mt-2 text-xl font-bold text-slate-950">{target.examTypeName}</h4>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(target)}`}
                >
                  {target.isAchieved
                    ? "달성"
                    : target.latestScore === null
                      ? "미응시"
                      : `${target.gapToTarget ?? 0}점 남음`}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">목표 점수</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{target.targetScore}</p>
                </div>
                <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">최신 점수</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{target.latestScore ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200-slate-200 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">최신 회차</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {target.latestExamRound ? `${target.latestExamRound}회차` : "-"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                최근 시험일 {formatDate(target.latestExamDate)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {target.note || "등록된 목표 메모가 없습니다."}
              </p>

              {canEdit ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleDelete(target.id)}
                    disabled={deletingTargetId === target.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200-slate-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                  >
                    {deletingTargetId === target.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    목표 삭제
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
          등록된 성적 목표가 없습니다.
        </div>
      )}
    </div>
  );
}
