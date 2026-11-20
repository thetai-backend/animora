import { prisma } from "@/lib/prisma";

export function isExpiringWithin30Days(expiryDate: Date | string): boolean {
  const exp = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const diffDays = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const exp = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  return Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Cơ chế trừ kho FEFO (First Expired, First Out) - Rule 10:
 * - Ưu tiên trừ các lô còn hàng có expiryDate gần nhất trước.
 * - Nếu tồn kho = 0 hoặc không đủ, VẪN CHO PHÉP trừ (tồn kho âm tạm thời) và trả về cảnh báo.
 */
export async function deductStockFEFO(params: {
  productId: string;
  quantity: number;
  type: "SALE_DEDUCT" | "INTERNAL_USE";
  referenceId: string;
  note: string;
  actorId?: string;
  actorName?: string;
}): Promise<{ wentNegative: boolean; newStockQuantity: number }> {
  const { productId, quantity, type, referenceId, note, actorId, actorName } = params;
  if (quantity <= 0) {
    const p = await prisma.product.findUnique({ where: { id: productId } });
    return { wentNegative: false, newStockQuantity: p?.stockQuantity ?? 0 };
  }

  let remainingToDeduct = quantity;

  // Lấy các lô còn hàng theo hạn sử dụng gần nhất (FEFO)
  const batches = await prisma.inventoryBatch.findMany({
    where: {
      productId,
      remainingQuantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
  });

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;
    const take = Math.min(batch.remainingQuantity, remainingToDeduct);

    await prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: { remainingQuantity: { decrement: take } },
    });

    await prisma.stockTransaction.create({
      data: {
        productId,
        batchId: batch.id,
        type,
        quantityChange: -take,
        referenceId,
        note: `${note} (Lô ${batch.batchNumber})`,
        createdById: actorId,
        createdByName: actorName,
      },
    });

    remainingToDeduct -= take;
  }

  // Nếu vẫn còn thiếu (tồn kho = 0 / bán âm tạm thời) -> ghi nhận giao dịch tồn âm
  if (remainingToDeduct > 0) {
    await prisma.stockTransaction.create({
      data: {
        productId,
        batchId: null,
        type,
        quantityChange: -remainingToDeduct,
        referenceId,
        note: `${note} [CẢNH BÁO: Xuất vượt tồn kho hệ thống - tồn âm tạm thời]`,
        createdById: actorId,
        createdByName: actorName,
      },
    });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: quantity } },
  });

  return {
    wentNegative: updatedProduct.stockQuantity < 0 || remainingToDeduct > 0,
    newStockQuantity: updatedProduct.stockQuantity,
  };
}
