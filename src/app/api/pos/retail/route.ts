import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";
import { calculateInvoiceTotals } from "@/lib/pricing-utils";
import { deductStockFEFO } from "@/lib/inventory-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền tạo hóa đơn bán lẻ" }, { status: 403 });
  }

  const body = await request.json();
  const customerId = body.customerId ? String(body.customerId).trim() : null;
  let resolvedCustomerId: string | null = null;
  let guestName: string | null = String(body.guestName || "Khách mua lẻ tại quầy").trim();
  let guestPhone: string | null = body.guestPhone ? String(body.guestPhone).trim() : null;

  if (customerId) {
    const member = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true, phone: true },
    });
    if (member) {
      resolvedCustomerId = member.id;
      guestName = null;
      guestPhone = null;
    }
  }

  const itemsInput: { productId: string; quantity: number }[] = Array.isArray(body.items)
    ? body.items
    : [];
  const payNow = Boolean(body.payNow);

  if (itemsInput.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn ít nhất 1 sản phẩm Shop" },
      { status: 400 }
    );
  }

  const createdItems: {
    itemType: string;
    productId: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addedByRole: string;
  }[] = [];

  for (const row of itemsInput) {
    const prod = await prisma.product.findUnique({ where: { id: row.productId } });
    if (!prod) continue;
    const qty = Math.max(1, Number(row.quantity) || 1);
    createdItems.push({
      itemType: "SHOP_PRODUCT",
      productId: prod.id,
      name: prod.name,
      category: "SHOP",
      unit: prod.retailUnit,
      quantity: qty,
      unitPrice: prod.price,
      totalPrice: prod.price * qty,
      addedByRole: "RECEPTIONIST",
    });
  }

  if (createdItems.length === 0) {
    return NextResponse.json({ error: "Không có sản phẩm hợp lệ" }, { status: 400 });
  }

  const invoiceCode = String(body.invoiceCode || "").trim() || generateShortCode("BL");
  const subtotal = createdItems.reduce((s, i) => s + i.totalPrice, 0);

  if (!payNow) {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceCode,
        type: "RETAIL",
        customerId: resolvedCustomerId,
        guestName,
        guestPhone,
        petSummary: "Mua lẻ sản phẩm tại Shop",
        subtotal,
        totalAmount: subtotal,
        status: "PENDING",
        items: { create: createdItems },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        items: {
          include: { product: { select: { id: true, stockQuantity: true, retailUnit: true } } },
        },
        auditLogs: true,
      },
    });
    return NextResponse.json({ invoice }, { status: 201 });
  }

  // Thanh toán trực tiếp ngay trên tab Bán lẻ Shop nhanh (Nguyên tử trong 1 Transaction)
  const paymentMethod =
    body.paymentMethod === "VIETQR"
      ? "VIETQR"
      : body.paymentMethod === "CASH"
      ? "CASH"
      : null;

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Vui lòng chọn 1 phương thức thanh toán: Tiền mặt hoặc VietQR" },
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
    if (!couponPromo || !couponPromo.isActive || couponPromo.startDate > now || couponPromo.endDate < now) {
      return NextResponse.json(
        { error: `Mã giảm giá "${couponCode}" không hợp lệ hoặc đã hết hạn` },
        { status: 400 }
      );
    }
  }

  const totals = calculateInvoiceTotals(
    createdItems.map((i) => ({ category: i.category, totalPrice: i.totalPrice })),
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

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceCode,
        type: "RETAIL",
        customerId: resolvedCustomerId,
        guestName,
        guestPhone,
        petSummary: "Mua lẻ sản phẩm tại Shop",
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
        items: { create: createdItems },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        items: true,
        auditLogs: true,
      },
    });

    // Trừ tồn kho FEFO cho từng sản phẩm Shop trong cùng transaction
    for (const item of createdItems) {
      const res = await deductStockFEFO({
        productId: item.productId,
        quantity: item.quantity,
        type: "SALE_DEDUCT",
        referenceId: created.id,
        note: `Xuất bán lẻ Shop ${created.invoiceCode}`,
        actorId: session.userId,
        actorName: session.fullName,
        tx,
      });
      if (res.wentNegative) {
        negativeStockWarnings.push(
          `${item.name} (tồn tạm thời: ${res.newStockQuantity} ${item.unit})`
        );
      }
    }

    return created;
  });

  return NextResponse.json(
    {
      invoice,
      negativeStockWarnings,
      message:
        negativeStockWarnings.length > 0
          ? `Đã thanh toán đơn bán lẻ ${invoice.invoiceCode} & trừ kho FEFO. Lưu ý tồn âm tạm thời: ${negativeStockWarnings.join(", ")}.`
          : `Đã thanh toán đơn bán lẻ ${invoice.invoiceCode} & trừ kho FEFO thành công!`,
    },
    { status: 201 }
  );
}
