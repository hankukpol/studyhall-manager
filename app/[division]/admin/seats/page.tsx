import { SeatStatusBoard } from "@/components/seats/SeatStatusBoard";
import { getAttendanceSnapshot } from "@/lib/services/attendance.service";
import { listPaymentCategories } from "@/lib/services/payment.service";
import { listPointRules } from "@/lib/services/point.service";
import { getSeatLayout, listStudyRooms } from "@/lib/services/seat.service";
import { listTuitionPlans } from "@/lib/services/tuition-plan.service";


type Props = {
  params: { division: string };
};

export default async function SeatStatusPage({ params }: Props) {

  const today = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
    .slice(0, 10);

  const [rooms, todaySnapshot, paymentCategories, allPointRules, tuitionPlans] = await Promise.all([
    listStudyRooms(params.division),
    getAttendanceSnapshot(params.division, today),
    listPaymentCategories(params.division, { activeOnly: true }),
    listPointRules(params.division),
    listTuitionPlans(params.division, { activeOnly: true }),
  ]);

  const layout = await getSeatLayout(params.division, rooms[0]?.id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-[28px] border border-slate-200-black/5 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(18,32,56,0.06)]">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">좌석 현황</h1>
        <p className="mt-2 text-sm text-slate-500">
          오늘({today}) 기준 좌석 배치와 출석 상태를 한눈에 확인합니다.
          좌석을 클릭하면 학생 상세 정보를 확인할 수 있습니다.
        </p>
      </section>

      {rooms.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200-dashed border-slate-200 bg-white px-8 py-16 text-center">
          <p className="text-sm font-medium text-slate-500">자습실이 없습니다.</p>
          <p className="mt-1 text-xs text-slate-400">
            설정 &gt; 자습실/좌석에서 자습실을 먼저 추가해주세요.
          </p>
        </div>
      ) : (
        <SeatStatusBoard
          divisionSlug={params.division}
          initialRooms={rooms}
          initialLayout={layout}
          todaySnapshot={todaySnapshot}
          paymentCategories={paymentCategories}
          pointRules={allPointRules.filter((r) => r.isActive)}
          tuitionPlans={tuitionPlans}
        />
      )}
    </div>
  );
}
