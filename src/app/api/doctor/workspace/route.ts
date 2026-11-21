import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateStr } from "@/lib/booking-utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập khu vực Bác sĩ" }, { status: 403 });
  }

  // Nếu Manager vào xem thử /bac-si, lấy bác sĩ đầu tiên hoặc chính user nếu là DOCTOR
  let doctorUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, title: true, workStatus: true, role: true },
  });

  if (doctorUser?.role === "MANAGER") {
    const firstDoc = await prisma.user.findFirst({
      where: { role: "DOCTOR", isActive: true },
      select: { id: true, fullName: true, title: true, workStatus: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    if (firstDoc) doctorUser = firstDoc;
  }

  if (!doctorUser) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bác sĩ" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const selectedDate = searchParams.get("date") || getTodayDateStr();

  const [queueBookings, medicalRecords, allRecords, leaves, services, products, internalSlips] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          doctorId: doctorUser.id,
          bookingDate: selectedDate,
          status: { in: ["CHECKED_IN", "IN_PROGRESS", "CONFIRMED"] },
        },
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          pets: {
            include: {
              pet: true,
              services: true,
            },
          },
          medicalRecords: {
            select: { id: true, recordCode: true, status: true, bookingPetId: true },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.medicalRecord.findMany({
        where: { doctorId: doctorUser.id },
        include: {
          doctor: { select: { id: true, fullName: true } },
          customer: { select: { id: true, fullName: true, phone: true } },
          pet: true,
          addendums: { orderBy: { createdAt: "asc" } },
          invoice: {
            include: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.medicalRecord.findMany({
        include: {
          doctor: { select: { id: true, fullName: true } },
          customer: { select: { id: true, fullName: true, phone: true } },
          pet: { select: { id: true, name: true, species: true, breed: true } },
          addendums: { orderBy: { createdAt: "asc" } },
          invoice: {
            select: { invoiceCode: true, status: true, totalAmount: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.doctorLeave.findMany({
        where: { doctorId: doctorUser.id },
        orderBy: { leaveDate: "desc" },
        take: 20,
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          sku: true,
          name: true,
          group: true,
          price: true,
          retailUnit: true,
          stockQuantity: true,
        },
        orderBy: [{ group: "asc" }, { name: "asc" }],
      }),
      prisma.internalUsageSlip.findMany({
        where: { createdById: doctorUser.id },
        include: {
          product: { select: { name: true, retailUnit: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

  return NextResponse.json({
    date: selectedDate,
    doctor: doctorUser,
    queueBookings,
    medicalRecords,
    allRecords,
    leaves,
    services,
    products,
    internalSlips,
  });
}
