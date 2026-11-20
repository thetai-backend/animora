import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền xem bệnh án" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, fullName: true, title: true } },
      customer: { select: { id: true, fullName: true, phone: true, email: true } },
      pet: true,
      bookingPet: { include: { services: true } },
      addendums: { orderBy: { createdAt: "asc" } },
      invoice: {
        include: {
          items: true,
          auditLogs: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bệnh án" }, { status: 404 });
  }

  // Lấy toàn bộ lịch sử khám các lần trước của thú cưng (hiển thị ở Cột trái)
  const previousRecords = record.petId
    ? await prisma.medicalRecord.findMany({
        where: {
          petId: record.petId,
          id: { not: record.id },
        },
        include: {
          doctor: { select: { fullName: true } },
          addendums: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return NextResponse.json({ record, previousRecords });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền chỉnh sửa bệnh án" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.medicalRecord.findUnique({
    where: { id },
    include: { invoice: { select: { status: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy bệnh án" }, { status: 404 });
  }

  // Rule 6: Bệnh án đã thanh toán -> KHÓA CỨNG, cấm sửa đè!
  if (existing.status === "LOCKED" || existing.invoice?.status === "PAID") {
    return NextResponse.json(
      {
        error:
          "Bệnh án này đã KHÓA CỨNG sau khi thanh toán. Bạn chỉ có thể dùng chức năng 'Thêm ghi chú bổ sung'.",
      },
      { status: 423 }
    );
  }

  const body = await request.json();
  const updated = await prisma.medicalRecord.update({
    where: { id },
    data: {
      subjective: body.subjective !== undefined ? String(body.subjective) : existing.subjective,
      objective: body.objective !== undefined ? String(body.objective) : existing.objective,
      weightKg: body.weightKg !== undefined ? String(body.weightKg || "") : existing.weightKg,
      temperatureC:
        body.temperatureC !== undefined ? String(body.temperatureC || "") : existing.temperatureC,
      heartRate: body.heartRate !== undefined ? String(body.heartRate || "") : existing.heartRate,
      respiratoryRate:
        body.respiratoryRate !== undefined
          ? String(body.respiratoryRate || "")
          : existing.respiratoryRate,
      assessment: body.assessment !== undefined ? String(body.assessment) : existing.assessment,
      plan: body.plan !== undefined ? String(body.plan) : existing.plan,
      followUpDate:
        body.followUpDate !== undefined
          ? body.followUpDate
            ? new Date(body.followUpDate)
            : null
          : existing.followUpDate,
      followUpNote:
        body.followUpNote !== undefined
          ? body.followUpNote
            ? String(body.followUpNote)
            : null
          : existing.followUpNote,
    },
  });

  return NextResponse.json({ record: updated });
}
