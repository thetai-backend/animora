import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập nhắc hẹn" }, { status: 403 });
  }

  // Tuyệt đối loại bỏ mọi thú cưng có trạng thái "DECEASED" (Đã mất)
  const [records, emailLogs] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: {
        followUpDate: { not: null },
        OR: [{ petId: null }, { pet: { status: { not: "DECEASED" } } }],
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        pet: { select: { id: true, name: true, species: true, breed: true, status: true } },
        doctor: { select: { id: true, fullName: true } },
        emailLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { followUpDate: "asc" },
      take: 100,
    }),
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const reminders = records
    .filter((r) => !r.pet || r.pet.status !== "DECEASED")
    .map((r) => {
      const fu = r.followUpDate!;
      const startOfFu = new Date(fu.getFullYear(), fu.getMonth(), fu.getDate()).getTime();
      const daysUntil = Math.round((startOfFu - startOfToday) / (1000 * 60 * 60 * 24));
      return {
        ...r,
        daysUntil,
        // Ưu tiên hiển thị hẹn sắp đến trong 0 - 2 ngày tới (hoặc trễ nhẹ)
        isUrgent: daysUntil >= 0 && daysUntil <= 2,
        isOverdue: daysUntil < 0,
      };
    })
    .sort((a, b) => {
      // Ưu tiên nhóm sắp đến 0-2 ngày lên đầu, sau đó theo ngày gần nhất
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.daysUntil - b.daysUntil;
    });

  return NextResponse.json({ reminders, emailLogs });
}
