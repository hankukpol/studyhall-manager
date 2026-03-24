import Link from "next/link";

import { portalCardClass } from "@/components/student-view/StudentPortalUi";

type StudentPortalTabsProps = {
  divisionSlug: string;
  current: "dashboard" | "attendance" | "points" | "exams" | "announcements";
};

const items = [
  { key: "dashboard", label: "대시보드", href: "" },
  { key: "announcements", label: "공지사항", href: "announcements" },
  { key: "attendance", label: "출석 상세", href: "attendance" },
  { key: "points", label: "상벌점 상세", href: "points" },
  { key: "exams", label: "성적 상세", href: "exams" },
] as const;

export function StudentPortalTabs({
  divisionSlug,
  current,
}: StudentPortalTabsProps) {
  return (
    <nav className={`${portalCardClass} p-1`}>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-5">
        {items.map((item) => {
          const isActive = current === item.key;
          const href = `/${divisionSlug}/student${item.href ? `/${item.href}` : ""}`;

          return (
            <Link
              key={item.key}
              href={href}
              prefetch={false}
              className={`flex min-h-[40px] items-center justify-center rounded-[12px] px-2 py-2 text-center text-[12px] font-medium leading-4 transition md:min-h-[44px] md:px-3 md:py-2.5 md:text-[13px] ${
                isActive
                  ? "font-semibold"
                  : "text-[var(--muted)] hover:bg-[#F4F4F2] hover:text-[var(--foreground)]"
              }`}
              style={
                isActive
                  ? {
                      color: "var(--division-color)",
                      backgroundColor: "rgb(var(--division-color-rgb) / 0.12)",
                    }
                  : undefined
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
