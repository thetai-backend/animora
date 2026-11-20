import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền thao tác" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: { pet: { select: { status: true, name: true } } },
  });

  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ tái khám" }, { status: 404 });
  }
  if (record.pet?.status === "DECEASED") {
    return NextResponse.json(
      { error: "Thú cưng đang ở trạng thái Đã mất — hệ thống đã tự động khóa nhắc hẹn." },
      { status: 400 }
    );
  }

  const updated = await prisma.medicalRecord.update({
    where: { id },
    data: {
      reminderCalledAt: new Date(),
      reminderCalledBy: session.fullName,
    },
  });

  return NextResponse.json({
    record: updated,
    message: `Đã đánh dấu 'Đã gọi nhắc' cho hồ sơ ${record.recordCode}.`,
  });
}
