import { redirect } from "next/navigation";

import { requireDivisionAdminAccess } from "@/lib/auth";

type NewStudentPageProps = {
  params: {
    division: string;
  };
};

export default async function NewStudentPage({ params }: NewStudentPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);
  redirect(`/${params.division}/admin/students?panel=create`);
}
