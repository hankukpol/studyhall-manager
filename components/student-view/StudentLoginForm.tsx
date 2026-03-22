"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

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
    <main className="flex min-h-[100dvh] items-center justify-center bg-gray-100 px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="overflow-hidden border border-slate-200-gray-300 bg-slate-950 px-6 py-8 text-white lg:px-8">
          <div className="relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <p className="relative text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              Student Portal
            </p>
            <h1 className="relative mt-4 text-3xl font-extrabold leading-tight lg:text-4xl">
              {divisionName}
              <br />
              학생 조회 로그인
            </h1>
            <p className="relative mt-4 max-w-xl text-sm leading-7 text-white/78">
              수험번호와 이름만으로 출석, 상벌점, 최근 시험 결과를 확인할 수 있습니다. 세션은
              7일 동안 유지됩니다.
            </p>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              <article className="border border-slate-200-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">조회 범위</p>
                <p className="mt-3 text-lg font-bold">출석, 상벌점, 최근 시험</p>
              </article>
              <article className="border border-slate-200-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">보안</p>
                <p className="mt-3 flex items-center gap-2 text-lg font-bold">
                  <ShieldCheck className="h-5 w-5" />
                  httpOnly 세션 쿠키
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border border-slate-200-gray-300 bg-white p-6 lg:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            로그인 정보
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">학생 본인 확인</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            관리자 화면에서 등록된 수험번호와 이름이 모두 일치해야 합니다.
          </p>

          {sampleLogin ? (
            <div className="mt-5 border border-slate-200-slate-200 bg-white px-4 py-4 text-sm text-sky-900">
              <p className="font-semibold">로컬 mock 테스트용 기본 계정</p>
              <p className="mt-2">
                수험번호 <span className="font-semibold">{sampleLogin.studentNumber}</span>
              </p>
              <p className="mt-1">
                이름 <span className="font-semibold">{sampleLogin.name}</span>
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">수험번호</span>
              <input
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
                className="w-full border border-slate-200-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500"
                placeholder="P-2026-001"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-slate-200-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500"
                placeholder="홍길동"
                autoComplete="name"
                required
              />
            </label>

            {error ? (
              <div className="border border-slate-200-slate-200 bg-white px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              학생 조회 시작
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
