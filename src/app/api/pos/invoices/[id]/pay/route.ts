import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateInvoiceTotals } from "@/lib/pricing-utils";
import { deductStockFEFO } from "@/lib/inventory-utils";

/**
 * Xác nhận đã thu tại quầy POS:
 * 1) Tính cộng dồn đa khuyến mãi (Sự kiện trước -> Mã giảm giá sau, min 0đ).
 * 2) Chỉ chấp nhận 1 trong 2 phương thức: CASH hoặc VIETQR (không hỗn hợp).
 * 3) Trừ kho FEFO CHỈ KHI bấm Xác nhận đã thu (cho phép tồn âm tạm thời kèm cảnh báo).
 * 4) KHÓA CỨNG bệnh án S.O.A.P gốc ngay khi thanh toán xong!
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền thu ngân" }, { status: 403 });
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
    return NextResponse.json({ error: "Hóa đơn này đã được xử lý trước đó" }, { status: 400 });
  }
  if (invoice.items.length === 0) {
    return NextResponse.json({ error: "Hóa đơn đang trống, không thể thu tiền" }, { status: 400 });
  }

  const body = await request.json();
  const paymentMethod =
    body.paymentMethod === "VIETQR"
      ? "VIETQR"
      : body.paymentMethod === "CASH"
      ? "CASH"
      : null;
  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Vui lòng chọn 1 phương thức thanh toán: Tiền mặt hoặc Chuyển khoản VietQR" },
      { status: 400 }
    );
  }

  const eventPromoId = body.eventPromoId ? String(body.eventPromoId) : null;
  const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;
  const now = new Date();

  const [eventPromo, couponPromo] = await Promise.all([
    eventPromoId
      ? prisma.promotion.findUnique({ where: { id: eventPromoId } })
      : Promise.resolve(null),
    couponCode
      ? prisma.promotion.findUnique({ where: { code: couponCode } })
      : Promise.resolve(null),
  ]);

  if (
    eventPromo &&
    (!eventPromo.isActive || eventPromo.startDate > now || eventPromo.endDate < now)
  ) {
    return NextResponse.json(
      { error: `Chương trình "${eventPromo.title}" đã hết hạn hoặc đang tạm tắt` },
      { status: 400 }
    );
  }

  if (couponCode) {
    if (!couponPromo) {
      return NextResponse.json({ error: `Mã giảm giá "${couponCode}" không hợp lệ` }, { status: 400 });
    }
    if (!couponPromo.isActive || couponPromo.startDate > now || couponPromo.endDate < now) {
      return NextResponse.json(
        { error: `Mã giảm giá "${couponCode}" đã hết hạn hoặc không còn hiệu lực` },
        { status: 400 }
      );
    }
  }

  const totals = calculateInvoiceTotals(
    invoice.items.map((i) => ({ category: i.category, totalPrice: i.totalPrice })),
    eventPromo,
    couponPromo && couponPromo.id !== eventPromo?.id ? couponPromo : null
  );

  let cashReceived: number | null = null;
  let cashChange: number | null = null;
  if (paymentMethod === "CASH") {
    cashReceived = Number(body.cashReceived ?? totals.totalAmount);
    if (!Number.isFinite(cashReceived) || cashReceived < totals.totalAmount) {
      return NextResponse.json(
        { error: "Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền thanh toán" },
        { status: 400 }
      );
    }
    cashChange = cashReceived - totals.totalAmount;
  }

  // Trừ tồn kho FEFO cho toàn bộ Thuốc & Sản phẩm Shop trong hóa đơn
  const negativeStockWarnings: string[] = [];
  for (const item of invoice.items) {
    if (item.productId && (item.itemType === "MEDICINE" || item.itemType === "SHOP_PRODUCT")) {
      const res = await deductStockFEFO({
        productId: item.productId,
        quantity: item.quantity,
        type: "SALE_DEDUCT",
        referenceId: invoice.id,
        note: `Xuất bán hóa đơn ${invoice.invoiceCode}`,
        actorId: session.userId,
        actorName: session.fullName,
      });
      if (res.wentNegative) {
        negativeStockWarnings.push(
          `${item.name} (tồn kho tạm thời: ${res.newStockQuantity} ${item.unit})`
        );
      }
    }
  }

  const paidAt = new Date();
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      cashierId: session.userId,
      subtotal: totals.subtotal,
      eventDiscountAmount: totals.eventDiscountAmount,
      couponDiscountAmount: totals.couponDiscountAmount,
      totalAmount: totals.totalAmount,
      appliedEventPromoId: eventPromo?.id ?? null,
      appliedEventPromoTitle: eventPromo?.title ?? null,
      appliedCouponCode: couponPromo?.code ?? null,
      appliedCouponTitle: couponPromo?.title ?? null,
      paymentMethod,
      cashReceived,
      cashChange,
      status: "PAID",
      paidAt,
    },
    include: {
      items: true,
      auditLogs: true,
      medicalRecord: { select: { id: true, recordCode: true, status: true } },
    },
  });

  // Rule 6: Ngay khi hóa đơn được xác nhận thanh toán -> KHÓA CỨNG bệnh án S.O.A.P gốc!
  if (invoice.medicalRecordId) {
    await prisma.medicalRecord.update({
      where: { id: invoice.medicalRecordId },
      data: {
        status: "LOCKED",
        lockedAt: paidAt,
      },
    });
  }

  return NextResponse.json({
    invoice: updatedInvoice,
    negativeStockWarnings,
    message:
      negativeStockWarnings.length > 0
        ? `Đã xác nhận thu tiền hóa đơn ${invoice.invoiceCode}, trừ kho FEFO và khóa cứng bệnh án. Lưu ý tồn kho âm tạm thời: ${negativeStockWarnings.join(", ")}.`
        : `Đã xác nhận thu tiền hóa đơn ${invoice.invoiceCode}, trừ kho FEFO và khóa cứng bệnh án S.O.A.P thành công!`,
  });
}
