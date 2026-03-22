import { formatPointValue, getPointCategoryClasses, getPointCategoryLabel } from "@/lib/point-meta";

export function PointCategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPointCategoryClasses(category)}`}
    >
      {getPointCategoryLabel(category)}
    </span>
  );
}

export function PointValueBadge({ points }: { points: number }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        points > 0 ? "bg-white border border-slate-200-slate-200 text-emerald-700" : "bg-white border border-slate-200-slate-200 text-rose-700"
      }`}
    >
      {formatPointValue(points)}
    </span>
  );
}
