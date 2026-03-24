import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CreditCard,
  GraduationCap,
  LayoutTemplate,
  MapPinned,
  Star,
  UserCog,
} from "lucide-react";

import { getDivisionBySlug } from "@/lib/services/division.service";
import { getDivisionGeneralSettings, getDivisionRuleSettings } from "@/lib/services/settings.service";

type SettingsHubPageProps = {
  params: {
    division: string;
  };
};


const sections = [
  {
    key: "general",
    href: "settings/general",
    label: "기본 정보",
    description: "지점 이름, 전체 명칭, 색상, 운영 요일, 직렬 목록을 관리합니다.",
    icon: LayoutTemplate,
  },
  {
    key: "periods",
    href: "settings/periods",
    label: "교시 설정",
    description: "교시 시간표와 필수 여부를 지점별로 설정합니다.",
    icon: CalendarRange,
  },
  {
    key: "rules",
    href: "settings/rules",
    label: "운영 규칙",
    description: "지각 기준, 경고 단계, 허가 한도, 조교 수정 범위를 관리합니다.",
    icon: AlarmClock,
  },
  {
    key: "tuition",
    href: "settings/tuition",
    label: "등록 기간 / 금액",
    description: "기간별 등록 플랜과 적용 금액을 지점별로 직접 설정합니다.",
    icon: CreditCard,
  },
  {
    key: "seats",
    href: "settings/seats",
    label: "자습실 / 좌석",
    description: "자습실 생성, 자습실별 좌석 배치도, 학생 좌석 이동을 관리합니다.",
    icon: MapPinned,
  },
  {
    key: "exams",
    href: "settings/exams",
    label: "시험 설정",
    description: "시험 종류와 직렬별 과목 구성을 지점별로 분리해 관리합니다.",
    icon: GraduationCap,
  },
  {
    key: "exam-schedules",
    href: "settings/exam-schedules",
    label: "시험 일정",
    description: "실제 시험 일정을 등록하고 학생 포털에 D-Day 카운트다운을 표시합니다.",
    icon: CalendarDays,
  },
  {
    key: "point-rules",
    href: "points/rules",
    label: "상벌점 규칙",
    description: "상점·벌점 규칙 목록을 지점별로 관리합니다. 출석·휴대폰 등 자동 벌점 규칙을 여기서 설정합니다.",
    icon: Star,
  },
  {
    key: "staff",
    href: "staff",
    label: "직원 관리",
    description: "본 지점의 관리자와 조교 계정을 추가·수정·비활성화하고 비밀번호를 재설정합니다.",
    icon: UserCog,
  },
] as const;

export default async function SettingsHubPage({ params }: SettingsHubPageProps) {

  const [division, generalSettings, ruleSettings] = await Promise.all([
    getDivisionBySlug(params.division),
    getDivisionGeneralSettings(params.division),
    getDivisionRuleSettings(params.division),
  ]);

  const activeOperatingDays = Object.values(generalSettings.operatingDays).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-slate-200-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(18,32,56,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Settings Hub
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-950">운영 설정</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          교시, 출결 규칙, 지점 기본 정보, 직렬 목록, 등록 플랜, 자습실과 좌석, 시험 구성을 이곳에서 관리합니다.
          모든 설정은 현재 지점에만 적용됩니다.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[10px] p-4 text-white" style={{ backgroundColor: "var(--division-color)" }}>
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Division</p>
            <p className="mt-3 text-2xl font-bold">{division?.name ?? generalSettings.name}</p>
            <p className="mt-2 text-sm text-white/70">{generalSettings.fullName}</p>
          </div>
          <div className="rounded-[10px] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Attendance Rule</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{ruleSettings.tardyMinutes}분</p>
            <p className="mt-2 text-sm text-slate-600">
              조교 수정 {ruleSettings.assistantPastEditAllowed ? `${ruleSettings.assistantPastEditDays}일 허용` : "당일만 허용"}
            </p>
          </div>
          <div className="rounded-[10px] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Track / Days</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">직렬 {generalSettings.studyTracks.length}개</p>
            <p className="mt-2 text-sm text-slate-600">
              주 {activeOperatingDays}일 운영 / 퇴실 기준 {ruleSettings.warnWithdraw}점
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.key}
              href={`/${params.division}/admin/${section.href}`}
              prefetch={false}
              className="group rounded-[10px] border border-slate-200-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(18,32,56,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(18,32,56,0.10)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">{section.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                바로 이동
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

    </div>
  );
}
