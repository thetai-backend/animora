import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchOtpNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ Email hợp lệ." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập." },
        { status: 409 }
      );
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hiệu lực 5 phút

    // Vô hiệu hóa các mã OTP cũ chưa dùng của email này
    await prisma.otpCode.updateMany({
      where: { email, purpose: "REGISTER", used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: {
        email,
        code,
        purpose: "REGISTER",
        expiresAt,
      },
    });

    const dispatch = await dispatchOtpNotification(email, code, "EMAIL");

    return NextResponse.json({
      ok: true,
      message: "Đã gửi mã OTP xác thực 6 số (có hiệu lực trong 5 phút).",
      mode: dispatch.mode,
      devOtpCode: dispatch.devOtpCode,
    });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    return NextResponse.json(
      { error: "Không thể gửi mã OTP lúc này. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
