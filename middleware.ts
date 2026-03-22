import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  STUDENT_SESSION_COOKIE,
} from "@/lib/auth-cookies";
import { isMockMode } from "@/lib/mock-data";
import { verifyAdminSessionToken, verifyStudentSessionToken } from "@/lib/session-tokens";
import { updateSession } from "@/lib/supabase/middleware";

const adminAllowedRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const assistantAllowedRoles = new Set(["ASSISTANT", "ADMIN", "SUPER_ADMIN"]);

function buildRedirect(request: NextRequest, targetPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isSuperAdminPath = pathname === "/super-admin" || pathname.startsWith("/super-admin/");
  const segments = pathname.split("/").filter(Boolean);
  const divisionSlug = segments[0];
  const section = segments[1];
  const subsection = segments[2];

  const getAdminSession = async () => {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    return token ? verifyAdminSessionToken(token) : null;
  };
  const getStudentSession = async () => {
    const token = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;
    return token ? verifyStudentSessionToken(token) : null;
  };

  if (isMockMode()) {
    if (section === "student" && subsection !== "login") {
      const studentSession = await getStudentSession();

      if (!studentSession || studentSession.divisionSlug !== divisionSlug) {
        return buildRedirect(request, `/${divisionSlug}/student/login`);
      }
    }

    if (isSuperAdminPath) {
      const adminSession = await getAdminSession();

      if (!adminSession || adminSession.role !== "SUPER_ADMIN") {
        return buildRedirect(request, "/login");
      }
    }

    if (section === "admin") {
      const adminSession = await getAdminSession();

      if (!adminSession || !adminAllowedRoles.has(adminSession.role)) {
        return buildRedirect(request, "/login");
      }

      if (adminSession.role !== "SUPER_ADMIN" && adminSession.divisionSlug !== divisionSlug) {
        return buildRedirect(request, "/login");
      }
    }

    if (section === "assistant") {
      const adminSession = await getAdminSession();

      if (!adminSession || !assistantAllowedRoles.has(adminSession.role)) {
        return buildRedirect(request, "/login");
      }

      if (adminSession.role !== "SUPER_ADMIN" && adminSession.divisionSlug !== divisionSlug) {
        return buildRedirect(request, "/login");
      }
    }

    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (section === "student" && subsection !== "login") {
    const studentSession = await getStudentSession();

    if (!studentSession || studentSession.divisionSlug !== divisionSlug) {
      return buildRedirect(request, `/${divisionSlug}/student/login`);
    }
  }

  if (isSuperAdminPath) {
    if (!user) {
      return buildRedirect(request, "/login");
    }

    const adminSession = await getAdminSession();

    if (!adminSession || adminSession.role !== "SUPER_ADMIN") {
      return buildRedirect(request, "/login");
    }
  }

  if (section === "admin") {
    if (!user) {
      return buildRedirect(request, "/login");
    }

    const adminSession = await getAdminSession();

    if (!adminSession || !adminAllowedRoles.has(adminSession.role)) {
      return buildRedirect(request, "/login");
    }

    if (adminSession.role !== "SUPER_ADMIN" && adminSession.divisionSlug !== divisionSlug) {
      return buildRedirect(request, "/login");
    }
  }

  if (section === "assistant") {
    if (!user) {
      return buildRedirect(request, "/login");
    }

    const adminSession = await getAdminSession();

    if (!adminSession || !assistantAllowedRoles.has(adminSession.role)) {
      return buildRedirect(request, "/login");
    }

    if (adminSession.role !== "SUPER_ADMIN" && adminSession.divisionSlug !== divisionSlug) {
      return buildRedirect(request, "/login");
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
