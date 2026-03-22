import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { getDivisionBySlug } from "@/lib/services/division.service";

type AdminLayoutProps = {
  children: ReactNode;
  params: {
    division: string;
  };
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const [session, division] = await Promise.all([
    requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]),
    getDivisionBySlug(params.division),
  ]);

  if (!division) {
    return children;
  }

  return (
    <AdminShell
      divisionSlug={division.slug}
      divisionName={division.name}
      divisionColor={division.color}
      adminName={session.name}
    >
      {children}
    </AdminShell>
  );
}
