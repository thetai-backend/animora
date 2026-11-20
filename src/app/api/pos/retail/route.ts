import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền tạo hóa đơn bán lẻ" }, { status: 403 });
  }

  const body = await request.json();
  const guestName = String(body.guestName || "Khách mua lẻ tại quầy").trim();
  const guestPhone = body.guestPhone ? String(body.guestPhone).trim() : null;
  const itemsInput: { productId: string; quantity: number }[] = Array.isArray(body.items)
    ? body.items
    : [];

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

  const subtotal = createdItems.reduce((s, i) => s + i.totalPrice, 0);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceCode: generateShortCode("BL"),
      type: "RETAIL",
      guestName,
      guestPhone,
      petSummary: "Mua lẻ sản phẩm tại Shop",
      subtotal,
      totalAmount: subtotal,
      status: "PENDING",
      items: { create: createdItems },
    },
    include: {
      items: {
        include: { product: { select: { id: true, stockQuantity: true, retailUnit: true } } },
      },
      auditLogs: true,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
