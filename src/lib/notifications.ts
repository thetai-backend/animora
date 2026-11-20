/**
 * Kiến trúc lớp gửi thông báo mở (SPEC.md - Phân hệ 1)
 * Cho phép gửi Email OTP ở hiện tại và dễ dàng mở rộng gắn Zalo OA (ZNS)
 * ở các giai đoạn sau mà không cần viết lại nghiệp vụ.
 */

export type NotificationChannel = "EMAIL" | "ZALO_ZNS";

export interface OtpDispatchResult {
  delivered: boolean;
  channel: NotificationChannel;
  mode: "DEV_PREVIEW" | "PRODUCTION";
  /** Chỉ trả về ở chế độ thử nghiệm để chủ dự án nhập test trực tiếp trên màn hình */
  devOtpCode?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  sendOtp(recipient: string, code: string): Promise<OtpDispatchResult>;
}

class EmailNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = "EMAIL";

  async sendOtp(recipient: string, code: string): Promise<OtpDispatchResult> {
    // Ở chế độ chạy thử nghiệm cục bộ (chưa cấu hình SMTP), in rõ mã OTP ra console
    // và trả về devOtpCode để hiển thị trên thông báo thử nghiệm tại màn hình Đăng ký.
    console.log("==================================================");
    console.log(`[ANIMORA EMAIL OTP - CHẾ ĐỘ THỬ NGHIỆM]`);
    console.log(`Người nhận : ${recipient}`);
    console.log(`Mã OTP     : ${code}`);
    console.log(`Hiệu lực   : 5 phút`);
    console.log("==================================================");

    return {
      delivered: true,
      channel: "EMAIL",
      mode: "DEV_PREVIEW",
      devOtpCode: code,
    };
  }
}

/**
 * Bộ kết nối dự phòng cho Zalo OA (ZNS) — sẵn sàng kích hoạt sau này.
 */
class ZaloZnsPlaceholderProvider implements NotificationProvider {
  channel: NotificationChannel = "ZALO_ZNS";

  async sendOtp(recipient: string, code: string): Promise<OtpDispatchResult> {
    console.log(`[ANIMORA ZALO ZNS PLACEHOLDER] Gửi OTP ${code} tới ${recipient}`);
    return {
      delivered: false,
      channel: "ZALO_ZNS",
      mode: "DEV_PREVIEW",
    };
  }
}

const providers: Record<NotificationChannel, NotificationProvider> = {
  EMAIL: new EmailNotificationProvider(),
  ZALO_ZNS: new ZaloZnsPlaceholderProvider(),
};

export async function dispatchOtpNotification(
  recipient: string,
  code: string,
  channel: NotificationChannel = "EMAIL"
): Promise<OtpDispatchResult> {
  return providers[channel].sendOtp(recipient, code);
}

export async function dispatchReminderEmail(params: {
  recipientEmail: string;
  recipientName: string;
  petName: string;
  subject: string;
  body: string;
}): Promise<{ delivered: boolean; mode: "DEV_PREVIEW" | "PRODUCTION" }> {
  console.log("==================================================");
  console.log(`[ANIMORA EMAIL NHẮC HẸN TÁI KHÁM / TIÊM PHÒNG]`);
  console.log(`Người nhận : ${params.recipientName} <${params.recipientEmail}>`);
  console.log(`Thú cưng   : ${params.petName}`);
  console.log(`Tiêu đề    : ${params.subject}`);
  console.log(`Nội dung   : ${params.body}`);
  console.log("==================================================");

  return {
    delivered: true,
    mode: "DEV_PREVIEW",
  };
}
