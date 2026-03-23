"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

type StudentLogoutButtonProps = {
  divisionSlug: string;
};

export function StudentLogoutButton({ divisionSlug }: StudentLogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push(`/${divisionSlug}/student/login`);
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="inline-flex items-center justify-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        borderColor: "var(--division-accent-border)",
        backgroundColor: "var(--division-accent-surface)",
        color: "var(--division-on-accent)",
      }}
    >
      {isSubmitting ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      로그아웃
    </button>
  );
}
