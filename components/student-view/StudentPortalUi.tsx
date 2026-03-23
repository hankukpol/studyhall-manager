import type { CSSProperties, ReactNode } from "react";

type PortalSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

type PortalMetricCardProps = {
  label: string;
  value: string | number;
  caption: string;
  valueToneClassName?: string;
};

type PortalEmptyStateProps = {
  title: string;
  description: string;
};

export const portalPageClass =
  "min-h-[100dvh] bg-[#f4f6fb] px-4 py-4 md:px-6 md:py-6";

export const portalContainerClass =
  "mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-5";

export const portalSectionClass =
  "rounded-[10px] border border-slate-200 bg-white p-4 md:p-5";

export const portalInsetClass =
  "rounded-[10px] border border-slate-200 bg-[#f8fafc] p-4";

export const portalCardClass = "rounded-[10px] border border-slate-200 bg-white";

export const portalChipClass =
  "inline-flex items-center rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700";

export function getBrandSurfaceStyle(alpha = 0.12): CSSProperties {
  return {
    backgroundColor: `rgb(var(--division-color-rgb) / ${alpha})`,
  };
}

export function getBrandBorderStyle(alpha = 0.2): CSSProperties {
  return {
    borderColor: `rgb(var(--division-color-rgb) / ${alpha})`,
  };
}

export function PortalSectionHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
}: PortalSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-700"
              style={getBrandSurfaceStyle(0.12)}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-slate-950 md:text-[30px]">
              {title}
            </h2>
          </div>
        </div>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PortalMetricCard({
  label,
  value,
  caption,
  valueToneClassName = "text-slate-950",
}: PortalMetricCardProps) {
  return (
    <article className={portalSectionClass}>
      <div
        className="h-1 w-10 rounded-full"
        style={{ backgroundColor: "var(--division-color)" }}
      />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${valueToneClassName}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </article>
  );
}

export function PortalEmptyState({
  title,
  description,
}: PortalEmptyStateProps) {
  return (
    <div className="rounded-[10px] border border-dashed border-slate-300 bg-[#f8fafc] px-4 py-6 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}
