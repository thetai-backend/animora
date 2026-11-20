import { NextRequest, NextResponse } from "next/server";
import {
  ROLE_META,
  SESSION_COOKIE_NAME,
  UserRole,
  verifySessionToken,
} from "@/lib/auth";

const PROTECTED_PREFIXES: { prefix: string; allowedRoles: UserRole[] }[] = [
  { prefix: "/quan-ly", allowedRoles: ["MANAGER"] },
  { prefix: "/le-tan", allowedRoles: ["RECEPTIONIST", "MANAGER"] },
  { prefix: "/bac-si", allowedRoles: ["DOCTOR", "MANAGER"] },
  { prefix: "/tai-khoan", allowedRoles: ["CUSTOMER", "MANAGER", "RECEPTIONIST", "DOCTOR"] },
  { prefix: "/in", allowedRoles: ["CUSTOMER", "MANAGER", "RECEPTIONIST", "DOCTOR"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedRule = PROTECTED_PREFIXES.find((rule) =>
    pathname.startsWith(rule.prefix)
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const loginUrl = new URL("/dang-nhap", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!matchedRule.allowedRoles.includes(session.role)) {
    const fallbackPath = ROLE_META[session.role]?.dashboardPath || "/";
    const redirectUrl = new URL(fallbackPath, request.url);
    redirectUrl.searchParams.set("notice", "khong-du-quyen");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quan-ly/:path*", "/le-tan/:path*", "/bac-si/:path*", "/tai-khoan/:path*", "/in/:path*"],
};
