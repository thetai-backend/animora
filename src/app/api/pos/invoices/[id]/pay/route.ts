import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateInvoiceTotals } from "@/lib/pricing-utils";
import { deductStockFEFO } from "@/lib/inventory-utils";

/**
 * Xác nhận đã thu tại quầy POS (Xử lý nguyên tử trong 1 Prisma Transaction):
 * 1) Tính cộng dồn đa khuyến mãi (Sự kiện trước -> Mã giảm giá sau, min 0đ).
 * 2) Chỉ chấp nhận 1 trong 2 phương thức: CASH hoặc VIETQR (không hỗn hợp).
 * 3) Trừ kho FEFO CHỈ KHI bấm Xác nhận đã thu (cho phép tồn âm tạm thời kèm cảnh báo).
 * 4) KHÓA CỨNG bệnh án S.O.A.P gốc (isLocked = true, status = LOCKED) và cập nhật lịch hẹn hoàn thành.
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

  const paidAt = new Date();
  const negativeStockWarnings: string[] = [];

  try {
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Kiểm tra lại trạng thái trong transaction để chống thu trùng 2 lần
      const fresh = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });
      if (!fresh || fresh.status !== "PENDING") {
        throw new Error("INVOICE_ALREADY_PROCESSED");
      }

      // 1) Trừ tồn kho FEFO cho toàn bộ Thuốc & Sản phẩm Shop trong hóa đơn
      for (const item of fresh.items) {
        if (item.productId && (item.itemType === "MEDICINE" || item.itemType === "SHOP_PRODUCT")) {
          const res = await deductStockFEFO({
            productId: item.productId,
            quantity: item.quantity,
            type: "SALE_DEDUCT",
            referenceId: fresh.id,
            note: `Xuất bán hóa đơn ${fresh.invoiceCode}`,
            actorId: session.userId,
            actorName: session.fullName,
            tx,
          });
          if (res.wentNegative) {
            negativeStockWarnings.push(
              `${item.name} (tồn kho tạm thời: ${res.newStockQuantity} ${item.unit})`
            );
          }
        }
      }

      // 2) Cập nhật Hóa đơn thành PAID
      const inv = await tx.invoice.update({
        where: { id: fresh.id },
        data: {
          cashierId: session.userId,
          subtotal: totals.subtotal,
          eventDiscountAmount: totals.eventDiscountAmount,
          couponDiscountAmount: totals.couponDiscountAmount,
          totalAmount: totals.totalAmount,
          appliedEventPromoId: eventPromo?.id ?? null,
          appliedEventPromoTitle: eventPromo?.title ?? null,
          appliedCouponCode:
            couponPromo && couponPromo.id !== eventPromo?.id ? couponPromo.code : null,
          appliedCouponTitle:
            couponPromo && couponPromo.id !== eventPromo?.id ? couponPromo.title : null,
          paymentMethod,
          cashReceived,
          cashChange,
          status: "PAID",
          paidAt,
        },
        include: {
          items: true,
          auditLogs: { orderBy: { createdAt: "desc" } },
          medicalRecord: { select: { id: true, recordCode: true, status: true, isLocked: true } },
        },
      });

      // 3) KHÓA CỨNG bệnh án S.O.A.P gốc ngay khi thanh toán
      if (fresh.medicalRecordId) {
        await tx.medicalRecord.update({
          where: { id: fresh.medicalRecordId },
          data: {
            status: "LOCKED",
            isLocked: true,
            lockedAt: paidAt,
          },
        });
      }

      // 4) Đảm bảo lịch hẹn tương ứng đánh dấu COMPLETED nếu toàn bộ thú cưng đã khám xong
      if (fresh.bookingId) {
        const booking = await tx.booking.findUnique({
          where: { id: fresh.bookingId },
          include: {
            pets: { select: { id: true } },
            medicalRecords: { select: { bookingPetId: true, status: true } },
          },
        });
        if (booking && booking.status !== "CANCELLED") {
          const donePetIds = new Set(
            booking.medicalRecords
              .filter((r) => r.status === "SENT_TO_POS" || r.status === "LOCKED")
              .map((r) => r.bookingPetId)
          );
          const allDone =
            booking.pets.length <= 1 || booking.pets.every((p) => donePetIds.has(p.id));
          if (allDone) {
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: "COMPLETED" },
            });
          }
        }
      }

      return inv;
    });

    return NextResponse.json({
      invoice: updatedInvoice,
      negativeStockWarnings,
      message:
        negativeStockWarnings.length > 0
          ? `Đã xác nhận thu tiền hóa đơn ${invoice.invoiceCode}, trừ kho FEFO và khóa cứng bệnh án. Lưu ý tồn kho âm tạm thời: ${negativeStockWarnings.join(", ")}.`
          : `Đã xác nhận thu tiền hóa đơn ${invoice.invoiceCode}, trừ kho FEFO và khóa cứng bệnh án S.O.A.P thành công!`,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVOICE_ALREADY_PROCESSED") {
      return NextResponse.json({ error: "Hóa đơn này đã được thanh toán trước đó" }, { status: 409 });
    }
    console.error("POS pay transaction error:", err);
    return NextResponse.json({ error: "Lỗi xử lý giao dịch thanh toán" }, { status: 500 });
  }
}
