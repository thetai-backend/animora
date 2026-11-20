import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchReminderEmail } from "@/lib/notifications";
import { formatDateVn } from "@/lib/format";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền gửi email nhắc hẹn" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      customer: { select: { fullName: true, email: true } },
      pet: { select: { name: true, status: true } },
      doctor: { select: { fullName: true } },
      booking: { select: { guestEmail: true } },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bệnh án" }, { status: 404 });
  }

  // Rule 12: Tuyệt đối ngắt mọi email nhắc hẹn cho thú cưng Đã mất
  if (record.pet?.status === "DECEASED") {
    return NextResponse.json(
      { error: "Thú cưng ở trạng thái Đã mất — tuyệt đối không gửi Email nhắc hẹn!" },
      { status: 400 }
    );
  }

  const recipientEmail = record.customer?.email || record.booking?.guestEmail || null;
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Khách hàng này không có địa chỉ Email (khách vãng lai chưa nhập email). Vui lòng gọi điện trực tiếp." },
      { status: 400 }
    );
  }

  const recipientName = record.customer?.fullName || record.guestOwnerName || "Quý khách";
  const petName = record.pet?.name || record.guestPetName || "thú cưng";
  const followUpStr = formatDateVn(record.followUpDate);
  const subject = `[ANIMORA] Nhắc lịch tái khám / tiêm phòng cho bé ${petName} ngày ${followUpStr}`;
  const body = `Kính chào ${recipientName}, Phòng khám Thú y ANIMORA trân trọng nhắc lịch hẹn của bé ${petName} vào ngày ${followUpStr} với ${record.doctor.fullName}. Nội dung dặn dò: ${
    record.followUpNote || "Tái khám kiểm tra sức khỏe định kỳ"
  }. Quý khách vui lòng đặt lịch trước hoặc liên hệ hotline phòng khám để được ưu tiên tiếp đón.`;

  await dispatchReminderEmail({
    recipientEmail,
    recipientName,
    petName,
    subject,
    body,
  });

  const emailLog = await prisma.emailLog.create({
    data: {
      medicalRecordId: record.id,
      recipientEmail,
      recipientName,
      petName,
      subject,
      body,
      channel: "EMAIL",
      sentById: session.userId,
      sentByName: session.fullName,
    },
  });

  return NextResponse.json({
    emailLog,
    message: `Đã gửi Email nhắc hẹn tới ${recipientEmail} và lưu vào Nhật ký Email đã gửi!`,
  });
}
