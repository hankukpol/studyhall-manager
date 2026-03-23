import { SuperAdminOverview } from "@/components/super-admin/SuperAdminOverview";
import { requireSuperAdminAccess } from "@/lib/auth";
import { getSuperAdminOverview } from "@/lib/services/super-admin-overview.service";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requireSuperAdminAccess();

  const divisions = await getSuperAdminOverview();

  return <SuperAdminOverview initialDivisions={divisions} />;
}
