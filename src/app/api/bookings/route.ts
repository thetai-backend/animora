import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addMinutesToTime,
  computeDayAvailability,
  generateBookingCode,
} from "@/lib/booking-utils";

interface BookingPetInput {
  petId?: string;
  guestPetName?: string;
  guestPetSpecies?: string;
  guestPetBreed?: string;
  guestPetNote?: string;
  serviceIds: string[];
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  const body = await request.json();

  const isStaff =
    session && (session.role === "RECEPTIONIST" || session.role === "MANAGER");

  // Nếu Lễ tân / Quản lý đặt lịch hộ cho 1 khách thành viên cụ thể
  const delegatedCustomerId =
    isStaff && body.customerId && !body.forceGuest
      ? String(body.customerId).trim()
      : null;

  const isGuest =
    Boolean(body.forceGuest) ||
    (!session && !delegatedCustomerId) ||
    (Boolean(isStaff) && !delegatedCustomerId);

  const targetCustomerId = isGuest
    ? null
    : delegatedCustomerId || session!.userId;

  const bookingDate = String(body.bookingDate || "").trim();
  const startTime = String(body.startTime || "").trim();
  const requestedDoctorId =
    body.doctorId && body.doctorId !== "AUTO" ? String(body.doctorId) : null;
  const notes = body.notes ? String(body.notes).trim() : null;
  const petsInput: BookingPetInput[] = Array.isArray(body.pets) ? body.pets : [];

  if (!bookingDate || !startTime) {
    return NextResponse.json(
      { error: "Vui lòng chọn ngày và khung giờ đặt lịch" },
      { status: 400 }
    );
  }

  if (petsInput.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn ít nhất 1 thú cưng và dịch vụ" },
      { status: 400 }
    );
  }

  if (isGuest) {
    if (!body.guestName?.trim() || !body.guestPhone?.trim()) {
      return NextResponse.json(
        { error: "Khách vãng lai vui lòng nhập Họ tên và Số điện thoại liên hệ" },
        { status: 400 }
      );
    }
  } else {
    // Kiểm tra thú cưng của thành viên: phải tồn tại, thuộc chủ nuôi và còn sống (ALIVE)
    const memberPetIds = petsInput.map((p) => p.petId).filter(Boolean) as string[];
    if (memberPetIds.length !== petsInput.length) {
      return NextResponse.json(
        { error: "Vui lòng chọn đầy đủ thú cưng từ hồ sơ thành viên" },
        { status: 400 }
      );
    }
    const dbPets = await prisma.pet.findMany({
      where: {
        id: { in: memberPetIds },
        ownerId: targetCustomerId!,
      },
    });
    if (dbPets.length !== new Set(memberPetIds).size) {
      return NextResponse.json(
        { error: "Có thú cưng không hợp lệ hoặc không thuộc hồ sơ khách hàng này" },
        { status: 400 }
      );
    }
    const deceasedPet = dbPets.find((p) => p.status === "DECEASED");
    if (deceasedPet) {
      return NextResponse.json(
        {
          error: `Thú cưng "${deceasedPet.name}" đã được đánh dấu Đã mất nên không thể tạo lịch hẹn mới.`,
        },
        { status: 400 }
      );
    }
  }

  // Lấy toàn bộ dịch vụ để tính đúng tổng thời lượng & giá cố định (Rule 7)
  const allServiceIds = Array.from(
    new Set(petsInput.flatMap((p) => p.serviceIds || []))
  );
  if (allServiceIds.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn ít nhất 1 dịch vụ cho thú cưng" },
      { status: 400 }
    );
  }

  const dbServices = await prisma.service.findMany({
    where: { id: { in: allServiceIds }, isActive: true },
  });
  const serviceById = new Map(dbServices.map((s) => [s.id, s]));

  let totalDurationMinutes = 0;
  for (const p of petsInput) {
    if (!p.serviceIds || p.serviceIds.length === 0) {
      return NextResponse.json(
        { error: "Mỗi thú cưng trong phiếu đặt lịch cần chọn ít nhất 1 dịch vụ" },
        { status: 400 }
      );
    }
    for (const sid of p.serviceIds) {
      const srv = serviceById.get(sid);
      if (!srv) {
        return NextResponse.json(
          { error: "Có dịch vụ không tồn tại hoặc đã ngừng cung cấp" },
          { status: 400 }
        );
      }
      totalDurationMinutes += srv.durationMinutes;
    }
  }

  // Làm tròn lên bội số 30 phút để khóa kín các ô liên tiếp (Rule 4)
  const lockedDuration = Math.max(30, Math.ceil(totalDurationMinutes / 30) * 30);

  // Kiểm tra slot còn trống & tự phân công bác sĩ ít lịch nhất nếu cần
  const availability = await computeDayAvailability({
    date: bookingDate,
    durationMinutes: lockedDuration,
    doctorId: requestedDoctorId,
  });

  const matchedSlot = availability.slots.find((s) => s.time === startTime);
  if (!matchedSlot || !matchedSlot.available || matchedSlot.availableDoctorIds.length === 0) {
    return NextResponse.json(
      {
        error:
          matchedSlot?.reason ||
          "Khung giờ này đã kín lịch hoặc không đủ thời lượng liên tiếp. Vui lòng chọn khung giờ khác.",
      },
      { status: 409 }
    );
  }

  const assignedDoctorId = requestedDoctorId
    ? requestedDoctorId
    : matchedSlot.availableDoctorIds[0]; // Đã sắp xếp bác sĩ ít lịch nhất lên đầu
  const endTime = addMinutesToTime(startTime, lockedDuration);

  // Tạo mã đặt lịch duy nhất (ANM-xxxx)
  let bookingCode = generateBookingCode();
  for (let i = 0; i < 8; i++) {
    const exists = await prisma.booking.findUnique({ where: { bookingCode } });
    if (!exists) break;
    bookingCode = generateBookingCode();
  }

  // Rule 3: Nếu là Khách vãng lai -> TUYỆT ĐỐI KHÔNG tạo User hay Pet!
  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      isGuest,
      customerId: targetCustomerId,
      guestName: isGuest ? String(body.guestName).trim() : null,
      guestPhone: isGuest ? String(body.guestPhone).trim() : null,
      guestEmail: isGuest && body.guestEmail ? String(body.guestEmail).trim() : null,
      doctorId: assignedDoctorId,
      autoAssigned: !requestedDoctorId,
      bookingDate,
      startTime,
      endTime,
      totalDurationMinutes: lockedDuration,
      status: "CONFIRMED",
      notes,
      pets: {
        create: petsInput.map((p) => ({
          petId: isGuest ? null : p.petId || null,
          guestPetName: isGuest ? String(p.guestPetName || "Thú cưng").trim() : null,
          guestPetSpecies: isGuest ? String(p.guestPetSpecies || "DOG").toUpperCase() : null,
          guestPetBreed: isGuest && p.guestPetBreed ? String(p.guestPetBreed).trim() : null,
          guestPetNote: isGuest && p.guestPetNote ? String(p.guestPetNote).trim() : null,
          services: {
            create: p.serviceIds.map((sid) => {
              const srv = serviceById.get(sid)!;
              return {
                serviceId: srv.id,
                serviceName: srv.name,
                serviceCategory: srv.category,
                price: srv.price,
                durationMinutes: srv.durationMinutes,
              };
            }),
          },
        })),
      },
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
      doctor: { select: { id: true, fullName: true, title: true } },
      pets: {
        include: {
          pet: { select: { id: true, name: true, species: true, breed: true } },
          services: true,
        },
      },
    },
  });

  const emailTarget = isGuest
    ? booking.guestEmail
    : booking.customer?.email || session?.email;
  if (emailTarget) {
    console.log(
      `[ANIMORA EMAIL XÁC NHẬN ĐẶT LỊCH] Gửi tới ${emailTarget} — Mã: ${booking.bookingCode} (${bookingDate} ${startTime}-${endTime})`
    );
  }

  return NextResponse.json(
    {
      booking,
      emailSimulation: emailTarget
        ? `Đã gửi Email xác nhận mô phỏng kèm mã ${booking.bookingCode} tới ${emailTarget}.`
        : `Đặt lịch thành công với mã ${booking.bookingCode}. Vui lòng lưu lại mã này cùng SĐT để tra cứu hoặc hủy lịch bất cứ lúc nào.`,
    },
    { status: 201 }
  );
}
