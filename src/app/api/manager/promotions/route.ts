import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền quản lý sự kiện" }, { status: 403 });
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền tạo sự kiện khuyến mãi" }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const code = body.code ? String(body.code).trim().toUpperCase() : null;
  const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENT";
  const discountValue = Math.max(1, Number(body.discountValue) || 0);
  const applicableScope = ["ALL", "MEDICAL", "SPA", "SHOP"].includes(String(body.applicableScope))
    ? String(body.applicableScope)
    : "ALL";
  const startDateStr = String(body.startDate || "").trim();
  const endDateStr = String(body.endDate || "").trim();

  if (!title || !description || !startDateStr || !endDateStr || discountValue <= 0) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ Tên sự kiện, Mô tả, Mức giảm và Thời gian hiệu lực" },
      { status: 400 }
    );
  }
  if (discountType === "PERCENT" && discountValue > 100) {
    return NextResponse.json({ error: "Mức giảm theo % không được vượt quá 100%" }, { status: 400 });
  }

  if (code) {
    const dup = await prisma.promotion.findUnique({ where: { code } });
    if (dup) {
      return NextResponse.json({ error: `Mã ưu đãi "${code}" đã tồn tại` }, { status: 409 });
    }
  }

  const promotion = await prisma.promotion.create({
    data: {
      code,
      title,
      subtitle: body.subtitle ? String(body.subtitle).trim() : null,
      description,
      discountType,
      discountValue,
      applicableScope,
      badgeText: body.badgeText ? String(body.badgeText).trim() : null,
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr.length === 10 ? `${endDateStr}T23:59:59` : endDateStr),
      showOnLanding: body.showOnLanding !== undefined ? Boolean(body.showOnLanding) : true,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    },
  });

  revalidatePath("/");

  return NextResponse.json(
    {
      promotion,
      message: `Đã tạo sự kiện khuyến mãi "${promotion.title}" thành công!`,
    },
    { status: 201 }
  );
}
