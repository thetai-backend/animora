import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShiftRange, rangesOverlap, timeToMinutes } from "@/lib/booking-utils";

export async function GET() {
  const session = await getSession();
  if (!session || !["DOCTOR", "RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const leaves = await prisma.doctorLeave.findMany({
    where: session.role === "DOCTOR" ? { doctorId: session.userId } : undefined,
    include: {
      doctor: { select: { id: true, fullName: true, title: true } },
    },
    orderBy: [{ leaveDate: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({ leaves });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json(
      { error: "Chỉ Bác sĩ mới có thể tự đăng ký nghỉ / báo nghỉ đột xuất" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const doctorId =
    session.role === "MANAGER" && body.doctorId ? String(body.doctorId) : session.userId;
  const leaveDate = String(body.leaveDate || "").trim();
  const shift = ["MORNING", "AFTERNOON", "FULL_DAY"].includes(body.shift)
    ? String(body.shift)
    : "FULL_DAY";
  const isEmergency = Boolean(body.isEmergency);
  const reason = String(body.reason || "").trim() || (isEmergency ? "Nghỉ đột xuất do sự cố cá nhân" : "Đăng ký ngày nghỉ định kỳ");

  if (!leaveDate) {
    return NextResponse.json({ error: "Vui lòng chọn ngày nghỉ" }, { status: 400 });
  }

  // Rule 5: Bác sĩ tự đăng ký nghỉ KHÔNG cần Quản lý duyệt, khóa lịch ngay
  const leave = await prisma.doctorLeave.create({
    data: {
      doctorId,
      leaveDate,
      shift,
      isEmergency,
      reason,
      resolvedByReceptionist: !isEmergency,
    },
    include: {
      doctor: { select: { id: true, fullName: true } },
    },
  });

  // Nếu nghỉ đột xuất -> tự chuyển trạng thái bác sĩ sang OFF_DUTY nếu là hôm nay
  if (isEmergency) {
    await prisma.user.update({
      where: { id: doctorId },
      data: { workStatus: "OFF_DUTY" },
    });
  }

  // Tìm các lịch hẹn của khách bị ảnh hưởng trong ca nghỉ
  const shiftRange = getShiftRange(shift);
  const dayBookings = await prisma.booking.findMany({
    where: {
      doctorId,
      bookingDate: leaveDate,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
  });

  const affectedBookings = dayBookings.filter((b) =>
    rangesOverlap(
      shiftRange.start,
      shiftRange.end,
      timeToMinutes(b.startTime),
      timeToMinutes(b.endTime)
    )
  );

  // Nếu có lịch bị ảnh hưởng, đánh dấu cảnh báo khẩn cho Lễ tân dù bác sĩ bấm thường hay đột xuất
  if (affectedBookings.length > 0 && !leave.isEmergency) {
    await prisma.doctorLeave.update({
      where: { id: leave.id },
      data: { isEmergency: true, resolvedByReceptionist: false },
    });
  }

  return NextResponse.json(
    {
      leave,
      affectedCount: affectedBookings.length,
      message:
        affectedBookings.length > 0
          ? `Đã khóa lịch nghỉ và phát CẢNH BÁO ĐỎ tới màn hình Lễ tân (${affectedBookings.length} lịch hẹn bị ảnh hưởng cần chuyển bác sĩ/dời giờ).`
          : "Đã đăng ký nghỉ thành công và khóa khung giờ đặt lịch ngay lập tức.",
    },
    { status: 201 }
  );
}
