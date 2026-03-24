"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpenCheck,
  CalendarClock,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquareWarning,
  Settings,
  ShieldAlert,
  Smartphone,
  Star,
  Users,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavSection = { label: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    label: "일상 업무",
    items: [
      { href: "", label: "대시보드", icon: LayoutDashboard },
      { href: "attendance", label: "출석 관리", icon: BookOpenCheck },
      { href: "phone-submissions", label: "휴대폰 관리", icon: Smartphone },
      { href: "students", label: "학생 명단", icon: Users },
      { href: "seats", label: "좌석 현황", icon: MapPin },
    ],
  },
  {
    label: "학사 관리",
    items: [
      { href: "points", label: "상벌점", icon: Star },
      { href: "leave", label: "외출/휴가", icon: CalendarClock },
      { href: "warnings", label: "경고 대상자", icon: ShieldAlert },
      { href: "interviews", label: "면담 기록", icon: MessageSquareWarning },
    ],
  },
  {
    label: "성적·수납",
    items: [
      { href: "exams", label: "시험 성적", icon: GraduationCap },
      { href: "payments", label: "수납 관리", icon: CreditCard },
    ],
  },
  {
    label: "기타",
    items: [
      { href: "announcements", label: "공지사항", icon: Megaphone },
      { href: "reports", label: "통계/보고서", icon: FileSpreadsheet },
      { href: "settings", label: "설정", icon: Settings },
    ],
  },
];

type AdminSidebarProps = {
  divisionSlug: string;
  divisionName: string;
  divisionColor: string;
  adminName: string;
  onNavigate?: () => void;
  onLogout?: () => void;
};

export function AdminSidebar({
  divisionSlug,
  divisionName,
  divisionColor,
  adminName,
  onNavigate,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div
        className="border-b border-white/10 px-5 py-6"
        style={{
          backgroundColor: `${divisionColor}`,
        }}
      >
        <p className="text-xs uppercase tracking-[0.24em] text-white/70">Admin Dashboard</p>
        <h1 className="mt-3 text-xl font-bold">{divisionName}</h1>
        <p className="mt-1 text-sm text-white/70">{adminName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={sectionIndex > 0 ? "mt-5" : ""}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const href = `/${divisionSlug}/admin${item.href ? `/${item.href}` : ""}`;
                const isActive =
                  item.href === ""
                    ? pathname === href
                    : pathname === href || pathname.startsWith(`${href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.16)]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="rounded-[10px] bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-white/55">현재 지점 권한으로 로그인되어 있습니다.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full rounded-[10px] border border-slate-200-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
