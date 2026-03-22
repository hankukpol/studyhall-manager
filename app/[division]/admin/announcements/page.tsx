import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { listAnnouncements } from "@/lib/services/announcement.service";

type AdminAnnouncementsPageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({ params }: AdminAnnouncementsPageProps) {
  const session = await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);
  const announcements = await listAnnouncements(params.division, { includeScheduled: true });

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200-black/5 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Phase 5-C
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">공지사항</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          직렬 공지와 전체 공지를 함께 관리합니다. 핀 고정된 공지는 학생 포털 상단에 우선 노출됩니다.
        </p>
      </section>

      <AnnouncementManager
        divisionSlug={params.division}
        initialAnnouncements={announcements}
        canManageGlobal={session.role === "SUPER_ADMIN"}
      />
    </div>
  );
}
