"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StudentExamResultItem } from "@/lib/services/exam.service";

type ExamScoreChartProps = {
  results: StudentExamResultItem[];
};

const COLORS = ["#1d4ed8", "#0f766e", "#c2410c", "#7c3aed", "#be123c", "#0f172a"];

function buildChartLabel(result: StudentExamResultItem) {
  const dateLabel = result.examDate
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
      }).format(new Date(result.examDate))
    : "";

  return dateLabel ? `${result.examRound}회차 (${dateLabel})` : `${result.examRound}회차`;
}

export function ExamScoreChart({ results }: ExamScoreChartProps) {
  const examTypeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        examTypeId: string;
        examTypeName: string;
        results: StudentExamResultItem[];
      }
    >();

    for (const result of results) {
      const current = map.get(result.examTypeId);

      if (current) {
        current.results.push(result);
        continue;
      }

      map.set(result.examTypeId, {
        examTypeId: result.examTypeId,
        examTypeName: result.examTypeName,
        results: [result],
      });
    }

    return Array.from(map.values()).map((group) => ({
      ...group,
      results: [...group.results].sort((left, right) => {
        const leftKey = `${left.examDate ?? ""}-${String(left.examRound).padStart(3, "0")}`;
        const rightKey = `${right.examDate ?? ""}-${String(right.examRound).padStart(3, "0")}`;
        return leftKey.localeCompare(rightKey);
      }),
    }));
  }, [results]);

  const [selectedExamTypeId, setSelectedExamTypeId] = useState(
    examTypeGroups[0]?.examTypeId ?? "",
  );

  const selectedGroup =
    examTypeGroups.find((group) => group.examTypeId === selectedExamTypeId) ?? examTypeGroups[0] ?? null;

  const chartData = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    return selectedGroup.results.map((result) => {
      const subjectEntries = Object.fromEntries(
        result.subjects.map((subject) => [subject.name, subject.score]),
      );

      return {
        label: buildChartLabel(result),
        totalScore: result.totalScore,
        ...subjectEntries,
      };
    });
  }, [selectedGroup]);

  const subjects = selectedGroup?.results[0]?.subjects ?? [];

  if (results.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
        아직 성적이 없습니다.
      </div>
    );
  }

  return (
    <section className="rounded-[24px] border border-slate-200-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">성적 추이 차트</p>
          <p className="mt-1 text-sm text-slate-600">
            시험 종류별로 회차 추이를 비교합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {examTypeGroups.map((group) => (
            <button
              key={group.examTypeId}
              type="button"
              onClick={() => setSelectedExamTypeId(group.examTypeId)}
              className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                (selectedGroup?.examTypeId ?? "") === group.examTypeId
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {group.examTypeName}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[320px] rounded-[24px] border border-slate-200-slate-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              yAxisId="total"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            {subjects.map((subject, index) => (
              <Line
                key={subject.subjectId}
                type="monotone"
                dataKey={subject.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
            <Line
              type="monotone"
              dataKey="totalScore"
              yAxisId="total"
              stroke="#111827"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="총점"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
