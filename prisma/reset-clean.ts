import { PrismaClient } from ".prisma/client-animora";
import bcrypt from "bcryptjs";

const MANAGER_EMAIL = process.env.ANIMORA_ADMIN_EMAIL || "quanly@animora.vn";
const MANAGER_PASSWORD = process.env.ANIMORA_ADMIN_PASSWORD || "Animora@123";
const MANAGER_NAME = process.env.ANIMORA_ADMIN_NAME || "Quản trị viên ANIMORA";

export async function resetDatabaseClean(prisma: PrismaClient) {
  console.log("🧹 Bắt đầu dọn sạch toàn bộ dữ liệu mẫu ANIMORA theo thứ tự khóa ngoại...");

  // 1. Xóa toàn bộ bảng con & lịch sử nghiệp vụ (từ con -> cha để tuyệt đối không lỗi FK)
  const deleted = {
    invoiceAuditLog: (await prisma.invoiceAuditLog.deleteMany()).count,
    invoiceItem: (await prisma.invoiceItem.deleteMany()).count,
    invoice: (await prisma.invoice.deleteMany()).count,
    notificationLog: (await prisma.notificationLog.deleteMany()).count,
    emailLog: (await prisma.emailLog.deleteMany()).count,
    medicalRecordAddendum: (await prisma.medicalRecordAddendum.deleteMany()).count,
    medicalRecord: (await prisma.medicalRecord.deleteMany()).count,
    bookingPetService: (await prisma.bookingPetService.deleteMany()).count,
    bookingPet: (await prisma.bookingPet.deleteMany()).count,
    booking: (await prisma.booking.deleteMany()).count,
    stockTransaction: (await prisma.stockTransaction.deleteMany()).count,
    internalUsageSlip: (await prisma.internalUsageSlip.deleteMany()).count,
    disposalSlip: (await prisma.disposalSlip.deleteMany()).count,
    inventoryBatch: (await prisma.inventoryBatch.deleteMany()).count,
    doctorLeave: (await prisma.doctorLeave.deleteMany()).count,
    workSchedule: (await prisma.workSchedule.deleteMany()).count,
    pet: (await prisma.pet.deleteMany()).count,
    otpCode: (await prisma.otpCode.deleteMany()).count,
    promotion: (await prisma.promotion.deleteMany()).count,
    product: (await prisma.product.deleteMany()).count,
    service: (await prisma.service.deleteMany()).count,
  };

  // 2. Bảng User: Xóa toàn bộ Khách hàng, Lễ tân, Bác sĩ và mọi tài khoản khác — CHỈ GIỮ DUY NHẤT 1 QUẢN LÝ
  const passwordHash = await bcrypt.hash(MANAGER_PASSWORD, 10);

  const manager = await prisma.user.upsert({
    where: { email: MANAGER_EMAIL },
    update: {
      passwordHash,
      role: "MANAGER",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: MANAGER_EMAIL,
      passwordHash,
      fullName: MANAGER_NAME,
      phone: "028 3890 2468",
      address: "TP. Hồ Chí Minh",
      role: "MANAGER",
      isActive: true,
      emailVerified: true,
      title: "Quản lý Phòng khám",
    },
  });

  const deletedUsers = (
    await prisma.user.deleteMany({
      where: { id: { not: manager.id } },
    })
  ).count;

  // 3. Bảng ClinicSettings: Chỉ giữ đúng 1 bản ghi cấu hình phòng khám tối thiểu
  await prisma.clinicSettings.deleteMany({
    where: { id: { not: "default" } },
  });

  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {
      clinicName: "Phòng khám Thú y ANIMORA",
      openTime: "07:00",
      closeTime: "20:00",
      slotDurationMinutes: 30,
      lunchBreakEnabled: false,
      lunchStart: "12:00",
      lunchEnd: "13:30",
    },
    create: {
      id: "default",
      clinicName: "Phòng khám Thú y ANIMORA",
      tagline: "Chăm sóc bằng chuẩn y khoa — Yêu thương như người nhà",
      heroTitle: "Phòng khám Thú y ANIMORA",
      heroSubtitle:
        "Hệ thống chăm sóc sức khỏe, khám chữa bệnh và spa dành riêng cho thú cưng.",
      address: "Đang cập nhật địa chỉ phòng khám (Quản lý cập nhật trong CMS)",
      phone: "028 3890 2468",
      email: "cskh@animora.vn",
      openTime: "07:00",
      closeTime: "20:00",
      slotDurationMinutes: 30,
      lunchBreakEnabled: false,
      lunchStart: "12:00",
      lunchEnd: "13:30",
      googleMapsUrl: "https://www.google.com/maps",
      googleMapsEmbedUrl:
        "https://maps.google.com/maps?q=Ho%20Chi%20Minh%20City&t=&z=13&ie=UTF8&iwloc=&output=embed",
      latitude: 10.7769,
      longitude: 106.7009,
      bankCode: "",
      bankAccountNumber: "",
      bankAccountName: "",
    },
  });

  // 4. Đếm lại số bản ghi thực tế của tất cả các bảng
  const counts = {
    User: await prisma.user.count(),
    ClinicSettings: await prisma.clinicSettings.count(),
    Service: await prisma.service.count(),
    Product: await prisma.product.count(),
    Promotion: await prisma.promotion.count(),
    Pet: await prisma.pet.count(),
    WorkSchedule: await prisma.workSchedule.count(),
    DoctorLeave: await prisma.doctorLeave.count(),
    Booking: await prisma.booking.count(),
    BookingPet: await prisma.bookingPet.count(),
    BookingPetService: await prisma.bookingPetService.count(),
    MedicalRecord: await prisma.medicalRecord.count(),
    MedicalRecordAddendum: await prisma.medicalRecordAddendum.count(),
    EmailLog: await prisma.emailLog.count(),
    NotificationLog: await prisma.notificationLog.count(),
    InventoryBatch: await prisma.inventoryBatch.count(),
    StockTransaction: await prisma.stockTransaction.count(),
    InternalUsageSlip: await prisma.internalUsageSlip.count(),
    DisposalSlip: await prisma.disposalSlip.count(),
    Invoice: await prisma.invoice.count(),
    InvoiceItem: await prisma.invoiceItem.count(),
    InvoiceAuditLog: await prisma.invoiceAuditLog.count(),
    OtpCode: await prisma.otpCode.count(),
  };

  console.log("✅ Đã dọn sạch dữ liệu mẫu thành công!");
  console.log(`   - Đã xóa ${deletedUsers} tài khoản không phải Quản lý duy nhất.`);
  console.log(`   - Tài khoản Quản lý duy nhất: ${manager.email} (Role: ${manager.role})`);
  console.log("   - Tổng số bản ghi đã xóa theo bảng:", deleted);
  console.log("📊 Số bản ghi còn lại thực tế trong database:");
  console.table(counts);

  return { manager, counts };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await resetDatabaseClean(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("prisma/reset-clean.ts");

if (isDirectRun) {
  main().catch((err) => {
    console.error("❌ Lỗi khi dọn sạch database:", err);
    process.exit(1);
  });
}
