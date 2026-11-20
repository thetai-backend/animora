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

  const slip = await prisma.disposalSlip.create({
    data: {
      slipCode,
      type,
      productId: product.id,
      batchId,
      quantityChange,
      reason,
      createdById: session.userId,
      createdByName: session.fullName,
    },
  });

  if (batchId) {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (batch) {
      await prisma.inventoryBatch.update({
        where: { id: batchId },
        data: { remainingQuantity: Math.max(0, batch.remainingQuantity + quantityChange) },
      });
    }
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { stockQuantity: { increment: quantityChange } },
  });

  await prisma.stockTransaction.create({
    data: {
      productId: product.id,
      batchId,
      type,
      quantityChange,
      referenceId: slip.id,
      note: `${type === "DISPOSAL" ? "Xuất hủy" : "Điều chỉnh kiểm kê"} ${slipCode}: ${reason}`,
      createdById: session.userId,
      createdByName: session.fullName,
    },
  });

  return NextResponse.json(
    {
      slip,
      message: `Đã lập phiếu ${slipCode} (${quantityChange > 0 ? `+${quantityChange}` : quantityChange} ${product.retailUnit}).`,
    },
    { status: 201 }
  );
}
