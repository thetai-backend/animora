import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { daysUntilExpiry, isExpiringWithin30Days } from "@/lib/inventory-utils";

export async function GET() {
  const session = await getSession();
  if (!session || !["MANAGER", "DOCTOR", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập kho" }, { status: 403 });
  }

  const [products, batches, transactions, internalSlips, disposalSlips] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: { remainingQuantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    }),
    prisma.inventoryBatch.findMany({
      where: { remainingQuantity: { gt: 0 } },
      include: {
        product: {
          select: { id: true, sku: true, name: true, group: true, retailUnit: true },
        },
      },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.stockTransaction.findMany({
      include: {
        product: { select: { sku: true, name: true, retailUnit: true } },
        batch: { select: { batchNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.internalUsageSlip.findMany({
      include: {
        product: { select: { sku: true, name: true, retailUnit: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.disposalSlip.findMany({
      include: {
        product: { select: { sku: true, name: true, retailUnit: true } },
        batch: { select: { batchNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const enrichedBatches = batches.map((b) => ({
    ...b,
    daysLeft: daysUntilExpiry(b.expiryDate),
    expiringSoon: isExpiringWithin30Days(b.expiryDate),
  }));

  const expiringBatches = enrichedBatches.filter((b) => b.expiringSoon);

  return NextResponse.json({
    products,
    batches: enrichedBatches,
    expiringBatches,
    transactions,
    internalSlips,
    disposalSlips,
  });
}
