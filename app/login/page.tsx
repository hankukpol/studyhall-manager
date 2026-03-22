"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";

const LOCAL_TEST_PASSWORD = "test1234";

const LOCAL_TEST_ACCOUNTS = [
  {
    label: "최고관리자",
    role: "SUPER_ADMIN",
    email: "super@mock.local",
    destination: "/super-admin",
  },
  {
    label: "경찰 지점 관리자",
    role: "ADMIN",
    email: "admin-police@mock.local",
    destination: "/police/admin",
  },
  {
    label: "소방 지점 관리자",
    role: "ADMIN",
    email: "admin-fire@mock.local",
    destination: "/fire/admin",
  },
  {
    label: "올패스독학원 관리자",
    role: "ADMIN",
    email: "admin-allpass@mock.local",
    destination: "/allpass/admin",
  },
  {
    label: "한경스파르타 관리자",
    role: "ADMIN",
    email: "admin-hankyung-sparta@mock.local",
    destination: "/hankyung-sparta/admin",
  },
  {
    label: "경찰 지점 조교",
    role: "ASSISTANT",
    email: "assistant-police@mock.local",
    destination: "/police/assistant",
  },
  {
    label: "소방 지점 조교",
    role: "ASSISTANT",
    email: "assistant-fire@mock.local",
    destination: "/fire/assistant",
  },
  {
    label: "올패스독학원 조교",
    role: "ASSISTANT",
    email: "assistant-allpass@mock.local",
    destination: "/allpass/assistant",
  },
  {
    label: "한경스파르타 조교",
    role: "ASSISTANT",
    email: "assistant-hankyung-sparta@mock.local",
    destination: "/hankyung-sparta/assistant",
  },
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testDestination, setTestDestination] = useState<string | null>(null);

  function fillLocalTestAccount(nextEmail: string, destination: string) {
    setEmail(nextEmail);
    setPassword(LOCAL_TEST_PASSWORD);
    setTestDestination(destination);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      if (testDestination) {
        window.location.href = testDestination;
        return;
      }

      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;

      if (nextPath) {
        window.location.href = nextPath;
        return;
      }

      if (data.session?.role === "SUPER_ADMIN") {
        window.location.href = "/super-admin";
      } else if (data.session?.role === "ASSISTANT") {
        window.location.href = `/${data.session.divisionSlug}/assistant`;
      } else if (data.session?.divisionSlug) {
        window.location.href = `/${data.session.divisionSlug}/admin`;
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("로그인 요청 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gray-100 px-4 py-12">
      <div className="grid w-full max-w-6xl overflow-hidden border border-slate-200-gray-300 bg-white md:grid-cols-[0.86fr_1.14fr]">
        <section className="hidden bg-slate-950 p-10 text-white md:block">
          <p className="text-sm uppercase tracking-[0.28em] text-white/60">Admin Access</p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">
            관리자와 조교
            <br />
            운영 계정 로그인
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
            로컬 테스트에서는 mock mode 운영 계정으로 바로 로그인할 수 있습니다. 실제 운영 모드에서는
            Supabase Auth에 등록된 활성 계정만 접근할 수 있습니다.
          </p>

          <div className="mt-10 border border-slate-200-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Local Test</p>
            <p className="mt-4 text-2xl font-bold">공통 비밀번호</p>
            <p className="mt-2 text-3xl font-extrabold tracking-[0.08em] text-amber-300">
              {LOCAL_TEST_PASSWORD}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/65">
              오른쪽 계정 목록을 누르면 이메일과 비밀번호가 자동으로 채워집니다.
            </p>
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="mx-auto max-w-xl">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Sign In
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
                운영 계정으로 로그인
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                로그인하면 권한과 소속 지점에 맞는 화면으로 자동 이동합니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border border-slate-200-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full border border-slate-200-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500"
                  required
                />
              </label>

              {error ? (
                <div className="border border-slate-200-slate-200 bg-white border border-slate-200-slate-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                로그인
              </button>
            </form>

            <section className="mt-8 border border-slate-200-gray-300 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-950">로컬 테스트용 계정</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    현재 mock mode 기준입니다. 아무 계정이나 누르면 이메일과 비밀번호가 자동 입력됩니다.
                  </p>
                </div>
                <div className="bg-white border border-slate-200-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                  MOCK
                </div>
              </div>

              <div className="mt-4 border border-slate-200-slate-200 bg-white px-4 py-3 text-sm text-amber-900">
                공통 비밀번호: <span className="font-semibold">{LOCAL_TEST_PASSWORD}</span>
              </div>

              <div className="mt-4 space-y-3">
                {LOCAL_TEST_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillLocalTestAccount(account.email, account.destination)}
                    className="flex w-full items-start justify-between gap-4 border border-slate-200-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-xl font-bold text-slate-950">{account.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{account.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {account.role}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{account.destination}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
