"use client";

import dynamic from "next/dynamic";
import { ChartNoAxesColumn } from "lucide-react";
import { useState } from "react";

import {
  PortalSectionHeader,
  portalSectionClass,
} from "@/components/student-view/StudentPortalUi";
import type { StudentExamResultItem } from "@/lib/services/exam.service";

type ExamScoreChartLoaderProps = {
  results: StudentExamResultItem[];
};

const ExamScoreChart = dynamic(
  () => import("@/components/exams/ExamScoreChart").then((mod) => mod.ExamScoreChart),
  {
    ssr: false,
    loading: () => (
      <div className="mt-5 rounded-[10px] border border-slate-200 bg-white p-5">
        <div className="h-48 animate-pulse rounded-[10px] bg-slate-50" />
      </div>
    ),
  },
);

export function ExamScoreChartLoader({ results }: ExamScoreChartLoaderProps) {
  const [isChartVisible, setIsChartVisible] = useState(false);

  return (
    <section className={portalSectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PortalSectionHeader
          eyebrow="Exam Trend"
          title="성적 추이 차트"
          description="직접 열 때만 차트를 로드해서 첫 화면 진입 속도를 우선 확보합니다."
          icon={<ChartNoAxesColumn className="h-4 w-4" />}
        />
        <button
          type="button"
          onClick={() => setIsChartVisible((current) => !current)}
          className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {isChartVisible ? "차트 숨기기" : "차트 보기"}
        </button>
      </div>

      {isChartVisible ? (
        <div className="mt-5">
          <ExamScoreChart results={results} />
        </div>
      ) : (
        <div className="mt-5 rounded-[10px] border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">
          차트는 필요할 때만 로드됩니다.
        </div>
      )}
    </section>
  );
}
