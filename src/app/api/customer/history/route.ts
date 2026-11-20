import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const [bookings, medicalRecords] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: session.userId },
      include: {
        doctor: { select: { id: true, fullName: true, title: true } },
        pets: {
          include: {
            pet: { select: { id: true, name: true, species: true, breed: true } },
            services: true,
          },
        },
      },
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
    }),
    prisma.medicalRecord.findMany({
      where: { customerId: session.userId },
      include: {
        doctor: { select: { id: true, fullName: true, title: true } },
        pet: { select: { id: true, name: true, species: true, breed: true } },
        addendums: { orderBy: { createdAt: "asc" } },
        invoice: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ bookings, medicalRecords });
}
