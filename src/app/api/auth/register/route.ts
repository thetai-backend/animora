import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLE_META, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.fullName ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");
    const otpCode = String(body?.otpCode ?? "").trim();

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ tên đầy đủ." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Địa chỉ Email không hợp lệ." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu cần có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    if (!otpCode || otpCode.length !== 6) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã tồn tại trên hệ thống." },
        { status: 409 }
      );
    }

    const validOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        code: otpCode,
        purpose: "REGISTER",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validOtp) {
      return NextResponse.json(
        { error: "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng bấm gửi lại mã." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone: phone || null,
        role: "CUSTOMER",
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.otpCode.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: "CUSTOMER",
    });

    return NextResponse.json({
      ok: true,
      message: "Đăng ký tài khoản thành công!",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      redirectTo: ROLE_META.CUSTOMER.dashboardPath,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đăng ký tài khoản. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
