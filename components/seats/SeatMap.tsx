"use client";

import { memo, useMemo } from "react";
import { getSeatPositionKey } from "@/lib/seat-layout";
import type { SeatMapSeat } from "@/lib/services/seat.service";
import {
  formatStudyTrackLabel,
  getStudyTrackBadgeClasses,
  getStudyTrackShortLabel,
} from "@/lib/study-track-meta";

type SeatMapProps = {
  seats: SeatMapSeat[];
  columns: number;
  rows: number;
  aisleColumns: number[];
  selectedSeatId?: string | null;
  highlightStudentId?: string | null;
  onCellClick?: (positionX: number, positionY: number, seatId: string | null) => void;
  onSeatDrop?: (fromSeatId: string, toSeatId: string) => void;
};

function getSeatTone(seat: SeatMapSeat | null) {
  if (!seat) {
    return "border-dashed border-slate-200 bg-white text-slate-400";
  }

  if (!seat.isActive) {
    return "border-dashed border-slate-300 bg-slate-100 text-slate-500";
  }

  if (!seat.assignedStudent) {
    return "border-slate-200 bg-white text-slate-600";
  }

  switch (seat.assignedStudent.status) {
    case "WITHDRAWN":
      return "border-slate-200 bg-white text-rose-800";
    case "GRADUATED":
      return "border-slate-200 bg-white text-sky-700";
    case "ON_LEAVE":
      return "border-slate-200 bg-white text-amber-700";
    default:
      return "border-slate-200 bg-white text-emerald-700";
  }
}

export const SeatMap = memo(function SeatMap({
  seats,
  columns,
  rows,
  aisleColumns,
  selectedSeatId,
  highlightStudentId,
  onCellClick,
  onSeatDrop,
}: SeatMapProps) {
  const seatMap = useMemo(() => new Map(seats.map((seat) => [getSeatPositionKey(seat.positionX, seat.positionY), seat])), [seats]);

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600">
        출입구 방향
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-[10px] border border-slate-200-black/5 bg-white p-4 shadow-[0_12px_30px_rgba(18,32,56,0.05)]">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(92px, 1fr))`,
              gridAutoRows: "minmax(120px, auto)",
            }}
          >
            {Array.from({ length: rows }).flatMap((_, rowIndex) =>
              Array.from({ length: columns }).map((__, columnIndex) => {
                const positionX = columnIndex + 1;
                const positionY = rowIndex + 1;

                if (aisleColumns.includes(positionX)) {
                  return (
                    <div
                      key={`aisle-${positionX}-${positionY}`}
                      className="flex h-full items-center justify-center rounded-[10px] border border-slate-200-dashed border-slate-200 bg-white text-xs font-semibold tracking-[0.2em] text-slate-400"
                    >
                      복도
                    </div>
                  );
                }

                const seat = seatMap.get(getSeatPositionKey(positionX, positionY)) ?? null;
                const isSelected = seat?.id === selectedSeatId;
                const isHighlighted = seat?.assignedStudent?.id === highlightStudentId;
                const isInteractive = Boolean(onCellClick);
                const canDragSeat = Boolean(onSeatDrop && seat?.id && seat.assignedStudent && seat.isActive);
                const canDropSeat = Boolean(onSeatDrop && seat?.id && seat.isActive);
                const classes = getSeatTone(seat);
                const trackLabel = formatStudyTrackLabel(seat?.assignedStudent?.studyTrack);

                const content = (
                  <div
                    className={`flex h-full flex-col justify-between rounded-[10px] border p-3 text-left transition ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
                        : classes
                    } ${isHighlighted && !isSelected ? "ring-2 ring-offset-2 ring-sky-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold tracking-[0.18em]">
                          {seat?.label ?? "빈 칸"}
                        </span>
                        {!seat ? <p className="mt-1 text-[11px] opacity-80">클릭해서 좌석 추가</p> : null}
                      </div>

                      {seat?.assignedStudent ? (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStudyTrackBadgeClasses(
                            seat.assignedStudent.studyTrack,
                          )}`}
                        >
                          {getStudyTrackShortLabel(seat.assignedStudent.studyTrack)}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {seat?.assignedStudent?.name ?? (seat ? "공석" : "좌석 없음")}
                      </p>

                      {seat?.assignedStudent ? (
                        <>
                          <p className="text-xs opacity-80">{seat.assignedStudent.studentNumber}</p>
                          <p className="text-xs font-medium opacity-90">직렬 {trackLabel}</p>
                        </>
                      ) : seat ? (
                        <p className="text-xs opacity-80">
                          {seat.isActive ? "배정 가능" : "비활성 좌석"}
                        </p>
                      ) : (
                        <p className="text-xs opacity-80">클릭해서 좌석 생성</p>
                      )}
                    </div>
                  </div>
                );

                if (!isInteractive) {
                  return <div key={`seat-${positionX}-${positionY}`} className="h-full">{content}</div>;
                }

                return (
                  <button
                    key={`seat-${positionX}-${positionY}`}
                    type="button"
                    onClick={() => onCellClick?.(positionX, positionY, seat?.id ?? null)}
                    className="h-full text-left"
                    draggable={canDragSeat}
                    onDragStart={(event) => {
                      if (!canDragSeat || !seat?.id) {
                        return;
                      }

                      event.dataTransfer.setData("text/plain", seat.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => {
                      if (!canDropSeat) {
                        return;
                      }

                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      if (!canDropSeat || !seat?.id) {
                        return;
                      }

                      event.preventDefault();
                      const fromSeatId = event.dataTransfer.getData("text/plain");

                      if (fromSeatId) {
                        onSeatDrop?.(fromSeatId, seat.id);
                      }
                    }}
                  >
                    {content}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
