import { Prisma } from ".prisma/client-animora";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export function isExpiringWithin30Days(expiryDate: Date | string): boolean {
  const exp = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const diffDays = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const exp = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  return Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export interface DeductedBatchDetail {
  batchId: string | null;
  batchNumber: string | null;
  quantity: number;
}

/**
 * Cơ chế trừ kho FEFO (First Expired, First Out) - Rule 10:
 * - Ưu tiên trừ các lô còn hàng có expiryDate gần nhất trước.
 * - Hỗ trợ chạy trong Prisma Transaction (tx) để đảm bảo tính nguyên tử.
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
  tx?: DbClient;
}): Promise<{
  wentNegative: boolean;
  newStockQuantity: number;
  deductedBatches: DeductedBatchDetail[];
}> {
  const { productId, quantity, type, referenceId, note, actorId, actorName } = params;
  const db: DbClient = params.tx ?? prisma;

  if (quantity <= 0) {
    const p = await db.product.findUnique({ where: { id: productId } });
    return { wentNegative: false, newStockQuantity: p?.stockQuantity ?? 0, deductedBatches: [] };
  }

  let remainingToDeduct = quantity;
  const deductedBatches: DeductedBatchDetail[] = [];

  // Lấy các lô còn hàng theo hạn sử dụng gần nhất (FEFO)
  const batches = await db.inventoryBatch.findMany({
    where: {
      productId,
      remainingQuantity: { gt: 0 },
    },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
  });

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;
    const take = Math.min(batch.remainingQuantity, remainingToDeduct);

    await db.inventoryBatch.update({
      where: { id: batch.id },
      data: { remainingQuantity: { decrement: take } },
    });

    await db.stockTransaction.create({
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

    deductedBatches.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: take,
    });

    remainingToDeduct -= take;
  }

  // Nếu vẫn còn thiếu (tồn kho = 0 / bán âm tạm thời) -> ghi nhận giao dịch tồn âm
  if (remainingToDeduct > 0) {
    await db.stockTransaction.create({
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

    deductedBatches.push({
      batchId: null,
      batchNumber: null,
      quantity: remainingToDeduct,
    });
  }

  const updatedProduct = await db.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: quantity } },
  });

  return {
    wentNegative: updatedProduct.stockQuantity < 0 || remainingToDeduct > 0,
    newStockQuantity: updatedProduct.stockQuantity,
    deductedBatches,
  };
}

/**
 * Hoàn kho chuẩn xác về đúng các lô hàng đã trừ FEFO khi Quản lý Hủy toàn bộ hóa đơn (Rule 11).
 * Tự động trừ phần đã hoàn trả trước đó (nếu từng có trả hàng Shop từng phần) để không bao giờ cộng thừa.
 */
export async function restoreStockFromInvoiceCancel(params: {
  invoiceId: string;
  invoiceCode: string;
  reason: string;
  actorId: string;
  actorName: string;
  tx?: DbClient;
}): Promise<{ restoredCount: number; restoredDetails: string[] }> {
  const { invoiceId, invoiceCode, reason, actorId, actorName } = params;
  const db: DbClient = params.tx ?? prisma;

  const [saleTxs, prevReturnTxs] = await Promise.all([
    db.stockTransaction.findMany({
      where: { referenceId: invoiceId, type: "SALE_DEDUCT" },
      include: {
        product: { select: { id: true, name: true, retailUnit: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.stockTransaction.findMany({
      where: { referenceId: invoiceId, type: "RETURN" },
      select: { productId: true, batchId: true, quantityChange: true },
    }),
  ]);

  // Tính số lượng đã hoàn trước đó theo từng (productId, batchId)
  const returnedMap = new Map<string, number>();
  for (const r of prevReturnTxs) {
    const key = `${r.productId}::${r.batchId || "NONE"}`;
    returnedMap.set(key, (returnedMap.get(key) || 0) + Math.abs(r.quantityChange));
  }

  const restoredDetails: string[] = [];
  let restoredCount = 0;

  for (const txRow of saleTxs) {
    const deductedQty = Math.abs(txRow.quantityChange);
    const key = `${txRow.productId}::${txRow.batchId || "NONE"}`;
    const alreadyReturned = returnedMap.get(key) || 0;
    const consumeFromReturned = Math.min(deductedQty, alreadyReturned);
    returnedMap.set(key, alreadyReturned - consumeFromReturned);

    const qtyToRestore = deductedQty - consumeFromReturned;
    if (qtyToRestore <= 0) continue;

    if (txRow.batchId) {
      const batch = await db.inventoryBatch.findUnique({ where: { id: txRow.batchId } });
      if (batch) {
        await db.inventoryBatch.update({
          where: { id: batch.id },
          data: { remainingQuantity: { increment: qtyToRestore } },
        });
      }
    }

    await db.product.update({
      where: { id: txRow.productId },
      data: { stockQuantity: { increment: qtyToRestore } },
    });

    await db.stockTransaction.create({
      data: {
        productId: txRow.productId,
        batchId: txRow.batchId,
        type: "RETURN",
        quantityChange: qtyToRestore,
        referenceId: invoiceId,
        note: `Hoàn kho hủy hóa đơn ${invoiceCode}${
          txRow.batch ? ` (Lô ${txRow.batch.batchNumber})` : " (Bù tồn âm)"
        } — Lý do: ${reason}`,
        createdById: actorId,
        createdByName: actorName,
      },
    });

    restoredCount += qtyToRestore;
    restoredDetails.push(
      `+${qtyToRestore} ${txRow.product.retailUnit} ${txRow.product.name}${
        txRow.batch ? ` (Lô ${txRow.batch.batchNumber})` : ""
      }`
    );
  }

  return { restoredCount, restoredDetails };
}

/**
 * Hoàn kho chuẩn xác cho chế độ "Khách trả lại sản phẩm Shop cụ thể trong hóa đơn" (Rule 11).
 * Đọc lại đúng các dòng StockTransaction xuất FEFO của sản phẩm đó trong hóa đơn để cộng trả về đúng lô ban đầu.
 */
export async function restoreStockForPartialReturn(params: {
  invoiceId: string;
  invoiceCode: string;
  productId: string;
  quantity: number;
  reason: string;
  actorId: string;
  actorName: string;
  tx: DbClient;
}): Promise<{ restoredCount: number; restoredDetails: string[] }> {
  const { invoiceId, invoiceCode, productId, quantity, reason, actorId, actorName, tx: db } = params;
  if (quantity <= 0) return { restoredCount: 0, restoredDetails: [] };

  const [saleTxs, prevReturnTxs, product] = await Promise.all([
    db.stockTransaction.findMany({
      where: { referenceId: invoiceId, productId, type: "SALE_DEDUCT" },
      include: { batch: { select: { id: true, batchNumber: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.stockTransaction.findMany({
      where: { referenceId: invoiceId, productId, type: "RETURN" },
      select: { batchId: true, quantityChange: true },
    }),
    db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, retailUnit: true },
    }),
  ]);

  if (!product) return { restoredCount: 0, restoredDetails: [] };

  const alreadyReturnedByBatch = new Map<string, number>();
  for (const r of prevReturnTxs) {
    const k = r.batchId || "NONE";
    alreadyReturnedByBatch.set(k, (alreadyReturnedByBatch.get(k) || 0) + Math.abs(r.quantityChange));
  }

  let remainingToRestore = quantity;
  const restoredDetails: string[] = [];
  let restoredCount = 0;

  for (const txRow of saleTxs) {
    if (remainingToRestore <= 0) break;
    const deducted = Math.abs(txRow.quantityChange);
    const k = txRow.batchId || "NONE";
    const already = alreadyReturnedByBatch.get(k) || 0;
    const used = Math.min(deducted, already);
    alreadyReturnedByBatch.set(k, already - used);

    const availableFromTx = deducted - used;
    if (availableFromTx <= 0) continue;

    const restoreNow = Math.min(availableFromTx, remainingToRestore);

    if (txRow.batchId) {
      const batch = await db.inventoryBatch.findUnique({ where: { id: txRow.batchId } });
      if (batch) {
        await db.inventoryBatch.update({
          where: { id: batch.id },
          data: { remainingQuantity: { increment: restoreNow } },
        });
      }
    }

    await db.stockTransaction.create({
      data: {
        productId,
        batchId: txRow.batchId,
        type: "RETURN",
        quantityChange: restoreNow,
        referenceId: invoiceId,
        note: `Hoàn kho trả hàng Shop HĐ ${invoiceCode}${
          txRow.batch ? ` (Lô ${txRow.batch.batchNumber})` : " (Bù tồn âm)"
        } — Lý do: ${reason}`,
        createdById: actorId,
        createdByName: actorName,
      },
    });

    restoredCount += restoreNow;
    remainingToRestore -= restoreNow;
    restoredDetails.push(
      `+${restoreNow} ${product.retailUnit} ${product.name}${
        txRow.batch ? ` (Lô ${txRow.batch.batchNumber})` : ""
      }`
    );
  }

  // Fallback nếu hóa đơn cũ không có dòng SALE_DEDUCT (dữ liệu seed cũ)
  if (remainingToRestore > 0) {
    await db.stockTransaction.create({
      data: {
        productId,
        batchId: null,
        type: "RETURN",
        quantityChange: remainingToRestore,
        referenceId: invoiceId,
        note: `Hoàn kho trả hàng Shop HĐ ${invoiceCode} — Lý do: ${reason}`,
        createdById: actorId,
        createdByName: actorName,
      },
    });
    restoredCount += remainingToRestore;
    restoredDetails.push(`+${remainingToRestore} ${product.retailUnit} ${product.name}`);
  }

  if (restoredCount > 0) {
    await db.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: restoredCount } },
    });
  }

  return { restoredCount, restoredDetails };
}
