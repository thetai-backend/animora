import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền mở ca khám" }, { status: 403 });
  }

  const body = await request.json();

  let doctorId = session.userId;
  if (session.role === "MANAGER") {
    if (body.doctorId) {
      doctorId = String(body.doctorId);
    } else {
      const firstDoc = await prisma.user.findFirst({
        where: { role: "DOCTOR", isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (firstDoc) doctorId = firstDoc.id;
    }
  }

  // Trường hợp 1: Bắt đầu khám từ Booking đã Check-in (chống trùng phiếu)
  if (body.bookingId) {
    const bookingId = String(body.bookingId);
    const bookingPetId = body.bookingPetId ? String(body.bookingPetId) : null;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pets: { include: { pet: true, services: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy phiếu hẹn" }, { status: 404 });
    }

    const targetPet = bookingPetId
      ? booking.pets.find((p) => p.id === bookingPetId) || booking.pets[0]
      : booking.pets[0];

    // Kiểm tra đã tạo bệnh án cho lượt này chưa -> tránh tạo trùng
    const existingRecord = await prisma.medicalRecord.findFirst({
      where: {
        bookingId: booking.id,
        ...(targetPet ? { bookingPetId: targetPet.id } : {}),
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "IN_PROGRESS" },
    });

    // Tự động chuyển trạng thái Bác sĩ sang ĐANG KHÁM (IN_EXAM)
    await prisma.user.update({
      where: { id: doctorId },
      data: { workStatus: "IN_EXAM" },
    });

    if (existingRecord) {
      return NextResponse.json({ medicalRecord: existingRecord });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        recordCode: generateShortCode("BA"),
        bookingId: booking.id,
        bookingPetId: targetPet?.id ?? null,
        doctorId,
        customerId: booking.isGuest ? null : booking.customerId,
        petId: booking.isGuest ? null : targetPet?.petId ?? null,
        guestOwnerName: booking.isGuest ? booking.guestName : null,
        guestOwnerPhone: booking.isGuest ? booking.guestPhone : null,
        guestPetName: booking.isGuest ? targetPet?.guestPetName : null,
        guestPetSpecies: booking.isGuest ? targetPet?.guestPetSpecies : null,
        guestPetBreed: booking.isGuest ? targetPet?.guestPetBreed : null,
        subjective: booking.notes || "",
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ medicalRecord: record }, { status: 201 });
  }

  // Trường hợp 2: Bác sĩ tự bấm "Tạo ca khám khách lẻ" trực tiếp
  const guestOwnerName = String(body.guestOwnerName || "").trim();
  const guestOwnerPhone = String(body.guestOwnerPhone || "").trim();
  const guestPetName = String(body.guestPetName || "").trim();
  const guestPetSpecies = String(body.guestPetSpecies || "DOG").toUpperCase();
  const guestPetBreed = body.guestPetBreed ? String(body.guestPetBreed).trim() : null;

  if (!guestOwnerName || !guestPetName) {
    return NextResponse.json(
      { error: "Vui lòng nhập Tên chủ nuôi và Tên thú cưng" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: doctorId },
    data: { workStatus: "IN_EXAM" },
  });

  // Rule 3: Khách lẻ KHÔNG lưu vào User/Pet, vẫn lưu đầy đủ bệnh án vào Hồ sơ ca khám
  const record = await prisma.medicalRecord.create({
    data: {
      recordCode: generateShortCode("BA"),
      doctorId,
      guestOwnerName,
      guestOwnerPhone: guestOwnerPhone || null,
      guestPetName,
      guestPetSpecies,
      guestPetBreed,
      subjective: body.subjective ? String(body.subjective).trim() : "",
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json({ medicalRecord: record }, { status: 201 });
}
