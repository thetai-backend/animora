import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_META, setSessionCookie, UserRole } from "@/lib/auth";

/**
 * Hỗ trợ Đăng nhập bằng Google:
 * - Nếu đã cấu hình GOOGLE_CLIENT_ID trong .env -> chuyển sang luồng Google OAuth thật.
 * - Nếu chưa cấu hình (chạy thử nghiệm trên máy) -> cho phép đăng nhập nhanh tài khoản Google mẫu.
 */
export async function POST(request: Request) {
  try {
    const hasGoogleOAuth = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );

    if (hasGoogleOAuth) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
      });
      return NextResponse.json({
        ok: true,
        oauthRedirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      });
    }

    // Chế độ thử nghiệm nội bộ trên máy cá nhân
    const body = await request.json().catch(() => ({}));
    const demoEmail =
      String(body?.email || "khach.google@animora.vn").trim().toLowerCase();
    const demoName = String(body?.fullName || "Nguyễn Ngọc Lan (Google)").trim();

    let user = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          googleId: `google-demo-${Date.now()}`,
          fullName: demoName,
          phone: "0909 112 233",
          role: "CUSTOMER",
          isActive: true,
          emailVerified: true,
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản Google này đã ngừng hoạt động." },
        { status: 403 }
      );
    }

    const role = user.role as UserRole;

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role,
    });

    return NextResponse.json({
      ok: true,
      mode: "DEV_PREVIEW",
      message: "Đã đăng nhập thành công bằng tài khoản Google thử nghiệm.",
      redirectTo: ROLE_META[role]?.dashboardPath || "/tai-khoan",
    });
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    return NextResponse.json(
      { error: "Không thể đăng nhập bằng Google lúc này." },
      { status: 500 }
    );
  }
}
