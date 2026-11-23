import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền sửa dịch vụ" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy dịch vụ" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.service.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      category:
        body.category === "SPA"
          ? "SPA"
          : body.category === "MEDICAL"
          ? "MEDICAL"
          : existing.category,
      price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : existing.price,
      durationMinutes:
        body.durationMinutes !== undefined
          ? Math.max(15, Number(body.durationMinutes) || 30)
          : existing.durationMinutes,
      shortDescription:
        body.shortDescription !== undefined
          ? String(body.shortDescription).trim()
          : existing.shortDescription,
      processSteps:
        body.processSteps !== undefined
          ? String(body.processSteps).trim()
          : existing.processSteps,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
    },
  });

  revalidatePath("/");
  revalidatePath("/dat-lich");

  return NextResponse.json({
    service: updated,
    message: `Đã cập nhật dịch vụ "${updated.name}"!`,
  });
}
