import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restoreStockFromInvoiceCancel } from "@/lib/inventory-utils";

/**
 * ĐỘC QUYỀN QUẢN LÝ (Rule 11):
 * Hủy hóa đơn / Trả hàng Shop -> bắt buộc nhập lý do -> hoàn trả đúng số lượng
 * về đúng các lô hàng đã trừ trước đó và tự động loại khỏi Báo cáo doanh thu.
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

  if (!reason) {
    return NextResponse.json(
      { error: "Bắt buộc nhập lý do hủy hóa đơn / trả hàng" },
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
    return NextResponse.json({ error: "Hóa đơn này đã bị hủy trước đó" }, { status: 400 });
  }

  let restoreResult = { restoredCount: 0, restoredDetails: [] as string[] };
  if (invoice.status === "PAID") {
    restoreResult = await restoreStockFromInvoiceCancel({
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      reason,
      actorId: session.userId,
      actorName: session.fullName,
    });
  }

  const cancelledAt = new Date();
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "CANCELLED",
      cancelledAt,
      cancelReason: reason,
    },
    include: {
      customer: { select: { fullName: true, phone: true } },
      doctor: { select: { fullName: true } },
      cashier: { select: { fullName: true } },
      items: true,
      auditLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  await prisma.invoiceAuditLog.create({
    data: {
      invoiceId: invoice.id,
      actorId: session.userId,
      actorName: session.fullName,
      action: "Quản lý Hủy hóa đơn / Trả hàng",
      itemName: invoice.invoiceCode,
      detail: `Lý do: ${reason}${
        restoreResult.restoredDetails.length > 0
          ? ` | Hoàn kho: ${restoreResult.restoredDetails.join(", ")}`
          : ""
      }`,
    },
  });

  return NextResponse.json({
    invoice: updated,
    restoredCount: restoreResult.restoredCount,
    restoredDetails: restoreResult.restoredDetails,
    message:
      restoreResult.restoredCount > 0
        ? `Đã hủy hóa đơn ${invoice.invoiceCode}, hoàn trả ${restoreResult.restoredCount} đơn vị về đúng lô kho và trừ khỏi Báo cáo doanh thu!`
        : `Đã hủy hóa đơn ${invoice.invoiceCode} và cập nhật lại Báo cáo doanh thu!`,
  });
}
