import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const body = await request.json();

  const bookingId = body.bookingId ? String(body.bookingId) : null;
  const bookingCode = body.bookingCode ? String(body.bookingCode).trim().toUpperCase() : null;
  const phone = body.phone ? String(body.phone).replace(/\s+/g, "") : null;
  const cancelReason = body.cancelReason
    ? String(body.cancelReason).trim()
    : "Khách chủ động hủy lịch";

  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: { select: { phone: true } } },
      })
    : bookingCode
    ? await prisma.booking.findUnique({
        where: { bookingCode },
        include: { customer: { select: { phone: true } } },
      })
    : null;

  if (!booking) {
    return NextResponse.json({ error: "Không tìm thấy phiếu đặt lịch" }, { status: 404 });
  }

  // Kiểm tra quyền hủy: Nhân viên Lễ tân/Quản lý, chủ sở hữu tài khoản, hoặc Khách vãng lai đúng Mã + SĐT
  const isStaff = session && (session.role === "RECEPTIONIST" || session.role === "MANAGER");
  const isOwner = session && booking.customerId && booking.customerId === session.userId;
  const storedPhone = (
    booking.isGuest ? booking.guestPhone : booking.customer?.phone
  )?.replace(/\s+/g, "");
  const isVerifiedGuest = Boolean(bookingCode && phone && storedPhone === phone);

  if (!isStaff && !isOwner && !isVerifiedGuest) {
    return NextResponse.json({ error: "Bạn không có quyền hủy phiếu đặt lịch này" }, { status: 403 });
  }

  // Rule 4: Tự hủy không giới hạn thời gian miễn chưa vào khám (IN_PROGRESS / COMPLETED)
  if (booking.status === "IN_PROGRESS" || booking.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Lịch hẹn đã vào khám hoặc đã hoàn tất nên không thể hủy" },
      { status: 400 }
    );
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ booking, message: "Lịch hẹn đã được hủy trước đó" });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason,
    },
  });

  return NextResponse.json({
    booking: updated,
    message: `Đã hủy thành công lịch hẹn ${updated.bookingCode}.`,
  });
}
