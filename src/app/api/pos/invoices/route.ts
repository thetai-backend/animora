import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập Thu ngân POS" }, { status: 403 });
  }

  const now = new Date();
  const [pendingInvoices, paidInvoices, promotions, products, settings] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "PENDING" },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true } },
        medicalRecord: { select: { id: true, recordCode: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, stockQuantity: true, retailUnit: true, group: true } },
          },
        },
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID" },
      include: {
        customer: { select: { fullName: true, phone: true } },
        doctor: { select: { fullName: true } },
        cashier: { select: { fullName: true } },
        medicalRecord: { select: { id: true, recordCode: true, status: true } },
        items: true,
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { paidAt: "desc" },
      take: 40,
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, group: { in: ["SHOP", "MEDICINE", "SHARED"] } },
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        group: true,
        category: true,
        price: true,
        retailUnit: true,
        stockQuantity: true,
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    }),
    prisma.clinicSettings.findUnique({
      where: { id: "default" },
      select: {
        clinicName: true,
        address: true,
        phone: true,
        bankCode: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    }),
  ]);

  return NextResponse.json({
    pendingInvoices,
    paidInvoices,
    promotions,
    products,
    bankInfo: {
      bankCode: settings?.bankCode || "MB",
      bankAccountNumber: settings?.bankAccountNumber || "08889992468",
      bankAccountName: settings?.bankAccountName || "PHONG KHAM THU Y ANIMORA",
    },
  });
}
