import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getShiftRange,
  getTodayDateStr,
  isBookingLate20Min,
  rangesOverlap,
  timeToMinutes,
} from "@/lib/booking-utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getTodayDateStr();

  const [doctors, bookings, emergencyLeaves, services, followUpRecords, customers] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "DOCTOR", isActive: true },
        select: {
          id: true,
          fullName: true,
          title: true,
          specialty: true,
          workStatus: true,
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.booking.findMany({
        where: { bookingDate: date },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
          doctor: { select: { id: true, fullName: true, workStatus: true } },
          pets: {
            include: {
              pet: { select: { id: true, name: true, species: true, breed: true } },
              services: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.doctorLeave.findMany({
        where: {
          isEmergency: true,
          resolvedByReceptionist: false,
        },
        include: {
          doctor: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.medicalRecord.findMany({
        where: {
          followUpDate: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          OR: [{ petId: null }, { pet: { status: "ALIVE" } }],
        },
        include: {
          customer: { select: { fullName: true, phone: true, email: true } },
          pet: { select: { name: true, species: true, status: true } },
          doctor: { select: { fullName: true } },
        },
        orderBy: { followUpDate: "asc" },
        take: 15,
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER", isActive: true },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          pets: {
            where: { status: "ALIVE" },
            select: { id: true, name: true, species: true, breed: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { fullName: "asc" },
      }),
    ]);

  // Gắn cờ quá giờ 20 phút cho từng booking
  const enrichedBookings = bookings.map((b) => ({
    ...b,
    isLate20Min: isBookingLate20Min(b.bookingDate, b.startTime, b.status),
  }));

  // Tìm các lịch hẹn bị ảnh hưởng bởi từng cảnh báo nghỉ đột xuất
  const emergencyAlerts = await Promise.all(
    emergencyLeaves.map(async (leave) => {
      const range = getShiftRange(leave.shift);
      const candidates = await prisma.booking.findMany({
        where: {
          doctorId: leave.doctorId,
          bookingDate: leave.leaveDate,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
        include: {
          customer: { select: { fullName: true, phone: true } },
          pets: { include: { pet: { select: { name: true, species: true } }, services: true } },
        },
        orderBy: { startTime: "asc" },
      });

      const affectedBookings = candidates.filter((b) =>
        rangesOverlap(
          range.start,
          range.end,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        )
      );

      return {
        ...leave,
        affectedBookings,
      };
    })
  );

  return NextResponse.json({
    date,
    doctors,
    bookings: enrichedBookings,
    emergencyAlerts,
    services,
    followUpRecords,
    customers,
  });
}
