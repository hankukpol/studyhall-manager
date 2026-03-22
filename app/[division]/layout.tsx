import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { getDivisionBySlug } from "@/lib/services/division.service";

export const dynamic = "force-dynamic";

type DivisionLayoutProps = {
  children: ReactNode;
  params: {
    division: string;
  };
};

export default async function DivisionLayout({ children, params }: DivisionLayoutProps) {
  const division = await getDivisionBySlug(params.division);

  if (!division) {
    notFound();
  }

  const style = {
    "--division-color": division.color,
  } as CSSProperties;

  return <div style={style}>{children}</div>;
}
