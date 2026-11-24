import fs from "node:fs";
import path from "node:path";

const DEFAULT_DB_PATH = "/app/data/animora.db";
const TEMPLATE_DB_PATH = "/app/prisma/template.db";

function resolveDbPath() {
  const dbUrl = process.env.DATABASE_URL || `file:${DEFAULT_DB_PATH}`;
  if (dbUrl.startsWith("file:")) {
    const rawPath = dbUrl.slice("file:".length).split("?")[0];
    return path.isAbsolute(rawPath) ? rawPath : path.resolve("/app", rawPath);
  }
  return DEFAULT_DB_PATH;
}

async function bootstrap() {
  const dbPath = resolveDbPath();
  const dataDir = path.dirname(dbPath);

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`[ANIMORA] Đã tạo thư mục dữ liệu: ${dataDir}`);
    }

    const dbExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;

    if (!dbExists) {
      if (!fs.existsSync(TEMPLATE_DB_PATH)) {
        throw new Error(
          `Không tìm thấy file database mẫu tại ${TEMPLATE_DB_PATH}`
        );
      }
      fs.copyFileSync(TEMPLATE_DB_PATH, dbPath);
      try {
        fs.chmodSync(dbPath, 0o664);
      } catch {
        // Bỏ qua nếu filesystem mount không hỗ trợ chmod
      }
      console.log(
        `[ANIMORA] Lần khởi chạy đầu tiên: Đã sao chép database mẫu từ ${TEMPLATE_DB_PATH} sang ${dbPath}`
      );
    } else {
      console.log(
        `[ANIMORA] Đã tìm thấy database hiện có tại ${dbPath} — giữ nguyên toàn bộ dữ liệu đang vận hành.`
      );
    }
  } catch (err) {
    console.error("[ANIMORA] Lỗi khi khởi tạo dữ liệu SQLite:", err);
    console.error(
      `[ANIMORA] Gợi ý: Đảm bảo thư mục mount (${dataDir}) có quyền đọc/ghi cho UID 1001.`
    );
    process.exit(1);
  }

  console.log(
    `[ANIMORA] Đang khởi chạy máy chủ Next.js trên ${process.env.HOSTNAME || "0.0.0.0"}:${process.env.PORT || "3000"}...`
  );
  await import("./server.js");
}

bootstrap().catch((err) => {
  console.error("[ANIMORA] Lỗi nghiêm trọng khi khởi chạy ứng dụng:", err);
  process.exit(1);
});
