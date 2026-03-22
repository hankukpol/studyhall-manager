import { PhoneCheckForm } from "@/components/phones/PhoneCheckForm";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { getPhoneSubmissionSnapshot } from "@/lib/services/phone-submission.service";

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type AssistantPhonesPageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AssistantPhonesPage({ params }: AssistantPhonesPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN", "ASSISTANT"]);

  const today = getKstToday();
  const snapshot = await getPhoneSubmissionSnapshot(params.division, today);

  return (
    <PhoneCheckForm
      divisionSlug={params.division}
      initialDate={today}
      initialSnapshot={snapshot}
    />
  );
}
