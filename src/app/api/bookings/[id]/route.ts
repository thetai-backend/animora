import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutesToTime } from "@/lib/booking-utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER", "DOCTOR"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền thao tác" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy lịch hẹn" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.status) {
    data.status = String(body.status);
  }
  if (body.doctorId) {
    data.doctorId = String(body.doctorId);
    data.autoAssigned = false;
  }
  if (body.bookingDate) {
    data.bookingDate = String(body.bookingDate);
  }
  if (body.startTime) {
    const newStart = String(body.startTime);
    data.startTime = newStart;
    data.endTime = addMinutesToTime(newStart, existing.totalDurationMinutes);
  }
  if (body.notes !== undefined) {
    data.notes = body.notes ? String(body.notes) : null;
  }

  const updated = await prisma.booking.update({
    where: { id },
    data,
    include: {
      doctor: { select: { id: true, fullName: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
      pets: { include: { pet: true, services: true } },
    },
  });

  return NextResponse.json({ booking: updated });
}
