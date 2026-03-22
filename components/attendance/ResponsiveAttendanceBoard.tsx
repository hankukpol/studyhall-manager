"use client";

import { useEffect, useState } from "react";

import {
  AdminAttendanceBoard,
  type AdminAttendanceBoardProps,
} from "@/components/attendance/AdminAttendanceBoard";
import { MobileCheckForm, type MobileCheckFormProps } from "@/components/attendance/MobileCheckForm";

type ResponsiveAttendanceBoardProps = {
  initialMode: "mobile" | "desktop";
  desktopProps: AdminAttendanceBoardProps;
  mobileProps: MobileCheckFormProps;
};

export function ResponsiveAttendanceBoard({
  initialMode,
  desktopProps,
  mobileProps,
}: ResponsiveAttendanceBoardProps) {
  const [mode, setMode] = useState<"mobile" | "desktop">(initialMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMode = () => setMode(mediaQuery.matches ? "mobile" : "desktop");

    syncMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMode);
      return () => mediaQuery.removeEventListener("change", syncMode);
    }

    mediaQuery.addListener(syncMode);
    return () => mediaQuery.removeListener(syncMode);
  }, []);

  return mode === "mobile" ? <MobileCheckForm {...mobileProps} /> : <AdminAttendanceBoard {...desktopProps} />;
}
