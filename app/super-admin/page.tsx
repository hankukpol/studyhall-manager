import { SuperAdminManager } from "@/components/super-admin/SuperAdminManager";
import { requireSuperAdminAccess } from "@/lib/auth";
import {
  listManagedAdminAccounts,
  listManagedDivisions,
} from "@/lib/services/super-admin.service";

export default async function SuperAdminPage() {
  await requireSuperAdminAccess();

  const [divisions, admins] = await Promise.all([
    listManagedDivisions(),
    listManagedAdminAccounts(),
  ]);

  return (
    <main className="min-h-screen bg-white px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <SuperAdminManager initialDivisions={divisions} initialAdmins={admins} />
      </div>
    </main>
  );
}
