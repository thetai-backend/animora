import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const body = await request.json();
  const fullName = String(body.fullName || "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const address = body.address ? String(body.address).trim() : null;

  if (!fullName) {
    return NextResponse.json({ error: "Họ và tên không được để trống" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { fullName, phone, address },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
    },
  });

  // Đồng bộ lại cookie phiên để tiêu đề trang lập tức hiển thị tên mới
  await setSessionCookie({
    userId: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    role: updated.role as UserRole,
  });

  return NextResponse.json({ user: updated });
}
