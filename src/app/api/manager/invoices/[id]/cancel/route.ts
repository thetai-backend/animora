import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  restoreStockForPartialReturn,
  restoreStockFromInvoiceCancel,
} from "@/lib/inventory-utils";

/**
 * ĐỘC QUYỀN QUẢN LÝ (Rule 11):
 * Hỗ trợ 2 chế độ nguyên tử trong 1 Prisma Transaction:
 * 1) FULL_CANCEL: Hủy toàn bộ hóa đơn -> hoàn trả 100% tồn kho về đúng các lô FEFO cũ, trừ toàn bộ doanh thu.
 * 2) PARTIAL_SHOP_RETURN: Khách trả lại sản phẩm Shop cụ thể -> hoàn trả đúng số lượng về đúng lô FEFO cũ,
 *    cập nhật returnedQuantity, refundedAmount và trừ đúng số tiền hoàn khỏi Báo cáo doanh thu & Chốt ca.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Chỉ duy nhất Quản lý mới có quyền Hủy hóa đơn / Trả hàng Shop" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const reason = String(body.reason || "").trim();
  const mode =
    body.mode === "PARTIAL_SHOP_RETURN" ? "PARTIAL_SHOP_RETURN" : "FULL_CANCEL";
  const returnItemsInput: { invoiceItemId: string; quantity: number }[] = Array.isArray(
    body.returnItems
  )
    ? body.returnItems.map((r: { invoiceItemId?: unknown; quantity?: unknown }) => ({
        invoiceItemId: String(r.invoiceItemId || ""),
        quantity: Math.max(0, Math.floor(Number(r.quantity) || 0)),
      }))
    : [];

  if (!reason) {
    return NextResponse.json(
      { error: "Bắt buộc nhập lý do hủy hóa đơn / trả hàng Shop" },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });
  }
  if (invoice.status === "CANCELLED") {
    return NextResponse.json({ error: "Hóa đơn này đã bị hủy toàn bộ trước đó" }, { status: 400 });
  }

  if (mode === "PARTIAL_SHOP_RETURN") {
    if (!["PAID", "PARTIALLY_RETURNED"].includes(invoice.status)) {
      return NextResponse.json(
        { error: "Chỉ có thể trả hàng Shop cho hóa đơn đã thanh toán" },
        { status: 400 }
      );
    }
    const validSelections = returnItemsInput.filter((r) => r.invoiceItemId && r.quantity > 0);
    if (validSelections.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất 1 sản phẩm Shop và số lượng cần trả lại" },
        { status: 400 }
      );
    }

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        const fresh = await tx.invoice.findUnique({
          where: { id: invoice.id },
          include: { items: true },
        });
        if (!fresh || !["PAID", "PARTIALLY_RETURNED"].includes(fresh.status)) {
          throw new Error("INVALID_STATUS");
        }

        const grossTotal = fresh.items.reduce((s, i) => s + i.totalPrice, 0);
        const netRatio = grossTotal > 0 ? fresh.totalAmount / grossTotal : 1;

        let totalRestoredCount = 0;
        const allRestoredDetails: string[] = [];
        let refundDelta = 0;
        const returnedItemSummaries: string[] = [];

        for (const sel of validSelections) {
          const item = fresh.items.find((i) => i.id === sel.invoiceItemId);
          if (!item) {
            throw new Error("ITEM_NOT_FOUND");
          }
          const isReturnableShop =
            item.itemType === "SHOP_PRODUCT" || item.category === "SHOP";
          if (!isReturnableShop) {
            throw new Error(`ITEM_NOT_SHOP:${item.name}`);
          }
          const maxReturnable = item.quantity - item.returnedQuantity;
          if (sel.quantity > maxReturnable) {
            throw new Error(`EXCEED_QTY:${item.name}`);
          }

          if (item.productId) {
            const res = await restoreStockForPartialReturn({
              invoiceId: fresh.id,
              invoiceCode: fresh.invoiceCode,
              productId: item.productId,
              quantity: sel.quantity,
              reason,
              actorId: session.userId,
              actorName: session.fullName,
              tx,
            });
            totalRestoredCount += res.restoredCount;
            allRestoredDetails.push(...res.restoredDetails);
          }

          await tx.invoiceItem.update({
            where: { id: item.id },
            data: { returnedQuantity: { increment: sel.quantity } },
          });

          const itemGrossRefund = item.unitPrice * sel.quantity;
          refundDelta += Math.round(itemGrossRefund * netRatio);
          returnedItemSummaries.push(`${item.name} (×${sel.quantity} ${item.unit})`);
        }

        const remainingRefundable = Math.max(0, fresh.totalAmount - fresh.refundedAmount);
        const appliedRefund = Math.min(remainingRefundable, refundDelta);
        const nextRefundedAmount = fresh.refundedAmount + appliedRefund;

        const nextReason = fresh.cancelReason
          ? `${fresh.cancelReason} | Trả hàng Shop: ${reason}`
          : `Trả hàng Shop: ${reason}`;

        const updated = await tx.invoice.update({
          where: { id: fresh.id },
          data: {
            status: "PARTIALLY_RETURNED",
            refundedAmount: nextRefundedAmount,
            cancelReason: nextReason,
          },
          include: {
            customer: { select: { fullName: true, phone: true } },
            doctor: { select: { fullName: true } },
            cashier: { select: { fullName: true } },
            medicalRecord: { select: { id: true, recordCode: true, status: true } },
            items: true,
            auditLogs: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.invoiceAuditLog.create({
          data: {
            invoiceId: fresh.id,
            actorId: session.userId,
            actorName: session.fullName,
            action: "Quản lý Hoàn trả Sản phẩm Shop",
            itemName: returnedItemSummaries.join(", "),
            detail: `Hoàn tiền ${appliedRefund.toLocaleString("vi-VN")}đ | Lý do: ${reason}${
              allRestoredDetails.length > 0
                ? ` | Hoàn kho FEFO: ${allRestoredDetails.join(", ")}`
                : ""
            }`,
          },
        });

        return {
          updated,
          appliedRefund,
          restoredCount: totalRestoredCount,
          restoredDetails: allRestoredDetails,
        };
      });

      return NextResponse.json({
        invoice: txResult.updated,
        refundedDelta: txResult.appliedRefund,
        restoredCount: txResult.restoredCount,
        restoredDetails: txResult.restoredDetails,
        message: `Đã xử lý trả hàng Shop cho hóa đơn ${invoice.invoiceCode}, hoàn ${txResult.restoredCount} đơn vị về đúng lô FEFO và giảm ${txResult.appliedRefund.toLocaleString(
          "vi-VN"
        )}đ doanh thu!`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("ITEM_NOT_SHOP:")) {
        return NextResponse.json(
          { error: `"${msg.split(":")[1]}" không phải sản phẩm Shop để trả lẻ` },
          { status: 400 }
        );
      }
      if (msg.startsWith("EXCEED_QTY:")) {
        return NextResponse.json(
          { error: `Số lượng trả vượt quá số lượng còn lại của "${msg.split(":")[1]}"` },
          { status: 400 }
        );
      }
      console.error("Partial return error:", err);
      return NextResponse.json(
        { error: "Không thể xử lý trả hàng Shop. Vui lòng thử lại." },
        { status: 400 }
      );
    }
  }

  // CHẾ ĐỘ 1: HỦY TOÀN BỘ HÓA ĐƠN (ATOMIC TRANSACTION)
  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const fresh = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });
      if (!fresh || fresh.status === "CANCELLED") {
        throw new Error("ALREADY_CANCELLED");
      }

      let restoreResult = { restoredCount: 0, restoredDetails: [] as string[] };
      if (fresh.status === "PAID" || fresh.status === "PARTIALLY_RETURNED") {
        restoreResult = await restoreStockFromInvoiceCancel({
          invoiceId: fresh.id,
          invoiceCode: fresh.invoiceCode,
          reason,
          actorId: session.userId,
          actorName: session.fullName,
          tx,
        });
      }

      // Đánh dấu toàn bộ sản phẩm thuốc/shop trong hóa đơn là đã hoàn
      for (const item of fresh.items) {
        if (item.productId && item.returnedQuantity < item.quantity) {
          await tx.invoiceItem.update({
            where: { id: item.id },
            data: { returnedQuantity: item.quantity },
          });
        }
      }

      const cancelledAt = new Date();
      const updated = await tx.invoice.update({
        where: { id: fresh.id },
        data: {
          status: "CANCELLED",
          refundedAmount: fresh.totalAmount,
          cancelledAt,
          cancelReason: reason,
        },
        include: {
          customer: { select: { fullName: true, phone: true } },
          doctor: { select: { fullName: true } },
          cashier: { select: { fullName: true } },
          medicalRecord: { select: { id: true, recordCode: true, status: true } },
          items: true,
          auditLogs: { orderBy: { createdAt: "desc" } },
        },
      });

      await tx.invoiceAuditLog.create({
        data: {
          invoiceId: fresh.id,
          actorId: session.userId,
          actorName: session.fullName,
          action: "Quản lý Hủy toàn bộ hóa đơn",
          itemName: fresh.invoiceCode,
          detail: `Lý do: ${reason}${
            restoreResult.restoredDetails.length > 0
              ? ` | Hoàn kho FEFO: ${restoreResult.restoredDetails.join(", ")}`
              : ""
          }`,
        },
      });

      return { updated, restoreResult };
    });

    return NextResponse.json({
      invoice: txResult.updated,
      restoredCount: txResult.restoreResult.restoredCount,
      restoredDetails: txResult.restoreResult.restoredDetails,
      message:
        txResult.restoreResult.restoredCount > 0
          ? `Đã hủy toàn bộ hóa đơn ${invoice.invoiceCode}, hoàn trả ${txResult.restoreResult.restoredCount} đơn vị về đúng lô kho FEFO và trừ khỏi Báo cáo doanh thu!`
          : `Đã hủy toàn bộ hóa đơn ${invoice.invoiceCode} và cập nhật lại Báo cáo doanh thu!`,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_CANCELLED") {
      return NextResponse.json({ error: "Hóa đơn này đã bị hủy trước đó" }, { status: 400 });
    }
    console.error("Cancel invoice transaction error:", err);
    return NextResponse.json({ error: "Lỗi xử lý hủy hóa đơn" }, { status: 500 });
  }
}
