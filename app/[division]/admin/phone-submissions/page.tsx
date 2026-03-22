import { PhoneSubmissionManager } from "@/components/phones/PhoneSubmissionManager";
import { requireDivisionAdminAccess } from "@/lib/auth";
import { listPhoneSubmissions } from "@/lib/services/phone-submission.service";
import { listPointRules } from "@/lib/services/point.service";

function getKstToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthStart() {
  const today = getKstToday();
  return `${today.slice(0, 7)}-01`;
}

type PhoneSubmissionsPageProps = {
  params: {
    division: string;
  };
};

export const dynamic = "force-dynamic";

export default async function PhoneSubmissionsPage({ params }: PhoneSubmissionsPageProps) {
  await requireDivisionAdminAccess(params.division, ["ADMIN", "SUPER_ADMIN"]);

  const [submissions, pointRules] = await Promise.all([
    listPhoneSubmissions(params.division, {
      dateFrom: getMonthStart(),
      dateTo: getKstToday(),
    }),
    listPointRules(params.division),
  ]);

  // 휴대폰 관련 벌점 규칙 자동 탐지 (이름에 "휴대폰" 포함, 벌점)
  const phonePointRule =
    pointRules.find(
      (r) =>
        r.isActive &&
        r.points < 0 &&
        (r.name.includes("휴대폰") || r.name.includes("핸드폰") || r.name.includes("phone")),
    ) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Phone Submissions
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-950">휴대폰 제출 관리</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          조교가 기록한 휴대폰 제출 현황을 조회합니다. 미제출자를 선택해 벌점을 일괄 부여할 수 있습니다.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <PhoneSubmissionManager
          divisionSlug={params.division}
          initialSubmissions={submissions}
          phonePointRule={phonePointRule}
        />
      </section>
    </div>
  );
}
