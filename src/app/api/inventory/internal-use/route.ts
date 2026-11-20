import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";
import { deductStockFEFO } from "@/lib/inventory-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["MANAGER", "DOCTOR"].includes(session.role)) {
    return NextResponse.json(
      { error: "Chỉ Quản lý hoặc Bác sĩ mới được lập Phiếu xuất kho nội bộ" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const productId = String(body.productId || "");
  const quantity = Math.max(1, Number(body.quantity) || 0);
  const department = String(body.department || "Phòng khám").trim();
  const reason = String(body.reason || "").trim();

  if (!productId || quantity <= 0 || !reason) {
    return NextResponse.json(
      { error: "Vui lòng chọn vật tư, số lượng (> 0) và lý do xuất nội bộ" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Không tìm thấy mặt hàng" }, { status: 404 });
  }

  const slipCode = generateShortCode("XNB");
  const slip = await prisma.internalUsageSlip.create({
    data: {
      slipCode,
      productId: product.id,
      quantity,
      department,
      reason,
      createdById: session.userId,
      createdByName: session.fullName,
    },
  });

  const fefoResult = await deductStockFEFO({
    productId: product.id,
    quantity,
    type: "INTERNAL_USE",
    referenceId: slip.id,
    note: `Xuất kho nội bộ ${slipCode} (${department}): ${reason}`,
    actorId: session.userId,
    actorName: session.fullName,
  });

  return NextResponse.json(
    {
      slip,
      wentNegative: fefoResult.wentNegative,
      message: fefoResult.wentNegative
        ? `Đã lập phiếu ${slipCode} (Cảnh báo: tồn kho đang âm tạm thời: ${fefoResult.newStockQuantity} ${product.retailUnit}).`
        : `Đã lập phiếu xuất nội bộ ${slipCode} (${quantity} ${product.retailUnit}).`,
    },
    { status: 201 }
  );
}
