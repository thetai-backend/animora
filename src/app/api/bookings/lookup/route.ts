import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = String(searchParams.get("code") || "").trim().toUpperCase();
  const phone = String(searchParams.get("phone") || "").replace(/\s+/g, "");

  if (!code || !phone) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ Mã đặt lịch và Số điện thoại" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      customer: { select: { fullName: true, phone: true, email: true } },
      doctor: { select: { id: true, fullName: true, title: true } },
      pets: {
        include: {
          pet: { select: { name: true, species: true, breed: true } },
          services: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Không tìm thấy phiếu đặt lịch với mã này" },
      { status: 404 }
    );
  }

  const storedPhone = (
    booking.isGuest ? booking.guestPhone : booking.customer?.phone
  )?.replace(/\s+/g, "");

  if (!storedPhone || storedPhone !== phone) {
    return NextResponse.json(
      { error: "Số điện thoại không khớp với phiếu đặt lịch" },
      { status: 403 }
    );
  }

  return NextResponse.json({ booking });
}
