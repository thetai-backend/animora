import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền truy cập" }, { status: 403 });
  }

  const [medicalRecords, invoices] = await Promise.all([
    prisma.medicalRecord.findMany({
      include: {
        doctor: { select: { fullName: true } },
        customer: { select: { fullName: true, phone: true } },
        pet: { select: { name: true, species: true, breed: true } },
        addendums: { orderBy: { createdAt: "asc" } },
        invoice: { select: { invoiceCode: true, status: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      include: {
        customer: { select: { fullName: true, phone: true } },
        doctor: { select: { fullName: true } },
        cashier: { select: { fullName: true } },
        items: true,
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ medicalRecords, invoices });
}
