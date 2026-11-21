import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền nhập lô hàng mới" }, { status: 403 });
  }

  const body = await request.json();
  const productId = String(body.productId || "");
  const batchNumber = String(body.batchNumber || "").trim().toUpperCase();
  const expiryDateStr = String(body.expiryDate || "").trim();
  const importedPackages = Math.max(1, Number(body.importedPackages) || 0);
  const importNote = body.importNote ? String(body.importNote).trim() : null;

  if (!productId || !batchNumber || !expiryDateStr || importedPackages <= 0) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ Sản phẩm, Số lô, Hạn sử dụng và Số lượng đơn vị lớn" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm trong kho" }, { status: 404 });
  }

  // Tự động quy đổi từ đơn vị lớn (Hộp/Chai/Thùng) sang đơn vị nhỏ nhất (Viên/ml/Liều/Gói)
  const conversionRate = Math.max(1, product.conversionRate);
  const convertedRetailQty = importedPackages * conversionRate;

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryBatch.create({
      data: {
        productId: product.id,
        batchNumber,
        expiryDate: new Date(expiryDateStr),
        importedPackages,
        conversionRate,
        initialQuantity: convertedRetailQty,
        remainingQuantity: convertedRetailQty,
        importNote,
        createdById: session.userId,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: { increment: convertedRetailQty } },
    });

    await tx.stockTransaction.create({
      data: {
        productId: product.id,
        batchId: created.id,
        type: "IMPORT",
        quantityChange: convertedRetailQty,
        referenceId: created.id,
        note: `Nhập ${importedPackages} ${product.importUnit} (quy đổi ${convertedRetailQty} ${product.retailUnit}) — Lô ${batchNumber}`,
        createdById: session.userId,
        createdByName: session.fullName,
      },
    });

    return created;
  });

  return NextResponse.json(
    {
      batch,
      message: `Đã nhập kho ${importedPackages} ${product.importUnit} = ${convertedRetailQty} ${product.retailUnit} (Lô ${batchNumber}).`,
    },
    { status: 201 }
  );
}
