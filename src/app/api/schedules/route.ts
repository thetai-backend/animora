import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER", "DOCTOR"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const [settings, doctors, schedules] = await Promise.all([
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
    prisma.user.findMany({
      where: { role: "DOCTOR", isActive: true },
      select: { id: true, fullName: true, title: true, workStatus: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.workSchedule.findMany({
      orderBy: [{ doctorId: "asc" }, { dayOfWeek: "asc" }],
    }),
  ]);

  return NextResponse.json({
    lunchBreakEnabled: settings?.lunchBreakEnabled ?? false,
    lunchStart: settings?.lunchStart ?? "12:00",
    lunchEnd: settings?.lunchEnd ?? "13:30",
    doctors,
    schedules,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json(
      { error: "Chỉ Lễ tân hoặc Quản lý mới được chỉnh sửa lịch trực" },
      { status: 403 }
    );
  }

  const body = await request.json();

  if (typeof body.lunchBreakEnabled === "boolean") {
    await prisma.clinicSettings.update({
      where: { id: "default" },
      data: { lunchBreakEnabled: body.lunchBreakEnabled },
    });
  }

  if (Array.isArray(body.schedules)) {
    for (const item of body.schedules) {
      if (!item.doctorId || typeof item.dayOfWeek !== "number") continue;
      await prisma.workSchedule.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: String(item.doctorId),
            dayOfWeek: item.dayOfWeek,
          },
        },
        update: {
          morningShift: Boolean(item.morningShift),
          afternoonShift: Boolean(item.afternoonShift),
        },
        create: {
          doctorId: String(item.doctorId),
          dayOfWeek: item.dayOfWeek,
          morningShift: Boolean(item.morningShift),
          afternoonShift: Boolean(item.afternoonShift),
        },
      });
    }
  }

  return NextResponse.json({ ok: true, message: "Đã lưu lịch trực và cài đặt nghỉ trưa." });
}
