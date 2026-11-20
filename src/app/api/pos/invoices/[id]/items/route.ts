import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Rule 8: Chỉnh sửa linh hoạt tại quầy (Có lưu vết Audit Log):
 * - Gộp thêm sản phẩm bán lẻ Shop vào chung hóa đơn khám.
 * - Bỏ bớt hoặc sửa số lượng thuốc -> BẮT BUỘC ghi nhận vào InvoiceAuditLog.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền chỉnh sửa hóa đơn" }, { status: 403 });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });
  }
  if (invoice.status !== "PENDING") {
    return NextResponse.json({ error: "Chỉ có thể sửa hóa đơn đang chờ thanh toán" }, { status: 400 });
  }

  const body = await request.json();
  const action = String(body.action || "");

  if (action === "ADD_SHOP_PRODUCT") {
    const productId = String(body.productId || "");
    const quantity = Math.max(1, Number(body.quantity) || 1);
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    const existingItem = invoice.items.find(
      (i) => i.productId === prod.id && i.itemType === "SHOP_PRODUCT"
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await prisma.invoiceItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, totalPrice: newQty * existingItem.unitPrice },
      });
    } else {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          itemType: "SHOP_PRODUCT",
          productId: prod.id,
          name: prod.name,
          category: "SHOP",
          unit: prod.retailUnit,
          quantity,
          unitPrice: prod.price,
          totalPrice: prod.price * quantity,
          addedByRole: "RECEPTIONIST",
        },
      });
    }

    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: invoice.id,
        actorId: session.userId,
        actorName: session.fullName,
        action: "Gộp thêm hàng Shop",
        itemName: prod.name,
        detail: `Gộp thêm ${quantity} ${prod.retailUnit} vào hóa đơn tại quầy`,
      },
    });
  } else if (action === "UPDATE_QTY") {
    const itemId = String(body.itemId || "");
    const newQty = Number(body.quantity);
    const targetItem = invoice.items.find((i) => i.id === itemId);
    if (!targetItem) {
      return NextResponse.json({ error: "Không tìm thấy dòng hóa đơn" }, { status: 404 });
    }

    if (newQty <= 0) {
      await prisma.invoiceItem.delete({ where: { id: targetItem.id } });
      await prisma.invoiceAuditLog.create({
        data: {
          invoiceId: invoice.id,
          actorId: session.userId,
          actorName: session.fullName,
          action:
            targetItem.itemType === "MEDICINE"
              ? "Bỏ thuốc theo yêu cầu khách"
              : "Xóa mục khỏi hóa đơn",
          itemName: targetItem.name,
          detail: `Đã bỏ ${targetItem.quantity} ${targetItem.unit} (trước đó: ${targetItem.quantity})`,
        },
      });
    } else {
      await prisma.invoiceItem.update({
        where: { id: targetItem.id },
        data: {
          quantity: newQty,
          totalPrice: newQty * targetItem.unitPrice,
        },
      });
      await prisma.invoiceAuditLog.create({
        data: {
          invoiceId: invoice.id,
          actorId: session.userId,
          actorName: session.fullName,
          action:
            targetItem.itemType === "MEDICINE"
              ? "Điều chỉnh số lượng thuốc"
              : "Sửa số lượng sản phẩm",
          itemName: targetItem.name,
          detail: `Đổi số lượng từ ${targetItem.quantity} → ${newQty} ${targetItem.unit}`,
        },
      });
    }
  } else if (action === "REMOVE_ITEM") {
    const itemId = String(body.itemId || "");
    const targetItem = invoice.items.find((i) => i.id === itemId);
    if (!targetItem) {
      return NextResponse.json({ error: "Không tìm thấy dòng hóa đơn" }, { status: 404 });
    }
    await prisma.invoiceItem.delete({ where: { id: targetItem.id } });
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: invoice.id,
        actorId: session.userId,
        actorName: session.fullName,
        action:
          targetItem.itemType === "MEDICINE"
            ? "Bỏ bớt thuốc tại quầy"
            : "Xóa mục khỏi hóa đơn",
        itemName: targetItem.name,
        detail: `Xóa ${targetItem.quantity} ${targetItem.unit} (${targetItem.name})`,
      },
    });
  }

  // Cập nhật lại subtotal của hóa đơn
  const refreshedItems = await prisma.invoiceItem.findMany({
    where: { invoiceId: invoice.id },
  });
  const subtotal = refreshedItems.reduce((s, i) => s + i.totalPrice, 0);

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { subtotal, totalAmount: subtotal },
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      doctor: { select: { id: true, fullName: true } },
      items: {
        include: { product: { select: { id: true, stockQuantity: true, retailUnit: true } } },
      },
      auditLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ invoice: updated });
}
