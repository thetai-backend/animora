import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập nhắc hẹn" }, { status: 403 });
  }

  // Quy tắc bảo vệ cảm xúc chủ nuôi: TUYỆT ĐỐI loại bỏ mọi thú cưng có trạng thái "DECEASED" (Đã mất)
  const [records, notificationLogs, legacyEmailLogs] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: {
        followUpDate: { not: null },
        OR: [{ petId: null }, { pet: { status: { not: "DECEASED" } } }],
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        pet: { select: { id: true, name: true, species: true, breed: true, status: true } },
        doctor: { select: { id: true, fullName: true } },
        notificationLogs: { orderBy: { createdAt: "desc" } },
        emailLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { followUpDate: "asc" },
      take: 150,
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
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
      const mergedEmailLogs =
        r.notificationLogs.length > 0 ? r.notificationLogs : r.emailLogs;
      const isReminded = Boolean(r.reminderCalledAt) || mergedEmailLogs.length > 0;
      return {
        ...r,
        emailLogs: mergedEmailLogs,
        daysUntil,
        isUrgent: daysUntil >= 0 && daysUntil <= 2,
        isThisWeek: daysUntil >= 0 && daysUntil <= 7,
        isOverdue: daysUntil < 0,
        isOverdueUnreminded: daysUntil < 0 && !isReminded,
        isReminded,
      };
    })
    .sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.daysUntil - b.daysUntil;
    });

  const logs = notificationLogs.length > 0 ? notificationLogs : legacyEmailLogs;

  return NextResponse.json({
    reminders,
    notificationLogs: logs,
    emailLogs: logs,
  });
}
