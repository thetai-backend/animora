import { PrismaClient } from ".prisma/client-animora";
import { resetDatabaseClean } from "./reset-clean";

const prisma = new PrismaClient();

async function main() {
  console.log("🌿 Khởi tạo database sạch ANIMORA (chỉ giữ 1 Quản lý & cấu hình tối thiểu)...");
  await resetDatabaseClean(prisma);
}

main()
  .catch((err) => {
    console.error("❌ Lỗi khi seed database sạch:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
