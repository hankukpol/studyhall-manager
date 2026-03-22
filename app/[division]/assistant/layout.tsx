import type { ReactNode } from "react";

import { AssistantBottomNav } from "@/components/layout/AssistantBottomNav";
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#eef3f8] px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 rounded-[28px] border border-black/5 bg-white px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--division-color)]">
                Assistant Mode
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-950">{division?.name ?? params.division}</h1>
              <p className="text-sm text-slate-500">{session.name}</p>
            </div>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      <AssistantBottomNav divisionSlug={params.division} />
    </div>
  );
}
