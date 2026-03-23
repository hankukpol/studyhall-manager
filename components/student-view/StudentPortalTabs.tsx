import Link from "next/link";

import { portalCardClass } from "@/components/student-view/StudentPortalUi";

type StudentPortalTabsProps = {
  divisionSlug: string;
  current: "dashboard" | "attendance" | "points" | "exams";
};

const items = [
  { key: "dashboard", label: "대시보드", href: "" },
  { key: "attendance", label: "출석 상세", href: "attendance" },
  { key: "points", label: "상벌점 상세", href: "points" },
  { key: "exams", label: "성적 상세", href: "exams" },
] as const;

export function StudentPortalTabs({
  divisionSlug,
  current,
}: StudentPortalTabsProps) {
  return (
    <nav className={`${portalCardClass} overflow-hidden px-4`}>
      <div className="flex gap-5 overflow-x-auto">
        {items.map((item) => {
          const isActive = current === item.key;
          const href = `/${divisionSlug}/student${item.href ? `/${item.href}` : ""}`;

          return (
            <Link
              key={item.key}
              href={href}
              prefetch={false}
              className={`relative shrink-0 whitespace-nowrap py-4 text-sm font-semibold transition ${
                isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
              <span
                className={`absolute inset-x-0 bottom-0 h-[3px] rounded-full transition ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundColor: "var(--division-color)" }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
