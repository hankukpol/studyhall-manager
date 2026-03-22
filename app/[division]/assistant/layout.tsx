import Link from "next/link";
import type { ReactNode } from "react";

import { requireDivisionAssistantAccess } from "@/lib/auth";
import { getDivisionBySlug } from "@/lib/services/division.service";

type AssistantLayoutProps = {
  children: ReactNode;
  params: {
    division: string;
  };
};

export default async function AssistantLayout({ children, params }: AssistantLayoutProps) {
  const [session, division] = await Promise.all([
    requireDivisionAssistantAccess(params.division),
    getDivisionBySlug(params.division),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Assistant Mode</p>
            <h1 className="mt-1 text-lg font-bold">{division?.name ?? params.division}</h1>
            <p className="text-sm text-white/60">{session.name}</p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-slate-200-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <nav className="sticky bottom-0 border-t border-white/10 bg-slate-950 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around text-sm">
          <Link href={`/${params.division}/assistant`} className="text-white/80">
            홈
          </Link>
          <Link href={`/${params.division}/assistant/check`} className="text-white/80">
            출석체크
          </Link>
        </div>
      </nav>
    </div>
  );
}
