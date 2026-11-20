import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLE_META, setSessionCookie, UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Email và Mật khẩu." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu chưa chính xác." },
        { status: 401 }
      );
    }

    // Rule 12: Xóa mềm nhân sự -> chặn đăng nhập nếu đã ngừng hoạt động
    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            "Tài khoản này đã ngừng hoạt động. Vui lòng liên hệ Quản lý phòng khám.",
        },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu chưa chính xác." },
        { status: 401 }
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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
      },
      redirectTo: ROLE_META[role]?.dashboardPath || "/",
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return NextResponse.json(
      { error: "Không thể đăng nhập lúc này. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
