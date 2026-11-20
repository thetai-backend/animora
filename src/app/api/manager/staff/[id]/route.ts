import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền sửa tài khoản nhân sự" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản nhân sự" }, { status: 404 });
  }

  const body = await request.json();

  if (body.isActive === false && id === session.userId) {
    return NextResponse.json(
      { error: "Không thể tự khóa tài khoản Quản lý đang đăng nhập" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (body.fullName !== undefined) data.fullName = String(body.fullName).trim();
  if (body.phone !== undefined) data.phone = String(body.phone || "").trim() || null;
  if (body.address !== undefined) data.address = String(body.address || "").trim() || null;
  if (body.role && ["MANAGER", "RECEPTIONIST", "DOCTOR"].includes(String(body.role))) {
    data.role = String(body.role);
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.title !== undefined) data.title = String(body.title || "").trim() || null;
  if (body.specialty !== undefined) data.specialty = String(body.specialty || "").trim() || null;
  if (body.experienceYears !== undefined) {
    data.experienceYears =
      body.experienceYears === "" || body.experienceYears === null
        ? null
        : Number(body.experienceYears);
  }
  if (body.bio !== undefined) data.bio = String(body.bio || "").trim() || null;
  if (body.avatarUrl !== undefined) data.avatarUrl = String(body.avatarUrl || "").trim() || null;

  if (body.newPassword && String(body.newPassword).trim().length >= 6) {
    data.passwordHash = await bcrypt.hash(String(body.newPassword).trim(), 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      title: true,
      specialty: true,
      experienceYears: true,
      bio: true,
      avatarUrl: true,
    },
  });

  // Nếu đổi vai trò sang DOCTOR -> đảm bảo có lịch trực
  if (updated.role === "DOCTOR") {
    const count = await prisma.workSchedule.count({ where: { doctorId: updated.id } });
    if (count === 0) {
      for (let dow = 0; dow <= 6; dow++) {
        await prisma.workSchedule.create({
          data: { doctorId: updated.id, dayOfWeek: dow, morningShift: true, afternoonShift: true },
        });
      }
    }
  }

  return NextResponse.json({
    staff: updated,
    message:
      body.isActive === false
        ? `Đã chuyển "${updated.fullName}" sang Ngừng hoạt động (chặn đăng nhập ngay lập tức, giữ nguyên 100% bệnh án & hóa đơn cũ).`
        : body.isActive === true && !existing.isActive
        ? `Đã kích hoạt lại tài khoản "${updated.fullName}".`
        : `Đã cập nhật hồ sơ nhân sự "${updated.fullName}" thành công!`,
  });
}
