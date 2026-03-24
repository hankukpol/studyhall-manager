"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  MapPin,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Modal } from "@/components/ui/Modal";
import { StudentStatusBadge, WarningStageBadge } from "@/components/students/StudentBadges";
import {
  STUDENT_STATUS_OPTIONS,
  WARNING_STAGE_OPTIONS,
  getWarningStageLabel,
} from "@/lib/student-meta";
import type { SeatOptionItem } from "@/lib/services/seat.service";
import type { StudentListItem } from "@/lib/services/student.service";
import type { TuitionPlanItem } from "@/lib/services/tuition-plan.service";

type StudentListManagerProps = {
  divisionSlug: string;
  initialStudents: StudentListItem[];
  canManage: boolean;
  studyTrackOptions?: string[];
  seatOptions?: SeatOptionItem[];
  tuitionPlans?: TuitionPlanItem[];
  initialCreateOpen?: boolean;
};

const sortOptions = [
  { value: "studentNumber", label: "수험번호순" },
  { value: "name", label: "이름순" },
  { value: "netPoints", label: "벌점순" },
  { value: "createdAt", label: "최근 등록순" },
] as const;

type StatusFilterValue = "ALL" | (typeof STUDENT_STATUS_OPTIONS)[number]["value"];
type WarningFilterValue = "ALL" | (typeof WARNING_STAGE_OPTIONS)[number]["value"];

const statusFilterValues = new Set(["ALL", ...STUDENT_STATUS_OPTIONS.map((option) => option.value)]);
const warningFilterValues = new Set(["ALL", ...WARNING_STAGE_OPTIONS.map((option) => option.value)]);
const sortFilterValues = new Set(sortOptions.map((option) => option.value));

const LazyStudentForm = dynamic(
  () => import("@/components/students/StudentForm").then((mod) => mod.StudentForm),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
        학생 등록 폼을 불러오는 중입니다.
      </div>
    ),
  },
);

function getValidQueryValue<T extends string>(value: string | null, validValues: Set<string>, fallback: T): T {
  if (!value) {
    return fallback;
  }

  return (validValues.has(value) ? value : fallback) as T;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

function getTrackOptions(students: StudentListItem[], configuredTracks: string[]) {
  return Array.from(
    new Set([
      ...configuredTracks,
      ...students.map((student) => student.studyTrack).filter((track): track is string => Boolean(track)),
    ]),
  );
}

export function StudentListManager({
  divisionSlug,
  initialStudents,
  canManage,
  studyTrackOptions = [],
  seatOptions = [],
  tuitionPlans = [],
  initialCreateOpen = false,
}: StudentListManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(() =>
    getValidQueryValue(searchParams.get("status"), statusFilterValues, "ALL"),
  );
  const [warningFilter, setWarningFilter] = useState<WarningFilterValue>(() =>
    getValidQueryValue(searchParams.get("warning"), warningFilterValues, "ALL"),
  );
  const [trackFilter, setTrackFilter] = useState(() => searchParams.get("track") ?? "ALL");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>(() =>
    getValidQueryValue(searchParams.get("sort"), sortFilterValues, "studentNumber"),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const createFromQuery = searchParams.get("panel") === "create";

  const allTrackOptions = useMemo(
    () => getTrackOptions(initialStudents, studyTrackOptions),
    [initialStudents, studyTrackOptions],
  );

  const filteredStudents = useMemo(() => {
    const matched = initialStudents.filter((student) => {
      const trackValue = student.studyTrack?.toLowerCase() ?? "";
      const matchesSearch =
        !deferredSearch ||
        student.name.toLowerCase().includes(deferredSearch) ||
        student.studentNumber.toLowerCase().includes(deferredSearch) ||
        trackValue.includes(deferredSearch);
      const matchesStatus = statusFilter === "ALL" || student.status === statusFilter;
      const matchesWarning = warningFilter === "ALL" || student.warningStage === warningFilter;
      const matchesTrack = trackFilter === "ALL" || student.studyTrack === trackFilter;

      return matchesSearch && matchesStatus && matchesWarning && matchesTrack;
    });

    const sorted = [...matched];
    sorted.sort((left, right) => {
      switch (sortBy) {
        case "name":
          return left.name.localeCompare(right.name, "ko");
        case "netPoints":
          return right.netPoints - left.netPoints || left.name.localeCompare(right.name, "ko");
        case "createdAt":
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        default:
          return left.studentNumber.localeCompare(right.studentNumber, "ko");
      }
    });

    return sorted;
  }, [deferredSearch, initialStudents, sortBy, statusFilter, warningFilter, trackFilter]);

  const summary = useMemo(
    () =>
      initialStudents.reduce(
        (accumulator, student) => {
          accumulator.total += 1;

          if (student.status === "ACTIVE") {
            accumulator.active += 1;
          }

          if (student.warningStage !== "NORMAL") {
            accumulator.warning += 1;
          }

          if (student.status === "WITHDRAWN") {
            accumulator.withdrawn += 1;
          }

          return accumulator;
        },
        { total: 0, active: 0, warning: 0, withdrawn: 0 },
      ),
    [initialStudents],
  );

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "ALL",
    warningFilter !== "ALL",
    trackFilter !== "ALL",
  ].filter(Boolean).length;

  const updateListQuery = useCallback(
    (updates: {
      q?: string | null;
      status?: string | null;
      warning?: string | null;
      track?: string | null;
      sort?: string | null;
      panel?: string | null;
    }) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      const entries = Object.entries(updates) as Array<[string, string | null | undefined]>;

      entries.forEach(([key, value]) => {
        if (!value || value === "ALL" || (key === "sort" && value === "studentNumber")) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setIsCreateOpen(initialCreateOpen || createFromQuery);
  }, [createFromQuery, initialCreateOpen]);

  useEffect(() => {
    const nextSearch = searchParams.get("q") ?? "";
    const nextStatus = getValidQueryValue(searchParams.get("status"), statusFilterValues, "ALL");
    const nextWarning = getValidQueryValue(searchParams.get("warning"), warningFilterValues, "ALL");
    const nextTrack = searchParams.get("track") ?? "ALL";
    const nextSort = getValidQueryValue(searchParams.get("sort"), sortFilterValues, "studentNumber");

    if (search !== nextSearch) {
      setSearch(nextSearch);
    }
    if (statusFilter !== nextStatus) {
      setStatusFilter(nextStatus);
    }
    if (warningFilter !== nextWarning) {
      setWarningFilter(nextWarning);
    }
    if (trackFilter !== nextTrack) {
      setTrackFilter(nextTrack);
    }
    if (sortBy !== nextSort) {
      setSortBy(nextSort);
    }
  }, [searchParams, search, sortBy, statusFilter, trackFilter, warningFilter]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    const nextQuery = search.trim();

    if (currentQuery === nextQuery) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      updateListQuery({ q: nextQuery ? nextQuery : null });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search, searchParams, updateListQuery]);

  function updatePanelQuery(open: boolean) {
    updateListQuery({ panel: open ? "create" : null });
  }

  function openCreatePanel() {
    setIsCreateOpen(true);
    updatePanelQuery(true);
  }

  function closeCreatePanel() {
    setIsCreateOpen(false);
    updatePanelQuery(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setWarningFilter("ALL");
    setTrackFilter("ALL");
    setSortBy("studentNumber");
    updateListQuery({
      q: null,
      status: null,
      warning: null,
      track: null,
      sort: null,
    });
  }

  return (
    <>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[10px] border border-slate-200-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">전체 학생</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{summary.total}</p>
                <p className="mt-2 text-xs text-slate-500">현재 지점에 등록된 전체 학생 수</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-slate-50 text-slate-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[10px] border border-slate-200-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(16,185,129,0.10)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-700">재원</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-950">{summary.active}</p>
                <p className="mt-2 text-xs text-emerald-700/80">현재 출결 및 운영 관리 대상</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-emerald-700">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[10px] border border-slate-200-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(245,158,11,0.10)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-amber-700">경고 진입</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-amber-950">{summary.warning}</p>
                <p className="mt-2 text-xs text-amber-700/80">추가 관리가 필요한 학생 수</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[10px] border border-slate-200-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(244,63,94,0.10)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-rose-700">퇴실</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-rose-950">{summary.withdrawn}</p>
                <p className="mt-2 text-xs text-rose-700/80">현재 운영 대상에서 제외된 학생</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-rose-700">
                <UserMinus className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[10px] border border-slate-200-black/5 bg-white p-5 shadow-[0_18px_44px_rgba(18,32,56,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-slate-200-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-500">
                Student Directory
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">학생 명단</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                검색과 필터를 조합해 학생 상태를 빠르게 파악하고, 우측 패널에서 바로 신규 등록까지 이어서 처리합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${divisionSlug}/admin/seats`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4" />
                좌석 현황
              </Link>

              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                새로고침
              </button>

              {canManage ? (
                <button
                  type="button"
                  onClick={openCreatePanel}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--division-color)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  학생 등록
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 xl:grid-cols-[1.4fr_repeat(3,0.8fr)]">
            <label className="relative block xl:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                className="w-full rounded-[10px] border border-slate-200-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="이름, 수험번호, 직렬 검색"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    updateListQuery({ q: null });
                  }}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilterValue);
                updateListQuery({ status: event.target.value });
              }}
              className="rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">상태 전체</option>
              {STUDENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={warningFilter}
              onChange={(event) => {
                setWarningFilter(event.target.value as WarningFilterValue);
                updateListQuery({ warning: event.target.value });
              }}
              className="rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">경고 단계 전체</option>
              {WARNING_STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => {
                const nextValue = event.target.value as (typeof sortOptions)[number]["value"];
                setSortBy(nextValue);
                updateListQuery({ sort: nextValue });
              }}
              className="rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">직렬 빠른 필터</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setTrackFilter("ALL");
                  updateListQuery({ track: null });
                }}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                  trackFilter === "ALL"
                    ? "bg-[var(--division-color)] text-white"
                    : "border border-slate-200-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                전체 직렬
              </button>
              {allTrackOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setTrackFilter(option);
                    updateListQuery({ track: option });
                  }}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                    trackFilter === option
                      ? "bg-[var(--division-color)] text-white"
                      : "border border-slate-200-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span>{filteredStudents.length}명 표시 중</span>
              {search.trim() ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  검색어 {search.trim()}
                </span>
              ) : null}
              {warningFilter !== "ALL" ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  {getWarningStageLabel(warningFilter)}
                </span>
              ) : null}
              {trackFilter !== "ALL" ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  {trackFilter}
                </span>
              ) : null}
            </div>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                필터 초기화
              </button>
            ) : (
              <p className="text-xs text-slate-400">필터 없이 전체 학생을 보고 있습니다.</p>
            )}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-[10px] border border-slate-200-slate-200 lg:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-white text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">수험번호</th>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">직렬</th>
                  <th className="px-4 py-3 font-medium">좌석</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">벌점</th>
                  <th className="px-4 py-3 font-medium">경고 단계</th>
                  <th className="px-4 py-3 font-medium">등록일</th>
                  <th className="px-4 py-3 font-medium text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="group text-slate-700 transition hover:bg-white">
                    <td className="px-4 py-4 font-medium text-slate-950">{student.studentNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{student.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{student.phone || "연락처 미등록"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-slate-200-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                        {student.studyTrack || "미지정"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{student.seatDisplay || "미배정"}</td>
                    <td className="px-4 py-4">
                      <StudentStatusBadge status={student.status} />
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-950">{student.netPoints}점</td>
                    <td className="px-4 py-4">
                      <WarningStageBadge stage={student.warningStage} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(student.createdAt)}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/${divisionSlug}/admin/students/${student.id}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        상세 보기
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-3 lg:hidden">
            {filteredStudents.map((student) => (
              <article key={student.id} className="rounded-[10px] border border-slate-200-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{student.studentNumber}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{student.name}</h3>
                  </div>
                  <WarningStageBadge stage={student.warningStage} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StudentStatusBadge status={student.status} />
                  <span className="rounded-full border border-slate-200-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    직렬 {student.studyTrack || "미지정"}
                  </span>
                  <span className="rounded-full border border-slate-200-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    좌석 {student.seatDisplay || "미배정"}
                  </span>
                  <span className="rounded-full border border-slate-200-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    벌점 {student.netPoints}점
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500">{student.phone || "연락처 미등록"}</p>
                <p className="mt-1 text-xs text-slate-400">등록일 {formatDate(student.createdAt)}</p>

                <Link
                  href={`/${divisionSlug}/admin/students/${student.id}`}
                  prefetch={false}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--division-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  상세 보기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="mt-6 rounded-[10px] border border-slate-200-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <ShieldAlert className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">조건에 맞는 학생이 없습니다.</p>
              <p className="mt-2 text-sm text-slate-500">검색어나 필터를 조정해서 다시 확인해 주세요.</p>
            </div>
          ) : null}
        </section>
      </div>

      {canManage ? (
        <Modal
          open={isCreateOpen}
          onClose={closeCreatePanel}
          badge="학생 등록"
          title="학생 등록"
          description="학생 정보를 입력하고 저장하면 목록이 즉시 새로고침됩니다."
          widthClassName="max-w-4xl"
        >
          <LazyStudentForm
            divisionSlug={divisionSlug}
            mode="create"
            studyTrackOptions={studyTrackOptions}
            seatOptions={seatOptions}
            tuitionPlans={tuitionPlans}
            redirectOnCreate={false}
            onCancel={closeCreatePanel}
            onSuccess={() => {
              closeCreatePanel();
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
