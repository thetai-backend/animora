import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền cập nhật hồ sơ thú cưng" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.pet.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ thú cưng" }, { status: 404 });
  }

  const body = await request.json();
  const nextStatus =
    body.status === "DECEASED"
      ? "DECEASED"
      : body.status === "ALIVE"
      ? "ALIVE"
      : existing.status;

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      status: nextStatus,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      breed: body.breed !== undefined ? String(body.breed || "").trim() || null : existing.breed,
      allergies:
        body.allergies !== undefined ? String(body.allergies || "").trim() || null : existing.allergies,
      vaccinationHistory:
        body.vaccinationHistory !== undefined
          ? String(body.vaccinationHistory || "").trim() || null
          : existing.vaccinationHistory,
    },
    include: {
      owner: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });

  return NextResponse.json({
    pet: updated,
    message:
      nextStatus === "DECEASED"
        ? `Đã chuyển trạng thái bé "${updated.name}" sang Đã mất. Toàn bộ lịch nhắc tái khám & Email tự động cho bé đã bị ngắt hoàn toàn.`
        : `Đã cập nhật trạng thái bé "${updated.name}" thành Đang chăm sóc.`,
  });
}
