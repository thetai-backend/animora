import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền sửa sự kiện" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy sự kiện khuyến mãi" }, { status: 404 });
  }

  const body = await request.json();
  const nextCode =
    body.code !== undefined
      ? body.code
        ? String(body.code).trim().toUpperCase()
        : null
      : existing.code;

  if (nextCode && nextCode !== existing.code) {
    const dup = await prisma.promotion.findUnique({ where: { code: nextCode } });
    if (dup) {
      return NextResponse.json({ error: `Mã ưu đãi "${nextCode}" đã tồn tại` }, { status: 409 });
    }
  }

  const startDate = body.startDate ? new Date(String(body.startDate)) : existing.startDate;
  const endDateRaw = body.endDate ? String(body.endDate) : null;
  const endDate = endDateRaw
    ? new Date(endDateRaw.length === 10 ? `${endDateRaw}T23:59:59` : endDateRaw)
    : existing.endDate;

  const updated = await prisma.promotion.update({
    where: { id },
    data: {
      code: nextCode,
      title: body.title !== undefined ? String(body.title).trim() : existing.title,
      subtitle:
        body.subtitle !== undefined ? String(body.subtitle || "").trim() || null : existing.subtitle,
      description:
        body.description !== undefined ? String(body.description).trim() : existing.description,
      discountType:
        body.discountType === "FIXED"
          ? "FIXED"
          : body.discountType === "PERCENT"
          ? "PERCENT"
          : existing.discountType,
      discountValue:
        body.discountValue !== undefined
          ? Math.max(1, Number(body.discountValue) || existing.discountValue)
          : existing.discountValue,
      applicableScope:
        body.applicableScope && ["ALL", "MEDICAL", "SPA", "SHOP"].includes(String(body.applicableScope))
          ? String(body.applicableScope)
          : existing.applicableScope,
      badgeText:
        body.badgeText !== undefined
          ? String(body.badgeText || "").trim() || null
          : existing.badgeText,
      startDate,
      endDate,
      showOnLanding:
        body.showOnLanding !== undefined ? Boolean(body.showOnLanding) : existing.showOnLanding,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    },
  });

  return NextResponse.json({
    promotion: updated,
    message: `Đã cập nhật chương trình "${updated.title}"!`,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền xóa sự kiện" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.promotion.delete({ where: { id } });
  return NextResponse.json({ ok: true, message: "Đã xóa sự kiện khuyến mãi!" });
}
