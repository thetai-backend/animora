# 1. Tổng quan Phạm vi & Ma trận Phân quyền (RBAC)

- **Nền tảng:** Ứng dụng Web tối ưu riêng cho màn hình máy tính (Desktop Web), vận hành cho 1 cơ sở phòng khám duy nhất.
- **Giờ hoạt động:** 07:00 – 20:00 hàng ngày, chia ô đặt lịch (slot) mặc định 30 phút.
- **Cấu trúc ca trực đề xuất từ mục 1:** Chia làm 2 ca xoay vòng xuyên trưa (Ca sáng: 07:00 – 13:30, Ca chiều: 13:30 – 20:00) để phòng khám luôn có bác sĩ trực liên tục; đồng thời thiết kế sẵn nút bật/tắt khung Nghỉ trưa (12:00 – 13:30) trong phần cài đặt lịch của Lễ tân phòng trường hợp phòng khám muốn đóng cửa buổi trưa.

| Nhóm chức năng | Khách vãng lai | Khách có tài khoản | Lễ tân | Bác sĩ | Quản lý |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Xem Trang quảng cáo, Bảng giá, Sản phẩm Shop, Google Maps** | Có | Có | Có | Có | Có |
| **Đặt lịch online (1 hoặc nhiều thú cưng) & Hủy lịch không giới hạn** | Có (qua Mã + SĐT) | Có | Tạo hộ / Hủy hộ | — | Xem |
| **Quản lý hồ sơ cá nhân & danh sách thú cưng** | — | Tự quản lý | Tạo / Xem | Xem | Toàn quyền |
| **Thiết lập lịch trực cố định hàng tuần & Điều phối lịch** | — | — | Toàn quyền | Tự đăng ký nghỉ | Xem |
| **Cập nhật trạng thái làm việc (Trống / Đang khám / Nghỉ)** | — | — | Xem trực tiếp | Tự cập nhật | Xem |
| **Khám bệnh, ghi bệnh án S.O.A.P & Tạo phiếu hóa đơn** | — | Xem lịch sử của mình | Xem trạng thái | Toàn quyền | Xem tất cả |
| **Thu ngân (Tiền mặt / VietQR), Bán lẻ Shop & In A4** | — | — | Toàn quyền | — | Xem / Hủy hóa đơn |
| **Quản lý Kho, Xuất hủy, Kiểm kê, Sự kiện, Ưu đãi, Nhân sự, CMS, Báo cáo** | — | — | — | Tạo phiếu xuất vật tư nội bộ | Toàn quyền |

---

# 2. Thiết kế Thương hiệu & Trải nghiệm Trang Quảng cáo (Public Web)

## Nhận diện & Hiệu ứng Logo động (`AURA` → `ANIMORA`)
- **Kịch bản chuyển động (1.8 giây):** Xuất hiện `A U R A` với ánh sáng quét màu xanh ngọc → Chữ `U` lật ngược 180° biến hình mượt thành chữ `N` (tạo hình mái vòm bảo vệ thành `A N R A`) → Hai cụm `AN` và `RA` tách ngang để `I M O` trượt vào giữa thành `A N I M O R A` → Chấm sáng màu cam san hô bật lên trên chữ `I`.
- **Bảng màu:**
  - Xanh Ngọc Y Khoa (`#0F766E`): Chủ đạo.
  - Trắng Kem Ấm (`#FAF9F6`): Nền.
  - Cam San Hô (`#F97316`): Điểm nhấn nút hành động.
  - Xanh Than (`#132A2E`): Chữ.
- **Font chữ:**
  - **Plus Jakarta Sans:** Logo/Tiêu đề.
  - **Be Vietnam Pro:** Văn bản y khoa, bảng giá và số liệu.

## Cấu trúc Nội dung Trang Quảng cáo (Động & Đồng bộ từ CMS Quản lý)
1. **Thanh điều hướng cố định:** Logo động ANIMORA, Dịch vụ & Bảng giá, Sản phẩm tại Shop, Đội ngũ Bác sĩ, Sự kiện Ưu đãi, Bản đồ, nút *Đặt lịch ngay*, nút *Tra cứu/Hủy lịch* (Khách vãng lai) và *Đăng nhập / Đăng ký*.
2. **Màn hình mở đầu (Hero):** Hiệu ứng chiều sâu mượt khi cuộn chuột, giới thiệu thế mạnh y khoa của phòng khám và nút gọi hành động tức thì.
3. **Banner Sự kiện & Khuyến mãi:** Tự động hiển thị các chương trình đang chạy do Quản lý tạo (ví dụ: tuần lễ giảm giá tắm cho chó mèo) kèm bộ đếm thời gian hiệu lực.
4. **Dịch vụ & Bảng giá minh bạch:** Phân nhóm *Dịch vụ Y tế* và *Spa/Grooming*. Mỗi dịch vụ hiển thị mức giá cố định, thời lượng ước tính và mô tả quy trình thực hiện.
5. **Thư viện Sản phẩm tại Shop (Mô tả chuyên sâu):** Chỉ phục vụ tham khảo trước khi mua trực tiếp tại quầy (không có giỏ hàng giao tận nhà). Có bộ lọc theo loài/danh mục và trang chi tiết trình bày đầy đủ: ảnh sản phẩm, thương hiệu, giá bán, thành phần chi tiết, công dụng, đối tượng phù hợp, hướng dẫn sử dụng, bảo quản và nhãn trạng thái *"Còn hàng tại quầy"*.
6. **Đội ngũ Bác sĩ:** Thẻ tương tác hiển thị ảnh chân dung, chuyên môn và kinh nghiệm.
7. **Định vị Google Maps:** Bản đồ trực quan hiển thị vị trí phòng khám, giờ mở cửa 07:00 – 20:00, bấm vào mở thẳng chỉ đường trên Google Maps.

---

# 3. Đặc tả Chi tiết 6 Phân hệ Vận hành

## Phân hệ 1: Tài khoản, Xác thực & Thông báo
- **Đăng ký & Đăng nhập:** Hỗ trợ tạo tài khoản bằng Email/Mật khẩu (gửi mã OTP xác thực qua Email miễn phí) và Đăng nhập nhanh bằng Google. Kiến trúc gửi thông báo được thiết kế sẵn lớp kết nối mở để sau này gắn Zalo OA (ZNS) mà không cần viết lại hệ thống.
- **Hồ sơ Khách hàng & Thú cưng:** Khách có tài khoản tự quản lý thông tin cá nhân và thêm không giới hạn thú cưng (Tên, loài, giống, ngày sinh/tuổi, giới tính, tình trạng triệt sản, đặc điểm lông, số microchip, tiền sử dị ứng, lịch sử tiêm phòng/tẩy giun).
- **Khách vãng lai (Guest):** Không lưu vào sổ Hồ sơ Khách hàng / Thú cưng. Khi đặt lịch online, khách nhập thông tin liên hệ + tên/loài thú cưng; dữ liệu này chỉ đính kèm tạm trên đúng Phiếu đặt lịch và Hóa đơn của lượt đó. Hoàn tất đặt lịch sẽ cấp Mã đặt lịch (ví dụ: `ANM-8492`) và gửi xác nhận qua Email (nếu khách điền).

## Phân hệ 2: Đặt lịch (Booking), Lịch trực & Điều phối
- **Lịch trực gốc:** Lễ tân thiết lập lịch làm việc cố định hàng tuần cho từng bác sĩ (không phân tách tay nghề giữa Y tế và Spa).
- **Quy tắc Đặt lịch & Thời lượng:**
  - Khách có thể đặt cho 1 hoặc nhiều thú cưng trong cùng 1 phiếu đặt lịch.
  - Hệ thống cộng dồn thời lượng ước tính của các dịch vụ đã chọn (do Quản lý cài sẵn) để tự động khóa kín các ô 30 phút liên tiếp của bác sĩ.
  - Khách được tự chọn bác sĩ hoặc chọn *"Phòng khám tự phân công"* (hệ thống tự động gán cho bác sĩ đang trực trong khung giờ đó có ít lịch đặt nhất).
  - Không yêu cầu đặt cọc. Khách có tài khoản tự hủy lịch bất cứ lúc nào (miễn chưa vào khám); khách vãng lai nhập Mã đặt lịch + SĐT để tự hủy hoặc nhờ Lễ tân hủy.
- **Quản lý Nghỉ phép & Nghỉ đột xuất của Bác sĩ:**
  - Bác sĩ tự đăng ký ngày/ca nghỉ → hệ thống khóa ngay khung giờ đó trên web đặt lịch (không cần Quản lý duyệt).
  - Nếu bác sĩ bấm *Báo sự cố nghỉ đột xuất* đúng ca đã có lịch hẹn → màn hình Lễ tân lập tức bật **Cảnh báo khẩn màu đỏ** liệt kê các lịch bị ảnh hưởng để Lễ tân bấm *Chuyển bác sĩ khác* hoặc gọi khách dời giờ.
- **Quy tắc Quá giờ hẹn (20 phút) & Điều phối Walk-in/Cấp cứu:**
  - Quá 20 phút so với giờ hẹn mà khách chưa đến và chưa hủy → dòng đặt lịch tự đổi sang **Màu đỏ** để Lễ tân dễ nhận diện. Trạng thái của bác sĩ vẫn là *Trống / Không khám* nên vẫn nhận ca khác bình thường.
  - **Kiểm soát trạng thái thực tế:** Bác sĩ chủ động bấm nút trạng thái (*Đang trống / Đang khám / Nghỉ*). Chỉ khi bác sĩ đang ở trạng thái *Đang trống* thì Lễ tân mới đẩy ca cấp cứu/vãng lai vào; nếu bác sĩ đang bận, Lễ tân trao đổi với khách để điều phối sang bác sĩ khác đang trống ngay trên giao diện.

## Phân hệ 3: Tiếp nhận, Khám bệnh (S.O.A.P) & Nhắc tái khám
- **Luồng Check-in chống trùng phiếu:**
  - **Khách đặt trước:** Đến quầy → Lễ tân bấm *"Khách đã đến"* → ca nhảy vào Hàng chờ khám của bác sĩ → Bác sĩ bấm *"Bắt đầu khám"* (trạng thái bác sĩ tự động chuyển sang *Đang khám*).
  - **Khách vãng lai / Cấp cứu:** Lễ tân tạo phiếu tiếp nhận nhanh và đẩy vào phòng (Bác sĩ chỉ bấm nhận), hoặc Bác sĩ tự bấm *Tạo ca khám khách lẻ* trực tiếp khi cần xử lý gấp.
- **Bệnh án chuẩn thú y S.O.A.P (Thuần văn bản):**
  - Giao diện chia 2 cột:
    - **Bên trái:** Hiện hồ sơ cố định và toàn bộ lịch sử khám các lần trước của thú cưng.
    - **Bên phải:** Biểu mẫu ghi chép 4 mục **S** (Triệu chứng) – **O** (Chỉ số khám lâm sàng: cân nặng, nhiệt độ, nhịp tim...) – **A** (Chẩn đoán) – **P** (Phác đồ, đơn thuốc, hướng dẫn uống & Ngày hẹn tái khám/tiêm nhắc lại).
  - **Tính pháp lý & Lưu trữ:** Ngay khi hóa đơn được xác nhận thanh toán, nội dung S.O.A.P gốc sẽ khóa cứng. Nếu cần đính chính, bác sĩ chỉ được bấm *"Thêm ghi chú bổ sung"* (tự động ghi nhận thời gian và tên người bổ sung). Với ca khám khách vãng lai, nội dung S.O.A.P vẫn được lưu trong mục *Hồ sơ ca khám* để Quản lý kiểm tra khi cần.
- **Nhắc lịch tái khám & Tiêm phòng:** Hệ thống tự động gửi Email nhắc lịch (trước 1–2 ngày) cho khách hàng có tài khoản, đồng thời đẩy lên *Danh sách cần nhắc hẹn* tại màn hình Lễ tân để chủ động gọi điện chăm sóc.
- **Lập phiếu hóa đơn chuyển quầy:** Bác sĩ có toàn quyền thêm/bớt dịch vụ phát sinh và kê đơn thuốc (nhìn rõ tồn kho hiện tại) rồi nhấn *"Gửi Lễ tân thanh toán"*.

## Phân hệ 4: Thu ngân tại quầy (POS), Khuyến mãi & In ấn A4
- **Linh hoạt chỉnh sửa tại quầy (Có lưu vết):**
  - Lễ tân mở phiếu hóa đơn từ Bác sĩ gửi ra, được phép gộp thêm sản phẩm bán lẻ tại shop vào chung hóa đơn để khách thanh toán một lần.
  - Lễ tân được phép bỏ bớt hoặc điều chỉnh số lượng thuốc nếu khách không lấy tại phòng khám; hệ thống tự động ghi lại lịch sử chỉnh sửa (ai sửa, sửa món nào, lúc mấy giờ) để Quản lý đối soát.
  - Lễ tân cũng có màn hình *Bán lẻ Shop* nhanh cho khách chỉ ghé mua đồ mà không khám bệnh.
- **Áp dụng đa Khuyến mãi & Sự kiện:** Cho phép áp dụng nhiều ưu đãi trên cùng 1 hóa đơn theo thứ tự chuẩn: Trừ khuyến mãi theo dịch vụ/sự kiện trước → Trừ tiếp mã giảm giá trên tổng số tiền còn lại (tổng thanh toán tối thiểu bằng `0đ`, không bao giờ âm).
- **Thanh toán (Chọn 1 trong 2 phương thức):**
  - **Tiền mặt:** Nhập tiền khách đưa → tự tính tiền thối → bấm *"Xác nhận đã thu"*.
  - **Chuyển khoản VietQR tĩnh:** Hệ thống tự sinh mã QR ngân hàng của phòng khám đã điền sẵn chính xác số tiền và mã hóa đơn → Khách quét chuyển khoản → Lễ tân kiểm tra tiền về trên điện thoại → bấm *"Xác nhận đã thu"*.
- **Hủy hóa đơn & Trả hàng Shop:** Chỉ duy nhất Quản lý có quyền thao tác. Khi hủy hóa đơn hoặc nhận trả hàng, hệ thống tự động cộng trả đúng số lượng về lại lô hàng tương ứng trong kho và cập nhật lại doanh thu.
- **In ấn chuẩn khổ A4:** Cung cấp mẫu in chuẩn khổ giấy A4 (có logo ANIMORA và thông tin phòng khám) cho cả 2 loại giấy tờ: *Phiếu khám & Đơn thuốc* và *Hóa đơn thanh toán*.

## Phân hệ 5: Quản lý Kho thông minh (Y tế & Shop)
- **Kho hợp nhất & Quy đổi đơn vị:**
  - Quản lý chung 1 tồn kho cho hàng dùng chung (vừa bán lẻ tại shop, vừa kê đơn trong phòng khám) và phân loại rõ nhóm *Thuốc y tế*, *Sản phẩm Shop*, *Vật tư tiêu hao*.
  - Quản lý nhập hàng theo đơn vị lớn (Hộp, Chai, Thùng) kèm Số lô và Hạn sử dụng → hệ thống tự quy đổi sang đơn vị nhỏ nhất (Viên, ml, Liều, Gói) theo hệ số quy đổi cài sẵn.
- **Quy tắc Trừ kho & Tồn kho âm:**
  - Kho chỉ thực sự trừ hàng khi Lễ tân bấm *"Xác nhận đã thu"* (tự động trừ ưu tiên lô có hạn sử dụng gần nhất trước).
  - Khi tồn kho hệ thống bằng 0 (nhưng ngoài kệ vẫn còn hàng chưa kịp nhập phiếu): hiển thị cảnh báo màu đỏ nổi bật nhưng vẫn cho phép kê đơn/bán hàng (chấp nhận tồn kho âm tạm thời để không làm gián đoạn khách).
- **Cảnh báo & Kiểm soát hao hụt:**
  - Tự động liệt kê và tô đỏ mọi lô hàng còn dưới 30 ngày hết hạn sử dụng.
  - **Phiếu xuất kho nội bộ:** Quản lý hoặc Bác sĩ lập phiếu khi xuất vật tư tiêu hao (kim tiêm, bông, cồn, găng tay...) ra phòng khám sử dụng.
  - **Phiếu xuất hủy / Điều chỉnh kiểm kê:** Quản lý lập phiếu kèm lý do rõ ràng khi hủy thuốc hết hạn, hàng hỏng vỡ hoặc cân bằng số liệu kiểm kê định kỳ.

## Phân hệ 6: Quản trị Nhân sự, Sự kiện, CMS & Báo cáo Doanh thu
- **Bảo toàn dữ liệu lịch sử (Xóa mềm):**
  - Quản lý tạo/sửa/khóa tài khoản nhân viên. Khi nhân viên nghỉ việc sẽ chuyển sang trạng thái *Ngừng hoạt động* (chặn đăng nhập nhưng giữ nguyên toàn bộ lịch sử bệnh án và hóa đơn cũ).
  - Hồ sơ thú cưng có trạng thái *"Đã mất"* (giữ lịch sử khám cho Quản lý và tự động ngắt toàn bộ email nhắc tiêm phòng/tái khám để tránh gây phản cảm cho chủ nuôi).
- **Quản lý Sự kiện & Ưu đãi:** Quản lý tạo chiến dịch (giảm theo % hoặc số tiền, chọn dịch vụ/sản phẩm áp dụng, thời gian bắt đầu – kết thúc, bật/tắt hiển thị lên Trang quảng cáo).
- **CMS tự sửa Trang quảng cáo:** Quản lý tự cập nhật bài giới thiệu, ảnh & thông tin bác sĩ, danh mục bảng giá, bài mô tả chi tiết sản phẩm shop và tọa độ/link Google Maps.
- **Hệ thống Báo cáo Tổng doanh thu:**
  - Tổng doanh thu theo ngày / tuần / tháng / năm và biểu đồ xu hướng.
  - Tách riêng tỷ trọng doanh thu theo 3 mảng: *Dịch vụ Y tế*, *Dịch vụ Spa/Grooming*, và *Bán lẻ Shop*.
  - Thống kê số lượng ca khám và doanh thu thực hiện theo từng Bác sĩ.
  - **Bảng đối soát chốt ca cuối ngày:** Tách rạch ròi Tổng tiền mặt và Tổng chuyển khoản QR để Lễ tân bàn giao tiền cuối ngày không sai sót.

---

# 4. Sơ đồ Luồng Vận hành Khép kín (Tóm tắt trực quan)

1. **Tiếp cận:** Khách vào Trang quảng cáo ANIMORA → xem dịch vụ/giá/sản phẩm/bản đồ → Đặt lịch (đăng nhập bằng Google/Email hoặc đặt dạng Khách vãng lai lấy mã `ANM-xxxx`).
2. **Tiếp đón:** Khách đưa thú cưng đến phòng khám → Lễ tân bấm *"Khách đã đến"* (hoặc tiếp nhận ca cấp cứu/walk-in nếu bác sĩ đang *Trống*).
3. **Khám bệnh:** Bác sĩ bấm *"Bắt đầu khám"* (trạng thái tự chuyển *Đang khám*) → xem lịch sử thú cưng → ghi bệnh án S.O.A.P → kê đơn thuốc/dịch vụ phát sinh → bấm *"Gửi Lễ tân"* → chuyển lại trạng thái *Đang trống*.
4. **Thanh toán & Trừ kho:** Lễ tân mở phiếu → gộp thêm đồ Shop hoặc bỏ bớt thuốc theo yêu cầu khách → áp dụng Sự kiện/Mã ưu đãi → thu Tiền mặt hoặc hiện VietQR → bấm *"Xác nhận đã thu"* → hệ thống tự động trừ tồn kho (theo lô gần hết hạn nhất), khóa cứng bệnh án S.O.A.P và mở nút In khổ A4 (Hóa đơn + Đơn thuốc).
5. **Hậu mãi & Quản trị:** Doanh thu tự động cộng vào báo cáo Quản lý & bảng chốt ca Lễ tân; nếu có ngày hẹn tái khám, hệ thống tự động gửi Email nhắc khách có tài khoản trước 1–2 ngày.