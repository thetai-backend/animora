import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền truy cập" }, { status: 403 });
  }

  const [medicalRecords, invoices, auditLogs, customers, pets, notificationLogs] = await Promise.all([
    prisma.medicalRecord.findMany({
      include: {
        doctor: { select: { id: true, fullName: true, title: true } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        pet: { select: { id: true, name: true, species: true, breed: true, status: true } },
        addendums: { orderBy: { createdAt: "asc" } },
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            status: true,
            totalAmount: true,
            refundedAmount: true,
            paymentMethod: true,
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.invoice.findMany({
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true } },
        cashier: { select: { id: true, fullName: true } },
        medicalRecord: { select: { id: true, recordCode: true, status: true } },
        items: true,
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.invoiceAuditLog.findMany({
      include: {
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            status: true,
            guestName: true,
            customer: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        pets: {
          select: { id: true, name: true, species: true, breed: true, status: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            pets: true,
            customerBookings: true,
            customerInvoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pet.findMany({
      include: {
        owner: { select: { id: true, fullName: true, phone: true, email: true } },
        _count: { select: { medicalRecords: true, bookingPets: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    medicalRecords,
    invoices,
    auditLogs,
    customers,
    pets,
    notificationLogs,
  });
}
