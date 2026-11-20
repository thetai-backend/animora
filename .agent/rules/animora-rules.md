# ANIMORA — QUY TẮC DỰ ÁN BẮT BUỘC (WORKSPACE RULES)

## 1. Cách giao tiếp & Làm việc với Chủ dự án
- Chủ dự án KHÔNG phải lập trình viên. Luôn giao tiếp bằng **Tiếng Việt dễ hiểu**, giải thích theo góc độ vận hành phòng khám, hạn chế tối đa thuật ngữ lập trình phức tạp.
- **BẮT BUỘC lập kế hoạch trước:** Trước khi tạo hoặc sửa tính năng lớn, luôn trình bày Implementation Plan (Kế hoạch) ngắn gọn bằng tiếng Việt và chờ chủ dự án xác nhận.
- Luôn tham chiếu tài liệu đặc tả đầy đủ tại `@docs/SPEC.md` trước khi thiết kế dữ liệu hoặc giao diện.
- Sau mỗi bước làm xong, luôn tự kiểm tra (verify) trên trình duyệt để đảm bảo không có lỗi màn hình trắng, không vỡ giao diện và báo cáo lại cách bấm dùng thử.

## 2. Nền tảng Công nghệ Thống nhất (Tối ưu ổn định, dễ chạy trên 1 máy)
- Xây dựng ứng dụng **Desktop Web** (tối ưu cho màn hình máy tính từ 1280px trở lên, không cần làm giao diện mobile).
- Sử dụng **Next.js (App Router, TypeScript)** + **Tailwind CSS** + **Framer Motion** (cho hiệu ứng động mượt) + **Prisma ORM** + **SQLite** (để chạy cục bộ ngay lập tức không cần cài server phức tạp, cấu trúc schema chuẩn để dễ chuyển sang PostgreSQL sau này).
- Mọi giao diện hiển thị, nút bấm, thông báo lỗi, biểu mẫu in ấn đều dùng **100% Tiếng Việt chuẩn tự nhiên**.

## 3. Nhận diện Thương hiệu ANIMORA (Tuyệt đối tuân thủ)
- **Bảng màu cố định:**
  - Chủ đạo (Primary): `#0F766E` (Xanh Ngọc Y Khoa)
  - Nền sáng (Background/Surface): `#FAF9F6` (Trắng Kem Ấm)
  - Điểm nhấn (Accent/CTA): `#F97316` (Cam San Hô Ấm)
  - Chữ chính (Text): `#132A2E` (Xanh Than Sâu)
- **Font chữ:** `Plus Jakarta Sans` (Logo, Tiêu đề) và `Be Vietnam Pro` (Nội dung, bảng giá, bệnh án, số liệu).
- **Logo động bắt buộc (`AURA` -> `ANIMORA` - khoảng 1.8 giây):**
  1. Hiện `A U R A` với hiệu ứng quét sáng màu xanh ngọc.
  2. Chữ `U` lật ngược 180 độ theo trục dọc kết hợp biến hình mượt thành chữ `N` (tạo hình mái vòm che chở -> `A N R A`).
  3. Hai cụm `AN` và `RA` tách ngang sang hai bên để `I M O` xuất hiện nhịp nhàng vào giữa tạo thành `A N I M O R A`.
  4. Chấm sáng nhỏ màu cam san hô (`#F97316`) bật lên trên đầu chữ `I`.

## 4. 12 Quy tắc Nghiệp vụ Bất Di Bất Dịch (CẤM AI TỰ Ý THAY ĐỔI)
1. **Phạm vi:** 1 cơ sở duy nhất. Giờ mở cửa 07:00 – 20:00, slot mặc định 30 phút. Chia 2 ca (07:00–13:30 và 13:30–20:00) kèm tùy chọn bật/tắt giờ nghỉ trưa 12:00–13:30 do Lễ tân cài đặt.
2. **Shop tham khảo:** Trang quảng cáo hiển thị danh mục sản phẩm mô tả cực kỳ chi tiết để khách tham khảo đến mua trực tiếp. **TUYỆT ĐỐI KHÔNG** tạo giỏ hàng mua online, không có chức năng đặt ship giao tận nhà.
3. **Khách vãng lai (Guest):** Đặt lịch không cần tài khoản, cấp Mã đặt lịch (ví dụ `ANM-8492`) để tự hủy bằng Mã + SĐT không giới hạn thời gian. **KHÔNG** lưu thông tin khách vãng lai vào bảng Hồ sơ Khách hàng/Thú cưng (chỉ lưu tạm trên Phiếu đặt lịch và Hóa đơn, và lưu bệnh án vào danh sách Hồ sơ ca khám).
4. **Đặt lịch:** Không đặt cọc. Cho phép đặt nhiều thú cưng trong 1 phiếu. Tự khóa kín các ô 30p liên tiếp theo thời lượng dịch vụ. Khách chọn bác sĩ hoặc để hệ thống tự gán cho bác sĩ trực ít lịch nhất. Hủy lịch không giới hạn thời gian trước khi vào khám. Quá 20 phút không đến thì dòng booking tự đổi màu Đỏ.
5. **Bác sĩ & Điều phối:** Không phân tách tay nghề Y tế/Spa. Bác sĩ tự đăng ký lịch nghỉ (không cần Quản lý duyệt, khóa lịch ngay). Nghỉ đột xuất trùng lịch khách phải bật **Cảnh báo đỏ** cho Lễ tân. Bác sĩ tự bấm trạng thái (Đang trống / Đang khám / Nghỉ); chỉ đẩy ca Walk-in/Cấp cứu khi bác sĩ Đang trống.
6. **Bệnh án S.O.A.P:** Thuần văn bản (KHÔNG cần chức năng tải file/ảnh X-quang). Tự động **khóa cứng** sau khi hóa đơn đã thanh toán; bác sĩ chỉ được thêm "Ghi chú bổ sung" có lưu thời gian. Hỗ trợ tự động gửi Email nhắc tái khám và bảng nhắc hẹn cho Lễ tân.
7. **Giá dịch vụ:** Mỗi dịch vụ dùng 1 mức giá cố định (không chia theo cân nặng).
8. **Chỉnh sửa hóa đơn tại quầy:** Bác sĩ toàn quyền thêm/bớt dịch vụ & thuốc trước khi đẩy ra Lễ tân. Lễ tân được quyền gộp thêm sản phẩm shop vào cùng hóa đơn khám và được bỏ bớt/sửa số lượng thuốc (bắt buộc lưu lịch sử chỉnh sửa).
9. **Khuyến mãi & Thanh toán:** Được cộng dồn nhiều ưu đãi (trừ khuyến mãi sự kiện/dịch vụ trước, trừ mã giảm giá trên tổng còn lại sau, tổng tối thiểu 0đ). Thanh toán chỉ chọn **1 trong 2**: Tiền mặt HOẶC VietQR tĩnh tự điền sẵn số tiền & mã hóa đơn (không thanh toán hỗn hợp).
10. **Kho & Trừ tồn:** Quy đổi đơn vị nhập lớn (hộp/chai) sang đơn vị bán lẻ nhỏ (viên/ml/liều). **CHỈ trừ tồn kho sau khi Lễ tân bấm "Xác nhận đã thu"** theo nguyên tắc FEFO (lô gần hết hạn nhất trừ trước). Cho phép bán khi tồn kho = 0 (tồn kho âm tạm thời) kèm cảnh báo đỏ. Cảnh báo đỏ mọi lô còn dưới 30 ngày hết hạn. Xuất vật tư tiêu hao dùng Phiếu xuất kho nội bộ.
11. **Hủy hóa đơn & In ấn:** Chỉ Quản lý có quyền Hủy hóa đơn / Trả hàng Shop (tự động hoàn tồn kho). Tất cả biểu mẫu in (Đơn thuốc/Phiếu khám và Hóa đơn) đều thiết kế chuẩn **khổ giấy A4**.
12. **Bảo toàn dữ liệu & Báo cáo:** Xóa mềm nhân sự (Ngừng hoạt động). Thú cưng có trạng thái "Đã mất" (tự động dừng mọi email nhắc lịch). Báo cáo tập trung vào Tổng doanh thu (theo Y tế/Spa/Shop, theo Bác sĩ, bảng chốt ca Tiền mặt vs QR).