import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/services/admin-dashboard.service";

type AdminDashboardPageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);
  const dashboardData = await getAdminDashboardData(params.division);

  return <AdminDashboard divisionSlug={params.division} initialData={dashboardData} />;
}
