import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addMinutesToTime,
  generateBookingCode,
  getTodayDateStr,
} from "@/lib/booking-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền tạo phiếu tiếp nhận" }, { status: 403 });
  }

  const body = await request.json();
  const doctorId = String(body.doctorId || "");
  const guestName = String(body.guestName || "").trim();
  const guestPhone = String(body.guestPhone || "").trim();
  const guestPetName = String(body.guestPetName || "").trim();
  const guestPetSpecies = String(body.guestPetSpecies || "DOG").toUpperCase();
  const guestPetBreed = body.guestPetBreed ? String(body.guestPetBreed).trim() : null;
  const serviceId = String(body.serviceId || "");
  const isEmergency = Boolean(body.isEmergency);
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!doctorId || !guestName || !guestPhone || !guestPetName || !serviceId) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ Bác sĩ, Chủ nuôi, SĐT, Tên thú cưng và Dịch vụ" },
      { status: 400 }
    );
  }

  // Rule 5: CHỈ cho phép Lễ tân đẩy ca Walk-in/Cấp cứu vào bác sĩ đang ở trạng thái Đang trống (AVAILABLE)!
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.role !== "DOCTOR" || !doctor.isActive) {
    return NextResponse.json({ error: "Không tìm thấy bác sĩ hợp lệ" }, { status: 404 });
  }
  if (doctor.workStatus !== "AVAILABLE") {
    return NextResponse.json(
      {
        error: `${doctor.fullName} hiện KHÔNG ở trạng thái "Đang trống". Vui lòng điều phối sang bác sĩ khác đang trống.`,
      },
      { status: 409 }
    );
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ error: "Không tìm thấy dịch vụ" }, { status: 404 });
  }

  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const endTime = addMinutesToTime(startTime, service.durationMinutes);
  const bookingCode = generateBookingCode();

  // Tạo phiếu CHECKED_IN đẩy thẳng vào Hàng chờ khám của bác sĩ (chống trùng phiếu)
  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      isGuest: true,
      guestName,
      guestPhone,
      doctorId,
      bookingDate: getTodayDateStr(),
      startTime,
      endTime,
      totalDurationMinutes: service.durationMinutes,
      status: "CHECKED_IN",
      isWalkIn: true,
      isEmergency,
      notes: notes || (isEmergency ? "Ca CẤP CỨU tiếp nhận nhanh tại quầy" : "Khách vãng lai đến trực tiếp"),
      pets: {
        create: [
          {
            guestPetName,
            guestPetSpecies,
            guestPetBreed,
            services: {
              create: [
                {
                  serviceId: service.id,
                  serviceName: service.name,
                  serviceCategory: service.category,
                  price: service.price,
                  durationMinutes: service.durationMinutes,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      doctor: { select: { id: true, fullName: true } },
      pets: { include: { services: true } },
    },
  });

  return NextResponse.json(
    {
      booking,
      message: `Đã đẩy phiếu ${booking.bookingCode} vào hàng chờ khám của ${doctor.fullName}.`,
    },
    { status: 201 }
  );
}
