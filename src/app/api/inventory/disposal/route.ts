import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Chỉ Quản lý mới có quyền lập Phiếu xuất hủy / Điều chỉnh kiểm kê" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const type = body.type === "ADJUSTMENT" ? "ADJUSTMENT" : "DISPOSAL";
  const productId = String(body.productId || "");
  const batchId = body.batchId ? String(body.batchId) : null;
  const rawQuantity = Number(body.quantityChange);
  const reason = String(body.reason || "").trim();

  if (!productId || !Number.isFinite(rawQuantity) || rawQuantity === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn sản phẩm và nhập số lượng điều chỉnh khác 0" },
      { status: 400 }
    );
  }

  if (!reason) {
    return NextResponse.json(
      { error: "Bắt buộc nhập lý do xuất hủy hoặc điều chỉnh kiểm kê" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
  }

  // Xuất hủy luôn là số âm
  const quantityChange = type === "DISPOSAL" ? -Math.abs(rawQuantity) : rawQuantity;
  const slipCode = generateShortCode(type === "DISPOSAL" ? "XH" : "KK");

  if (batchId) {
    const batchCheck = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (!batchCheck || batchCheck.productId !== product.id) {
      return NextResponse.json({ error: "Không tìm thấy lô hàng hợp lệ" }, { status: 404 });
    }
    if (batchCheck.remainingQuantity + quantityChange < 0) {
      return NextResponse.json(
        {
          error: `Lô ${batchCheck.batchNumber} chỉ còn ${batchCheck.remainingQuantity} ${product.retailUnit}, không thể trừ ${Math.abs(quantityChange)} ${product.retailUnit}.`,
        },
        { status: 400 }
      );
    }
  }

  const { slip, targetBatchNumber } = await prisma.$transaction(async (tx) => {
    let targetBatchId = batchId;
    let batchNum: string | null = null;

    if (targetBatchId) {
      const batch = await tx.inventoryBatch.findUnique({ where: { id: targetBatchId } });
      if (batch) {
        batchNum = batch.batchNumber;
        await tx.inventoryBatch.update({
          where: { id: targetBatchId },
          data: { remainingQuantity: { increment: quantityChange } },
        });
      } else {
        targetBatchId = null;
      }
    } else if (quantityChange < 0) {
      // Nếu không chọn lô cụ thể khi xuất hủy/giảm -> trừ theo lô gần hết hạn nhất (FEFO)
      let left = Math.abs(quantityChange);
      const batches = await tx.inventoryBatch.findMany({
        where: { productId: product.id, remainingQuantity: { gt: 0 } },
        orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
      });
      for (const b of batches) {
        if (left <= 0) break;
        const take = Math.min(b.remainingQuantity, left);
        await tx.inventoryBatch.update({
          where: { id: b.id },
          data: { remainingQuantity: { decrement: take } },
        });
        if (!targetBatchId) {
          targetBatchId = b.id;
          batchNum = b.batchNumber;
        }
        left -= take;
      }
    } else if (quantityChange > 0) {
      // Điều chỉnh tăng mà không chọn lô -> cộng vào lô mới nhất nếu có
      const latestBatch = await tx.inventoryBatch.findFirst({
        where: { productId: product.id },
        orderBy: { expiryDate: "desc" },
      });
      if (latestBatch) {
        targetBatchId = latestBatch.id;
        batchNum = latestBatch.batchNumber;
        await tx.inventoryBatch.update({
          where: { id: latestBatch.id },
          data: { remainingQuantity: { increment: quantityChange } },
        });
      }
    }

    const createdSlip = await tx.disposalSlip.create({
      data: {
        slipCode,
        type,
        productId: product.id,
        batchId: targetBatchId,
        quantityChange,
        reason,
        createdById: session.userId,
        createdByName: session.fullName,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: { increment: quantityChange } },
    });

    await tx.stockTransaction.create({
      data: {
        productId: product.id,
        batchId: targetBatchId,
        type,
        quantityChange,
        referenceId: createdSlip.id,
        note: `${type === "DISPOSAL" ? "Xuất hủy" : "Điều chỉnh kiểm kê"} ${slipCode}${
          batchNum ? ` (Lô ${batchNum})` : ""
        }: ${reason}`,
        createdById: session.userId,
        createdByName: session.fullName,
      },
    });

    return { slip: createdSlip, targetBatchNumber: batchNum };
  });

  return NextResponse.json(
    {
      slip,
      message: `Đã lập phiếu ${slipCode} (${quantityChange > 0 ? `+${quantityChange}` : quantityChange} ${product.retailUnit}${
        targetBatchNumber ? `, Lô ${targetBatchNumber}` : ""
      }).`,
    },
    { status: 201 }
  );
}
