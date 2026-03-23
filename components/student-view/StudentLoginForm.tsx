"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

import {
  portalCardClass,
  portalContainerClass,
  portalInsetClass,
  portalPageClass,
} from "@/components/student-view/StudentPortalUi";

type StudentLoginFormProps = {
  divisionSlug: string;
  divisionName: string;
  sampleLogin: {
    studentNumber: string;
    name: string;
  } | null;
};

export function StudentLoginForm({
  divisionSlug,
  divisionName,
  sampleLogin,
}: StudentLoginFormProps) {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState(sampleLogin?.studentNumber ?? "");
  const [name, setName] = useState(sampleLogin?.name ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accentMutedTextStyle = { color: "var(--division-on-accent-muted)" };
  const accentSurfaceStyle = {
    borderColor: "var(--division-accent-border)",
    backgroundColor: "var(--division-accent-surface)",
  };
  const accentSurfaceSoftStyle = {
    borderColor: "var(--division-accent-border)",
    backgroundColor: "var(--division-accent-surface-soft)",
  };
  const accentOutlineStyle = { borderColor: "var(--division-accent-outline)" };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          division: divisionSlug,
          studentNumber,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "학생 로그인에 실패했습니다.");
        return;
      }

      router.push(`/${divisionSlug}/student`);
      router.refresh();
    } catch {
      setError("로그인 요청 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={portalPageClass}>
      <div className={portalContainerClass}>
        <div className="grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
          <section
            className="order-2 relative overflow-hidden rounded-[10px] border border-slate-200 px-5 py-5 md:px-6 md:py-6 lg:order-1"
            style={{
              background:
                "linear-gradient(145deg, var(--division-color-strong) 0%, var(--division-hero-end) 100%)",
              color: "var(--division-on-accent)",
            }}
          >
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={accentMutedTextStyle}>
                Student Portal
              </p>
              <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] md:text-[38px]">
                모바일 학생 포털
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6" style={accentMutedTextStyle}>
                {divisionName} 학생은 학번과 이름으로 로그인해 출석, 상벌점, 성적 정보를
                한 화면에서 빠르게 확인할 수 있습니다.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <article className="rounded-[10px] border p-4" style={accentSurfaceStyle}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={accentMutedTextStyle}>
                    모바일 기준
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                    1단 중심 구성
                  </p>
                  <p className="mt-2 text-sm" style={accentMutedTextStyle}>
                    핵심 정보만 먼저 보여주고, 넓은 화면에서는 2단으로 확장됩니다.
                  </p>
                </article>
                <article className="rounded-[10px] border p-4" style={accentSurfaceStyle}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={accentMutedTextStyle}>
                    보안 방식
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-[-0.03em]">
                    <ShieldCheck className="h-5 w-5" />
                    세션 기반 인증
                  </p>
                  <p className="mt-2 text-sm" style={accentMutedTextStyle}>
                    로그인 이후에는 브라우저 세션으로 학생 화면을 안전하게 유지합니다.
                  </p>
                </article>
              </div>

              <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-3">
                <div className="rounded-[10px] border px-4 py-3" style={accentSurfaceSoftStyle}>
                  <p className="text-xs" style={accentMutedTextStyle}>출석</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">주간 현황</p>
                </div>
                <div className="rounded-[10px] border px-4 py-3" style={accentSurfaceSoftStyle}>
                  <p className="text-xs" style={accentMutedTextStyle}>상벌점</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">실시간 확인</p>
                </div>
                <div className="rounded-[10px] border px-4 py-3" style={accentSurfaceSoftStyle}>
                  <p className="text-xs" style={accentMutedTextStyle}>성적</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">추이 확인</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-10 top-10 h-32 w-32 rounded-full border" style={accentOutlineStyle} />
            <div className="absolute bottom-6 right-6 h-24 w-24 rounded-full border" style={accentOutlineStyle} />
          </section>

          <section className={`order-1 ${portalCardClass} p-5 md:p-6 lg:order-2`}>
            <div className="border-b border-slate-200 pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                로그인
              </p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.05em] text-slate-950">
                학생 본인 확인
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                관리자 화면에 등록된 학번과 이름이 모두 일치해야 합니다.
              </p>
            </div>

            {sampleLogin ? (
              <div
                className="mt-5 rounded-[10px] border px-4 py-4 text-sm"
                style={{
                  borderColor: "rgb(var(--division-color-rgb) / 0.2)",
                  backgroundColor: "var(--division-color-muted)",
                }}
              >
                <p className="font-semibold text-slate-900">로컬 테스트용 기본 계정</p>
                <p className="mt-2 text-slate-700">
                  학번 <span className="font-semibold">{sampleLogin.studentNumber}</span>
                </p>
                <p className="mt-1 text-slate-700">
                  이름 <span className="font-semibold">{sampleLogin.name}</span>
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">학번</span>
                <input
                  value={studentNumber}
                  onChange={(event) => setStudentNumber(event.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[var(--division-color)] focus:bg-white"
                  placeholder="P-2026-001"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">이름</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[var(--division-color)] focus:bg-white"
                  placeholder="홍길동"
                  autoComplete="name"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  backgroundColor: "var(--division-color)",
                  color: "var(--division-on-accent)",
                }}
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                학생 포털 시작하기
              </button>
            </form>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={portalInsetClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  로그인 안내
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  동일한 학생 정보가 있어야만 로그인할 수 있으며, 휴원 및 퇴원 상태 학생은
                  접근할 수 없습니다.
                </p>
              </div>
              <div className={portalInsetClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  세션 유지
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  로그인 세션은 일정 시간 유지되며, 로그아웃 시 즉시 학생 화면 접근이
                  종료됩니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
