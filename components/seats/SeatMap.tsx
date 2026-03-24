"use client";

import { memo, useMemo } from "react";
import { getSeatPositionKey } from "@/lib/seat-layout";
import type { SeatMapSeat } from "@/lib/services/seat.service";
import {
  getStudyTrackBadgeClasses,
  getStudyTrackShortLabel,
} from "@/lib/study-track-meta";

type SeatMapProps = {
  seats: SeatMapSeat[];
  columns: number;
  rows: number;
  aisleColumns: number[];
  selectedSeatId?: string | null;
  selectedSeatIds?: ReadonlySet<string>;
  highlightStudentId?: string | null;
  onCellClick?: (positionX: number, positionY: number, seatId: string | null, shiftKey: boolean) => void;
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

const EMPTY_SET = new Set<string>();

export const SeatMap = memo(function SeatMap({
  seats,
  columns,
  rows,
  aisleColumns,
  selectedSeatId,
  selectedSeatIds = EMPTY_SET,
  highlightStudentId,
  onCellClick,
  onSeatDrop,
}: SeatMapProps) {
  const seatMap = useMemo(() => new Map(seats.map((seat) => [getSeatPositionKey(seat.positionX, seat.positionY), seat])), [seats]);

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-slate-200-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600">
        칠판
      </div>

      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="rounded-[10px] border border-slate-200-black/5 bg-white p-3 shadow-[0_12px_30px_rgba(18,32,56,0.05)] sm:p-4">
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, 100px)`,
              gridAutoRows: "100px",
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
                      className="flex h-full items-center justify-center rounded-[8px] border border-dashed border-slate-200 bg-white text-[10px] font-semibold tracking-[0.2em] text-slate-400"
                    >
                      복도
                    </div>
                  );
                }

                const seat = seatMap.get(getSeatPositionKey(positionX, positionY)) ?? null;
                const seatId = seat?.id ?? null;
                const isSelected = seatId === selectedSeatId || (seatId != null && selectedSeatIds.has(seatId));
                const isHighlighted = seat?.assignedStudent?.id === highlightStudentId;
                const isInteractive = Boolean(onCellClick);
                const canDragSeat = Boolean(onSeatDrop && seatId && seat?.assignedStudent && seat.isActive);
                const canDropSeat = Boolean(onSeatDrop && seatId && seat?.isActive);
                const classes = getSeatTone(seat);
                const displayLabel = seat ? seat.label : "빈 칸";

                const content = (
                  <div
                    className={`flex h-full flex-col justify-between rounded-[8px] border p-2 text-left transition ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
                        : classes
                    } ${isHighlighted && !isSelected ? "ring-2 ring-offset-1 ring-sky-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-bold leading-tight">
                        {!seat?.isActive && !seat?.label ? "" : displayLabel}
                      </span>
                      {seat?.assignedStudent ? (
                        <span
                          className={`inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-tight ${getStudyTrackBadgeClasses(
                            seat.assignedStudent.studyTrack,
                          )}`}
                        >
                          {getStudyTrackShortLabel(seat.assignedStudent.studyTrack)}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold leading-tight">
                        {seat?.assignedStudent?.name ?? (seat ? "공석" : "")}
                      </p>
                      {seat?.assignedStudent ? (
                        <p className="mt-0.5 truncate text-[10px] opacity-80">{seat.assignedStudent.studentNumber}</p>
                      ) : seat ? (
                        <p className="mt-0.5 text-[10px] opacity-70">
                          {seat.isActive ? "배정 가능" : "비활성"}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[10px] opacity-70">클릭 추가</p>
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
                    onClick={(event) => onCellClick?.(positionX, positionY, seatId, event.shiftKey)}
                    className="h-full text-left"
                    draggable={canDragSeat}
                    onDragStart={(event) => {
                      if (!canDragSeat || !seatId) {
                        return;
                      }

                      event.dataTransfer.setData("text/plain", seatId);
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
                      if (!canDropSeat || !seatId) {
                        return;
                      }

                      event.preventDefault();
                      const fromSeatId = event.dataTransfer.getData("text/plain");

                      if (fromSeatId) {
                        onSeatDrop?.(fromSeatId, seatId);
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
