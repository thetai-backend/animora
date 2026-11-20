import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json(
      { error: "Chỉ Bác sĩ hoặc Quản lý mới được thêm ghi chú bổ sung" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const content = String(body.content || "").trim();

  if (!content) {
    return NextResponse.json(
      { error: "Vui lòng nhập nội dung ghi chú bổ sung" },
      { status: 400 }
    );
  }

  const record = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy bệnh án" }, { status: 404 });
  }

  const addendum = await prisma.medicalRecordAddendum.create({
    data: {
      medicalRecordId: id,
      authorId: session.userId,
      authorName: session.fullName,
      content,
    },
  });

  return NextResponse.json({ addendum }, { status: 201 });
}
