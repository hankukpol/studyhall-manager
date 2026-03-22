import Link from "next/link";

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
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = current === item.key;
        const href = `/${divisionSlug}/student${item.href ? `/${item.href}` : ""}`;

        return (
          <Link
            key={item.key}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                : "border border-slate-200-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
