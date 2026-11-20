import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền cập nhật trạng thái bác sĩ" }, { status: 403 });
  }

  const body = await request.json();
  const workStatus = String(body.workStatus || "");
  if (!["AVAILABLE", "IN_EXAM", "OFF_DUTY"].includes(workStatus)) {
    return NextResponse.json({ error: "Trạng thái làm việc không hợp lệ" }, { status: 400 });
  }

  const targetId =
    session.role === "MANAGER" && body.doctorId ? String(body.doctorId) : session.userId;

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { workStatus },
    select: { id: true, fullName: true, workStatus: true },
  });

  return NextResponse.json({ doctor: updated });
}
