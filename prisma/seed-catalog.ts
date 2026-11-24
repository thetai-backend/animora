import { PrismaClient } from ".prisma/client-animora";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌿 Bắt đầu nạp dữ liệu danh mục chân thực cho ANIMORA (bảo toàn 100% bảng User)...");

  const userCountBefore = await prisma.user.count();

  // ==========================================
  // 1. CÀI ĐẶT PHÒNG KHÁM (CLINIC SETTINGS + VIETQR + MAPS)
  // ==========================================
  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {
      clinicName: "Phòng khám Thú y ANIMORA",
      tagline: "Chăm sóc bằng chuẩn y khoa — Yêu thương như người nhà",
      heroTitle: "Y khoa thú nhỏ chuẩn mực trong không gian ấm áp",
      heroSubtitle:
        "Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, bảng giá niêm yết minh bạch và quy trình chăm sóc nhẹ nhàng dành riêng cho chó mèo tại TP. Hồ Chí Minh.",
      address: "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
      phone: "028 3890 2468",
      email: "cskh@animora.vn",
      openTime: "07:00",
      closeTime: "20:00",
      slotDurationMinutes: 30,
      lunchBreakEnabled: false,
      lunchStart: "12:00",
      lunchEnd: "13:30",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=128+Nguyen+Thi+Minh+Khai,+Quan+3,+Ho+Chi+Minh",
      googleMapsEmbedUrl:
        "https://maps.google.com/maps?q=128%20Nguyen%20Thi%20Minh%20Khai%2C%20Quan%203%2C%20Ho%20Chi%20Minh&t=&z=16&ie=UTF8&iwloc=&output=embed",
      latitude: 10.7779,
      longitude: 106.6934,
      bankCode: "MB",
      bankAccountNumber: "08889992468",
      bankAccountName: "PHONG KHAM THU Y ANIMORA",
    },
    create: {
      id: "default",
      clinicName: "Phòng khám Thú y ANIMORA",
      tagline: "Chăm sóc bằng chuẩn y khoa — Yêu thương như người nhà",
      heroTitle: "Y khoa thú nhỏ chuẩn mực trong không gian ấm áp",
      heroSubtitle:
        "Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, bảng giá niêm yết minh bạch và quy trình chăm sóc nhẹ nhàng dành riêng cho chó mèo tại TP. Hồ Chí Minh.",
      address: "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
      phone: "028 3890 2468",
      email: "cskh@animora.vn",
      openTime: "07:00",
      closeTime: "20:00",
      slotDurationMinutes: 30,
      lunchBreakEnabled: false,
      lunchStart: "12:00",
      lunchEnd: "13:30",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=128+Nguyen+Thi+Minh+Khai,+Quan+3,+Ho+Chi+Minh",
      googleMapsEmbedUrl:
        "https://maps.google.com/maps?q=128%20Nguyen%20Thi%20Minh%20Khai%2C%20Quan%203%2C%20Ho%20Chi%20Minh&t=&z=16&ie=UTF8&iwloc=&output=embed",
      latitude: 10.7779,
      longitude: 106.6934,
      bankCode: "MB",
      bankAccountNumber: "08889992468",
      bankAccountName: "PHONG KHAM THU Y ANIMORA",
    },
  });

  // ==========================================
  // 2. DỊCH VỤ & BẢNG GIÁ CỐ ĐỊNH (7 Y TẾ + 5 SPA = 12 GÓI)
  // ==========================================
  const servicesData = [
    // --- NHÓM Y TẾ (MEDICAL) ---
    {
      slug: "kham-lam-sang-tong-quat",
      name: "Khám lâm sàng tổng quát",
      category: "MEDICAL",
      price: 150000,
      durationMinutes: 30,
      shortDescription:
        "Kiểm tra toàn diện thể trạng, nghe tim phổi, đo thân nhiệt, kiểm tra mắt – tai – da lông – răng miệng và tư vấn chăm sóc cá nhân hóa.",
      processSteps:
        "Đo cân nặng, thân nhiệt, nhịp tim – nhịp thở và ghi nhận tiền sử sức khỏe từ chủ nuôi\nThăm khám lâm sàng tim phổi, sờ nắn ổ bụng, kiểm tra hạch ngoại biên, tai, mắt và khoang miệng\nBác sĩ giải thích chi tiết tình trạng sức khỏe, lưu bệnh án S.O.A.P và đề xuất phác đồ hoặc lịch tiêm phù hợp",
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: "tiem-phong-vac-xin-cho-meo",
      name: "Tiêm phòng Vắc-xin 7 bệnh (Chó) / 4 bệnh (Mèo)",
      category: "MEDICAL",
      price: 260000,
      durationMinutes: 30,
      shortDescription:
        "Vắc-xin nhập khẩu chính hãng bảo quản dây chuyền lạnh chuẩn 2–8°C, kèm khám sàng lọc trước tiêm miễn phí và cấp sổ tiêm đầy đủ.",
      processSteps:
        "Khám sàng lọc thân nhiệt, niêm mạc và hô hấp để đảm bảo bé đủ điều kiện miễn dịch trước khi tiêm\nKiểm tra hạn sử dụng, tem niêm phong và số lô vắc-xin trực tiếp trước mặt chủ nuôi\nTiêm dưới da bằng kim siêu mảnh giảm đau, dán tem vào sổ tiêm và theo dõi phản ứng sau tiêm 15 phút",
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: "sieu-am-o-bung-sieu-am-thai",
      name: "Siêu âm ổ bụng / Siêu âm thai màu",
      category: "MEDICAL",
      price: 280000,
      durationMinutes: 30,
      shortDescription:
        "Chẩn đoán hình ảnh độ phân giải cao đánh giá gan, thận, lách, bàng quang, tử cung và theo dõi tuổi thai, nhịp tim thai chính xác.",
      processSteps:
        "Đặt bé nằm thoải mái trên đệm ấm, cạo gọn vùng lông mỏng (nếu cần) và thoa gel siêu âm ấm không gây kích ứng\nBác sĩ chuyên khoa thực hiện quét đầu dò đánh giá toàn bộ cơ quan ổ bụng hoặc đếm số lượng thai & đo nhịp tim thai\nGiải thích trực tiếp trên màn hình siêu âm và lưu đầy đủ kết luận vào bệnh án điện tử S.O.A.P",
      isActive: true,
      sortOrder: 3,
    },
    {
      slug: "xet-nghiem-sinh-hoa-cong-thuc-mau",
      name: "Xét nghiệm sinh hóa & Công thức máu tổng quát",
      category: "MEDICAL",
      price: 490000,
      durationMinutes: 30,
      shortDescription:
        "Phân tích đầy đủ chỉ số hồng cầu, bạch cầu, tiểu cầu và 12 chỉ số chức năng gan – thận – đường huyết, trả kết quả nhanh trong 20 phút.",
      processSteps:
        "Sát khuẩn và lấy mẫu máu tĩnh mạch nhẹ nhàng bằng kim chuyên dụng cho thú nhỏ, hạn chế căng thẳng\nChạy phân tích tự động trên hệ thống máy huyết học & sinh hóa thú y tại phòng xét nghiệm của phòng khám\nBác sĩ đọc chi tiết từng chỉ số bất thường và tư vấn hướng điều trị hoặc điều chỉnh khẩu phần dinh dưỡng",
      isActive: true,
      sortOrder: 4,
    },
    {
      slug: "cao-voi-rang-sieu-am",
      name: "Cạo vôi răng bằng sóng siêu âm & Đánh bóng men răng",
      category: "MEDICAL",
      price: 650000,
      durationMinutes: 60,
      shortDescription:
        "Loại bỏ triệt để mảng bám cao răng, khử mùi hôi miệng và ngăn ngừa viêm nha chu bằng đầu rung siêu âm hiện đại ít tổn thương nướu.",
      processSteps:
        "Khám tim phổi tổng quát, đánh giá mức độ vôi răng, tụt nướu và các răng lung lay trước thủ thuật\nTiền mê an toàn, làm sạch mảng bám trên và dưới viền nướu bằng máy cạo vôi sóng siêu âm chuyên dụng\nĐánh bóng bề mặt men răng hạn chế bám mảng lại, sát khuẩn khoang miệng và theo dõi bé hồi tỉnh hoàn toàn",
      isActive: true,
      sortOrder: 5,
    },
    {
      slug: "triet-san-thu-cung-an-toan",
      name: "Phẫu thuật Triệt sản thú cưng an toàn (Gây mê bay hơi)",
      category: "MEDICAL",
      price: 950000,
      durationMinutes: 90,
      shortDescription:
        "Phẫu thuật đường mổ nhỏ thẩm mỹ bằng chỉ tự tiêu, sử dụng hệ thống gây mê bay hơi Isoflurane an toàn giúp bé hồi tỉnh nhanh và ít đau.",
      processSteps:
        "Khám tiền mê kỹ lưỡng, kiểm tra chỉ số sinh tồn và đặt đường truyền tĩnh mạch bảo vệ xuyên suốt ca mổ\nThực hiện phẫu thuật vô trùng theo quy trình chuẩn y khoa với máy theo dõi nhịp tim – SpO2 liên tục\nTiêm giảm đau – kháng sinh hậu phẫu, theo dõi hồi tỉnh tại phòng riêng yên tĩnh và hướng dẫn chăm sóc vết mổ tại nhà",
      isActive: true,
      sortOrder: 6,
    },
    {
      slug: "tay-giun-phong-ky-sinh-trung",
      name: "Tẩy giun & Phòng trị nội – ngoại ký sinh trùng",
      category: "MEDICAL",
      price: 180000,
      durationMinutes: 30,
      shortDescription:
        "Kiểm tra da lông tìm ve rận, bọ chét, rận tai và cấp thuốc tẩy giun/phòng giun tim định kỳ đúng cân nặng theo phác đồ y khoa.",
      processSteps:
        "Cân đo chính xác trọng lượng cơ thể và soi kiểm tra da lông, ống tai phát hiện ký sinh trùng\nLựa chọn hoạt chất tẩy giun phổ rộng hoặc thuốc nhỏ gáy/viên nhai phù hợp độ tuổi và thể trạng của bé\nBác sĩ hỗ trợ cho bé uống hoặc nhỏ thuốc trực tiếp tại phòng khám và hẹn lịch nhắc định kỳ hàng tháng/quý",
      isActive: true,
      sortOrder: 7,
    },

    // --- NHÓM SPA / GROOMING (SPA) ---
    {
      slug: "tam-ve-sinh-co-ban",
      name: "Gói Tắm vệ sinh cơ bản toàn diện",
      category: "SPA",
      price: 220000,
      durationMinutes: 60,
      shortDescription:
        "Tắm 2 bước với sữa tắm hữu cơ dịu nhẹ theo loại lông, vệ sinh tai, cắt mài móng, vắt tuyến hôi, cạo lông bàn chân và sấy chải bông mượt.",
      processSteps:
        "Kiểm tra nhanh tình trạng da lông, gỡ rối nhẹ, cắt dũa móng tròn mịn và vệ sinh lông đệm bàn chân – vùng bụng\nVệ sinh ống tai, vắt tuyến hôi và tắm nước ấm 2 lượt với sữa tắm pH chuẩn thú y kết hợp massage thư giãn\nSấy khô chuẩn nhiệt độ thấp chống bỏng da, chải bông tơi lông và xịt dưỡng ẩm khử mùi dịu nhẹ",
      isActive: true,
      sortOrder: 8,
    },
    {
      slug: "tam-cat-tia-tao-kieu-chuan-giong",
      name: "Gói Tắm & Cắt tỉa tạo kiểu chuẩn giống",
      category: "SPA",
      price: 420000,
      durationMinutes: 90,
      shortDescription:
        "Trọn gói tắm vệ sinh kết hợp cắt tỉa tạo dáng thẩm mỹ theo chuẩn giống (Teddy, Poodle, Bichon, Corgi, Pomeranian, Mèo sư tử...).",
      processSteps:
        "Kỹ thuật viên tư vấn kiểu dáng phù hợp với chất lông, tỷ lệ khuôn mặt và thói quen sinh hoạt của bé\nThực hiện đầy đủ quy trình tắm vệ sinh 2 bước, dưỡng ẩm lông và sấy đánh tơi dựng form chuẩn trước khi cắt\nCắt tỉa tạo kiểu tỉ mỉ bằng kéo Nhật chuyên nghiệp, hoàn thiện đường nét mặt – chân – đuôi gọn gàng sắc nét",
      isActive: true,
      sortOrder: 9,
    },
    {
      slug: "spa-duong-long-phuc-hoi-tinh-dau",
      name: "Spa dưỡng lông phục hồi tinh dầu thảo mộc",
      category: "SPA",
      price: 350000,
      durationMinutes: 60,
      shortDescription:
        "Ngâm bồn thảo mộc ấm kết hợp ủ tinh dầu yến mạch & argan giúp giảm rụng lông, phục hồi lông xơ rối và nuôi dưỡng làn da khỏe mạnh.",
      processSteps:
        "Làm sạch sâu bụi bẩn, bã nhờn và tế bào chết bằng dầu gội thảo mộc dịu nhẹ không chứa Sulfate\nNgâm ủ bồn thảo mộc ấm pha tinh dầu yến mạch – hoa cúc kết hợp massage lưu thông khí huyết trong 15 phút\nXả sạch, sấy tạo độ bồng tự nhiên, chải loại bỏ lông chết và thoa serum tinh dầu khóa ẩm bóng mượt",
      isActive: true,
      sortOrder: 10,
    },
    {
      slug: "ve-sinh-tai-mong-tuyen-hoi",
      name: "Vệ sinh tai – Cắt mài móng – Vắt tuyến hôi",
      category: "SPA",
      price: 90000,
      durationMinutes: 30,
      shortDescription:
        "Chăm sóc vệ sinh nhanh gọn giữa các kỳ tắm giúp bé chạy nhảy không trơn trượt, không mùi hôi tuyến và ống tai luôn khô thoáng.",
      processSteps:
        "Cạo gọn lông đệm bàn chân giúp tăng độ bám sàn và cắt mài đầu móng tròn mịn tránh trầy xước\nNhổ lông tai nhẹ nhàng và làm sạch sâu ráy tai bằng dung dịch vệ sinh tai không cồn chuẩn thú y\nVắt tuyến hôi đúng kỹ thuật giảm mùi cơ thể và lau sạch khu vực vệ sinh bằng khăn ấm diệt khuẩn",
      isActive: true,
      sortOrder: 11,
    },
    {
      slug: "tam-tri-lieu-da-nhay-cam",
      name: "Tắm trị liệu da liễu chuyên sâu (Nấm / Viêm da)",
      category: "SPA",
      price: 320000,
      durationMinutes: 60,
      shortDescription:
        "Sử dụng dược mỹ phẩm thú y chuyên biệt (Chlorhexidine / Ketoconazole) kết hợp ủ phục hồi hàng rào bảo vệ da cho bé bị nấm hoặc viêm da.",
      processSteps:
        "Soi kiểm tra các mảng da tổn thương, làm mềm và loại bỏ vảy gàu – mảng bám nhẹ nhàng không gây đau rát\nTắm ủ 10 phút với sữa tắm dược liệu thú y giúp diệt nấm men, vi khuẩn và làm dịu nhanh cơn ngứa đỏ\nSấy mát hoàn toàn đảm bảo da khô thoáng tuyệt đối (tránh ẩm tái nấm) và thoa tinh chất làm dịu da",
      isActive: true,
      sortOrder: 12,
    },
  ];

  for (const srv of servicesData) {
    await prisma.service.upsert({
      where: { slug: srv.slug },
      update: {
        name: srv.name,
        category: srv.category,
        price: srv.price,
        durationMinutes: srv.durationMinutes,
        shortDescription: srv.shortDescription,
        processSteps: srv.processSteps,
        isActive: srv.isActive,
        sortOrder: srv.sortOrder,
      },
      create: srv,
    });
  }

  // ==========================================
  // 3. THƯ VIỆN SẢN PHẨM SHOP & KHO HỢP NHẤT (11 SHOP/SHARED + 5 MEDICINE/SUPPLY)
  // ==========================================
  const productsData = [
    // --- SHOP (7 sản phẩm trưng bày trên Lookbook Trang chủ) ---
    {
      slug: "royal-canin-poodle-adult-1-5kg",
      sku: "SP-RC-PD15",
      name: "Hạt Royal Canin Poodle Adult cho Chó Poodle trưởng thành (1.5kg)",
      brand: "Royal Canin (Pháp)",
      group: "SHOP",
      category: "Thức ăn dinh dưỡng",
      targetSpecies: "DOG",
      price: 465000,
      importUnit: "Thùng",
      retailUnit: "Túi",
      conversionRate: 6,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Công thức thiết kế riêng cho chó Poodle trên 10 tháng tuổi với cỡ hạt chữ thập chuyên biệt, nuôi dưỡng bộ lông xoăn mềm và giảm mảng bám răng.",
      ingredients:
        "Ngô, protein gia cầm sấy khô, protein thực vật phân lập (L.I.P), mỡ động vật, gạo, bột ngô, gluten ngô, dầu cá giàu EPA & DHA, dầu lưu ly (0.1%), vỏ hạt mã đề, chiết xuất cúc vạn thọ, vitamin A, D3, E và khoáng chất chelate.",
      benefits:
        "• Dầu lưu ly cùng Omega-3 (EPA & DHA) nuôi dưỡng bộ lông xoăn mềm mượt, hạn chế xơ rối và bạc màu.\n• Kết cấu hạt thiết kế riêng hỗ trợ chà sạch mảng bám, kết hợp chất tạo phức canxi giảm hình thành cao răng.\n• Duy trì khối cơ săn chắc và độ dẻo dai cho chó Poodle hoạt bát.",
      suitableFor: "Chó Poodle trưởng thành từ 10 tháng tuổi trở lên (Toy, Miniature, Standard).",
      usageInstructions:
        "Poodle 2kg: 46–54g/ngày; Poodle 4kg: 78–91g/ngày; Poodle 6kg: 106–124g/ngày. Chia 2 bữa sáng/tối và luôn để sẵn nước sạch.",
      storageInstructions:
        "Kéo kín khóa zip ngay sau khi lấy hạt, bảo quản nơi khô ráo thoáng mát dưới 30°C, tránh ánh nắng trực tiếp.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "royal-canin-indoor-27-meo-trong-nha",
      sku: "SP-RC-IN27",
      name: "Hạt Royal Canin Indoor 27 cho Mèo sống trong nhà (2kg)",
      brand: "Royal Canin (Pháp)",
      group: "SHOP",
      category: "Thức ăn dinh dưỡng",
      targetSpecies: "CAT",
      price: 485000,
      importUnit: "Thùng",
      retailUnit: "Túi",
      conversionRate: 6,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Cân bằng năng lượng hợp lý cho mèo nuôi trong căn hộ ít vận động, giúp giảm rõ rệt mùi phân tới 60% và hỗ trợ đào thải búi lông tự nhiên.",
      ingredients:
        "Protein gia cầm sấy khô (L.I.P tỷ lệ tiêu hóa trên 90%), gạo, lúa mì, ngô, chất béo động vật, xơ thực vật tinh chế, củ cải đường, dầu đậu nành, dầu cá, vỏ hạt mã đề (Psyllium), men tiêu hóa, khoáng chất cân bằng pH tiết niệu.",
      benefits:
        "• Giảm mùi phân lên đến 60% nhờ nguồn đạm siêu tiêu hóa L.I.P hạn chế lên men đường ruột.\n• Kiểm soát hàm lượng chất béo vừa phải giúp mèo giữ vóc dáng cân đối, tránh béo phì.\n• Kết hợp xơ hòa tan và Psyllium hỗ trợ đào thải búi lông an toàn và bảo vệ hệ tiết niệu.",
      suitableFor: "Mèo trưởng thành từ 1 đến 7 tuổi sống chủ yếu trong nhà (Anh Lông Ngắn, Mèo Ta, Ba Tư, Scottish...).",
      usageInstructions:
        "Mèo 3kg: 45g/ngày; Mèo 4kg: 55g/ngày; Mèo 5kg: 65g/ngày. Có thể kết hợp cùng 1 gói pate ẩm để tăng lượng nước nạp mỗi ngày.",
      storageInstructions:
        "Đóng kín miệng túi zip sau mỗi lần dùng, để nơi khô thoáng, tránh khu vực ẩm ướt và côn trùng.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "pate-dinh-duong-phuc-hoi-recovery",
      sku: "SP-VET-REC",
      name: "Pate Dinh dưỡng Phục hồi Royal Canin Recovery (Lon 195g)",
      brand: "Royal Canin Veterinary",
      group: "SHOP",
      category: "Thức ăn dinh dưỡng",
      targetSpecies: "BOTH",
      price: 115000,
      importUnit: "Thùng",
      retailUnit: "Lon",
      conversionRate: 12,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Pate kết cấu mousse siêu mịn mật độ năng lượng cao, chuyên dùng cho chó mèo biếng ăn, sau phẫu thuật triệt sản, sau sinh hoặc đang hồi sức.",
      ingredients:
        "Thịt và phụ phẩm gia cầm chọn lọc, dầu cá tinh luyện giàu EPA/DHA, dầu hướng dương, tinh bột ngô, khoáng chất thiết yếu, tổ hợp chất chống oxy hóa Vitamin E, C, Taurine và Lutein.",
      benefits:
        "• Mật độ năng lượng cao giúp bù đắp dinh dưỡng ngay cả khi bé chỉ ăn được khẩu phần rất nhỏ.\n• Kết cấu mousse siêu mịn dễ liếm trực tiếp hoặc pha loãng nhẹ cho ăn bằng xi-lanh khi bé suy nhược.\n• Giàu protein chất lượng cao hỗ trợ nhanh liền vết mổ và tăng sức đề kháng.",
      suitableFor: "Chó và mèo suy nhược, kén ăn, vừa trải qua phẫu thuật, điều trị bệnh nặng hoặc chó mèo mẹ sau sinh.",
      usageInstructions:
        "Bé 2kg: 1/3 lon/ngày; Bé 4kg: 2/3 – 1 lon/ngày chia nhiều bữa nhỏ hoặc theo chỉ định cụ thể của bác sĩ điều trị.",
      storageInstructions:
        "Lon chưa mở bảo quản nhiệt độ phòng. Sau khi mở nắp, đậy kín bảo quản ngăn mát tủ lạnh và dùng hết trong 48 giờ.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "sua-tam-thao-moc-duong-long-animora",
      sku: "SP-SHP-HRB",
      name: "Sữa tắm Thảo mộc Yến mạch & Lô hội dưỡng lông DermaCare (300ml)",
      brand: "Virbac / DermaCare",
      group: "SHOP",
      category: "Sữa tắm & Chăm sóc",
      targetSpecies: "BOTH",
      price: 295000,
      importUnit: "Thùng",
      retailUnit: "Chai",
      conversionRate: 12,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Công thức không xà phòng pH cân bằng 6.5–7.0 dịu nhẹ cho làn da nhạy cảm, giúp làm dịu mẩn ngứa, giảm rụng lông và lưu hương thảo mộc thanh mát.",
      ingredients:
        "Chiết xuất yến mạch keo 2%, gel lô hội hữu cơ, tinh dầu hoa cúc La Mã, Panthenol (Pro-Vitamin B5), Ceramide thực vật, chất làm sạch nguồn gốc dừa dịu nhẹ không chứa Paraben & Sulfate.",
      benefits:
        "• Làm dịu nhanh vùng da khô, bong tróc, mẩn đỏ và giảm tình trạng gãi ngứa sau tắm.\n• Giữ nguyên lớp dầu bảo vệ tự nhiên của da thú cưng nhờ pH chuẩn thú y.\n• Giúp bộ lông mềm tơi, dễ chải gỡ rối và thơm sạch tự nhiên suốt 5–7 ngày.",
      suitableFor: "Chó và mèo từ 8 tuần tuổi trở lên, đặc biệt phù hợp bé có làn da nhạy cảm hoặc lông dễ khô xơ.",
      usageInstructions:
        "Làm ướt toàn thân bằng nước ấm, lấy lượng vừa đủ tạo bọt massage nhẹ nhàng 5 phút rồi xả thật sạch với nước và sấy khô.",
      storageInstructions:
        "Đậy kín nắp sau khi sử dụng, đặt nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp và tầm tay trẻ em.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "dung-dich-ve-sinh-tai-epi-otic",
      sku: "SP-EAR-EPI",
      name: "Dung dịch Vệ sinh Tai không cồn Virbac Epi-Otic (125ml)",
      brand: "Virbac (Pháp)",
      group: "SHOP",
      category: "Sữa tắm & Chăm sóc",
      targetSpecies: "BOTH",
      price: 265000,
      importUnit: "Hộp",
      retailUnit: "Chai",
      conversionRate: 10,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Dung dịch làm sạch sâu ráy tai, khử mùi hôi ống tai và hỗ trợ phòng ngừa viêm tai ngoài tái phát với công thức không cồn dịu nhẹ không gây xót.",
      ingredients:
        "Salicylic acid 0.2%, Docusate sodium, PCMX, EDTA, phức hợp đường monosaccharide trung hòa bám dính vi khuẩn (Glycotechnology), pH trung tính 7.0.",
      benefits:
        "• Làm mềm và đẩy sạch ráy tai tích tụ sâu trong ống tai mà không cần dùng tăm bông thọc sâu.\n• Hỗ trợ cân bằng hệ vi sinh ống tai, ngăn ngừa vi khuẩn và nấm men phát triển.\n• Công thức không cồn, không gây kích ứng cho cả chó tai cụp và mèo nhạy cảm.",
      suitableFor: "Chó và mèo vệ sinh tai định kỳ hàng tuần (đặc biệt các giống tai cụp như Poodle, Cocker, Corgi, Mèo tai cụp).",
      usageInstructions:
        "Nhỏ 5–8 giọt vào mỗi bên ống tai, xoa nhẹ gốc tai 30 giây để dung dịch hòa tan ráy tai, để bé lắc tự nhiên rồi dùng bông gòn sạch lau vành tai.",
      storageInstructions:
        "Đóng chặt đầu vòi sau khi dùng, bảo quản ở nhiệt độ phòng 15–30°C.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "cat-dau-nanh-khu-mui-tofu-6l",
      sku: "SP-CAT-TOFU",
      name: "Cát Đậu nành Hữu cơ Khử mùi Vón cực nhanh Tofu Care (6L)",
      brand: "Animora PetCare",
      group: "SHOP",
      category: "Vệ sinh & Phụ kiện",
      targetSpecies: "CAT",
      price: 145000,
      importUnit: "Thùng",
      retailUnit: "Bao",
      conversionRate: 6,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Cát vệ sinh từ 100% bã đậu nành tự nhiên, ít bụi bảo vệ hô hấp cho mèo và chủ nuôi, vón cục trong 3 giây và tan nhanh an toàn khi xả bồn cầu.",
      ingredients:
        "Bã đậu nành thực phẩm tự nhiên, tinh bột ngô, chiết xuất trà xanh & than hoạt tính khử mùi, keo thực vật Guar Gum an toàn nếu mèo lỡ liếm chân.",
      benefits:
        "• Hạn chế tới 99% bụi mịn, bảo vệ đường hô hấp nhạy cảm của mèo con và mèo mũi tịt.\n• Thấm hút gấp 4 lần trọng lượng, vón khối chắc không bết đáy khay và khóa mùi amoniac hiệu quả.\n• Phân hủy sinh học thân thiện môi trường, có thể xả từng lượng nhỏ trực tiếp vào bồn cầu.",
      suitableFor: "Mọi giống mèo và độ tuổi từ mèo con tập đi vệ sinh đến mèo trưởng thành nuôi trong căn hộ.",
      usageInstructions:
        "Đổ lớp cát dày 5–7cm vào khay vệ sinh. Xúc bỏ phần cát vón mỗi ngày và bổ sung thêm cát mới; thay toàn bộ khay định kỳ 2–3 tuần.",
      storageInstructions:
        "Kẹp kín miệng túi sau khi mở, để nơi khô thoáng tránh nền nhà ẩm ướt làm cát hút ẩm.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "luoc-chai-long-go-roi-chuyen-nghiep",
      sku: "SP-ACC-BRU",
      name: "Lược chải gỡ rối & Lấy lông chết đầu bọc massage bảo vệ da",
      brand: "FurCare Studio",
      group: "SHOP",
      category: "Vệ sinh & Phụ kiện",
      targetSpecies: "BOTH",
      price: 185000,
      importUnit: "Thùng",
      retailUnit: "Cái",
      conversionRate: 20,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Răng thép không gỉ uốn cong 135° bọc hạt nhựa tròn massage da, lấy sạch tới 90% lông rụng và có nút bấm đẩy mảng lông chỉ với 1 chạm.",
      ingredients:
        "Thân nhựa ABS nguyên sinh cầm êm tay chống trượt, mặt lược răng thép không gỉ 304 đàn hồi uốn cong 135° bọc đầu hạt nhựa bảo vệ biểu bì.",
      benefits:
        "• Lấy sạch lớp lông chết dưới tầng lông lót, hạn chế tình trạng rối bết và mèo nuốt phải búi lông.\n• Đầu răng bọc hạt nhựa tròn massage kích thích tuần hoàn da mà không làm trầy xước.\n• Cơ chế nút bấm đẩy lông 1 chạm giúp vệ sinh lược trong 2 giây.",
      suitableFor: "Chó và mèo lông ngắn, lông dài và lông 2 lớp (Poodle, Corgi, Phốc sóc, Golden, Mèo Anh, Mèo Ba Tư).",
      usageInstructions:
        "Chải nhẹ theo chiều mọc của lông 2–3 lần/tuần (mỗi lần 5–10 phút), nhấn nút phía sau lưng lược để đẩy gọn lớp lông rụng.",
      storageInstructions:
        "Làm sạch lông sau mỗi lần chải, rửa nước ấm định kỳ và lau khô hoàn toàn để giữ độ bền răng lược.",
      isFeaturedOnWeb: true,
      isActive: true,
    },

    // --- HÀNG DÙNG CHUNG (SHARED: 4 sản phẩm vừa kê đơn vừa trưng bày bán tại Shop) ---
    {
      slug: "nexgard-spectra-tri-ve-ran-giun-tim",
      sku: "DC-NEX-M",
      name: "Viên nhai trị ve rận & phòng giun tim NexGard Spectra (Chó 3.5–7.5kg)",
      brand: "Boehringer Ingelheim (Pháp)",
      group: "SHARED",
      category: "Phòng trị ký sinh trùng",
      targetSpecies: "DOG",
      price: 245000,
      importUnit: "Hộp",
      retailUnit: "Viên",
      conversionRate: 3,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Viên nhai vị thịt bò thơm ngon bảo vệ toàn diện nội & ngoại ký sinh trùng suốt 30 ngày: diệt ve, bọ chét, ghẻ Demodex, giun đường ruột và phòng giun tim.",
      ingredients:
        "Afoxolaner 18.75 mg, Milbemycin oxime 3.75 mg, tá dược tạo hương thịt bò thực vật an toàn cho chó nhạy cảm đạm động vật.",
      benefits:
        "• Tiêu diệt bọ chét trong vòng 8 giờ và ve chó trong vòng 24–48 giờ sau khi ăn.\n• Ngăn ngừa hiệu quả bệnh giun tim nguy hiểm và tẩy sạch giun đũa, giun móc, giun tóc.\n• Không lo rửa trôi khi tắm Spa như thuốc nhỏ gáy, dễ cho ăn như bánh thưởng.",
      suitableFor: "Chó từ 8 tuần tuổi trở lên có cân nặng từ 3.5kg đến 7.5kg.",
      usageInstructions:
        "Cho chó nhai trực tiếp 1 viên duy nhất mỗi tháng (trước hoặc sau ăn đều được). Cần cân chính xác để chọn đúng phân hạng cân nặng.",
      storageInstructions:
        "Giữ nguyên trong vỉ nhôm cho tới khi sử dụng, bảo quản nơi khô thoáng dưới 30°C.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "revolution-plus-nho-gay-cho-meo",
      sku: "DC-REV-CAT",
      name: "Thuốc nhỏ gáy phòng trị ve rận, rận tai & giun tim Revolution Plus cho Mèo (2.6–5kg)",
      brand: "Zoetis (Mỹ)",
      group: "SHARED",
      category: "Phòng trị ký sinh trùng",
      targetSpecies: "CAT",
      price: 235000,
      importUnit: "Hộp",
      retailUnit: "Tuýp",
      conversionRate: 3,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Giải pháp nhỏ gáy 6 trong 1 hàng tháng cho mèo: đặc trị rận tai, bọ chét, ve, giun đũa, giun móc và phòng ngừa giun tim an toàn.",
      ingredients:
        "Selamectin 30 mg, Sarolaner 5 mg trong dung dịch thấm nhanh khô thoáng không gây bết lông gáy.",
      benefits:
        "• Tác động kép diệt sạch cả bọ chét, ve và rận tai Otodectes gây ngứa lắc đầu ở mèo.\n• Phòng ngừa giun tim và các loại giun đường tiêu hóa phổ biến chỉ với 1 lần nhỏ mỗi tháng.\n• Dung dịch thẩm thấu nhanh, không gây stress như việc ép mèo uống thuốc viên.",
      suitableFor: "Mèo từ 8 tuần tuổi trở lên có cân nặng từ 2.6kg đến 5kg.",
      usageInstructions:
        "Vạch sát lông vùng gáy giữa 2 bả vai (nơi mèo không liếm tới), nhỏ hết 1 tuýp trực tiếp lên da. Tránh tắm cho bé trong 48 giờ sau khi nhỏ.",
      storageInstructions:
        "Bảo quản nơi khô mát dưới 30°C, tránh nguồn nhiệt và ánh sáng mạnh.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "gel-dinh-duong-bo-sung-vitamin-nutriplus",
      sku: "DC-NUT-GEL",
      name: "Gel Dinh dưỡng Bổ sung Vitamin & Năng lượng Virbac Nutri-Plus Gel (Tuýp 120.5g)",
      brand: "Virbac (Pháp)",
      group: "SHARED",
      category: "Dinh dưỡng & Phục hồi",
      targetSpecies: "BOTH",
      price: 215000,
      importUnit: "Thùng",
      retailUnit: "Tuýp",
      conversionRate: 12,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Gel bổ sung năng lượng đậm đặc, 10 loại vitamin thiết yếu và khoáng chất vi lượng dành cho chó mèo biếng ăn, chậm lớn, mang thai hoặc mới ốm dậy.",
      ingredients:
        "Siro glucose, dầu đậu nành, dầu gan cá tuyết giàu Omega-3, mật mía, protein động vật thủy phân, Vitamin A, D3, E, B1, B2, B6, B12, Niacin, Acid folic, Sắt, Mangan và I-ốt.",
      benefits:
        "• Cung cấp năng lượng hấp thu tức thì cho bé suy nhược, bỏ ăn hoặc hạ đường huyết ở chó mèo con.\n• Kích thích vị giác tự nhiên, hỗ trợ phục hồi thể trạng nhanh sau phẫu thuật và tiêm phòng.\n• Bổ sung đầy đủ vi chất cho chó mèo mẹ đang mang thai và cho con bú.",
      suitableFor: "Chó và mèo ở mọi lứa tuổi: biếng ăn, suy dinh dưỡng, đang phát triển, vận động mạnh hoặc đang hồi phục sức khỏe.",
      usageInstructions:
        "1–2 muỗng cà phê (khoảng 5–10cm gel) cho mỗi 5kg thể trọng mỗi ngày. Có thể cho liếm trực tiếp hoặc trộn cùng thức ăn.",
      storageInstructions:
        "Vặn kín nắp tuýp sau mỗi lần dùng, bảo quản nơi khô ráo dưới 25°C.",
      isFeaturedOnWeb: true,
      isActive: true,
    },
    {
      slug: "men-tieu-hoa-thu-y-bio-flora",
      sku: "DC-BIO-FLR",
      name: "Men tiêu hóa sống thú y phục hồi đường ruột Bio-Flora (Gói 5g)",
      brand: "BioPharmachemie",
      group: "SHARED",
      category: "Hỗ trợ tiêu hóa",
      targetSpecies: "BOTH",
      price: 15000,
      importUnit: "Hộp",
      retailUnit: "Gói",
      conversionRate: 20,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Bổ sung hàng tỷ lợi khuẩn sống và enzyme tiêu hóa hỗ trợ cầm tiêu chảy, giảm đầy hơi, ổn định phân và kích thích thèm ăn cho chó mèo.",
      ingredients:
        "Bacillus subtilis, Lactobacillus acidophilus, Saccharomyces boulardii, Enzyme Amylase – Protease, Prebiotic FOS và Vitamin nhóm B.",
      benefits:
        "• Nhanh chóng tái lập cân bằng hệ vi sinh đường ruột sau khi dùng kháng sinh hoặc đổi thức ăn đột ngột.\n• Hỗ trợ giảm tình trạng phân lỏng, phân sống và giảm mùi hôi khó chịu.\n• Tăng khả năng hấp thu dinh dưỡng cho chó mèo con đường ruột yếu.",
      suitableFor: "Chó và mèo bị rối loạn tiêu hóa, tiêu chảy nhẹ, đang sử dụng kháng sinh hoặc cần hỗ trợ tiêu hóa hàng ngày.",
      usageInstructions:
        "Chó mèo dưới 5kg: 1/2 gói/lần; từ 5kg trở lên: 1 gói/lần, ngày 2 lần. Pha nước ấm dưới 40°C hoặc trộn trực tiếp vào pate/thức ăn.",
      storageInstructions:
        "Bảo quản nơi khô thoáng dưới 25°C, tránh ánh sáng trực tiếp và độ ẩm cao.",
      isFeaturedOnWeb: true,
      isActive: true,
    },

    // --- THUỐC Y TẾ & VẬT TƯ TIÊU HAO TRONG KHO (5 mặt hàng nội bộ, quy đổi đơn vị chuẩn) ---
    {
      slug: "khang-sinh-thu-y-amoxicillin-clavulanate",
      sku: "TH-AMOX-250",
      name: "Kháng sinh thú y Amoxicillin-Clavulanate 250mg (Clavamox)",
      brand: "Zoetis (Mỹ)",
      group: "MEDICINE",
      category: "Thuốc kê đơn",
      targetSpecies: "BOTH",
      price: 18000,
      importUnit: "Hộp",
      retailUnit: "Viên",
      conversionRate: 100, // 1 Hộp = 100 Viên
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Kháng sinh phổ rộng kê đơn điều trị nhiễm khuẩn đường hô hấp, viêm da mủ, nhiễm trùng tiết niệu và mô mềm ở chó mèo.",
      ingredients: "Amoxicillin trihydrate 200 mg + Clavulanic acid (dạng muối Kali) 50 mg.",
      benefits:
        "Điều trị đặc hiệu các ca nhiễm khuẩn nhạy cảm, bền vững trước men beta-lactamase của vi khuẩn.",
      suitableFor: "Chó và mèo theo đơn kê trực tiếp của Bác sĩ thú y.",
      usageInstructions: "Liều tham khảo 12.5 mg/kg mỗi 12 giờ sau ăn trong 5–7 ngày theo chỉ định bác sĩ.",
      storageInstructions: "Nơi khô ráo dưới 25°C, giữ nguyên vỉ chống ẩm, tránh ánh sáng.",
      isFeaturedOnWeb: false,
      isActive: true,
    },
    {
      slug: "dung-dich-truyen-ringer-lactate-100ml",
      sku: "TH-RNG-100",
      name: "Dung dịch truyền điện giải thú y Ringer Lactate (Tính theo ml)",
      brand: "B.Braun VetCare",
      group: "MEDICINE",
      category: "Dung dịch truyền",
      targetSpecies: "BOTH",
      price: 1500,
      importUnit: "Chai",
      retailUnit: "ml",
      conversionRate: 100, // 1 Chai = 100 ml
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Dung dịch truyền tĩnh mạch đẳng trương bù nước, cân bằng điện giải và toan kiềm trong hồi sức cấp cứu, tiêu chảy mất nước hoặc phẫu thuật.",
      ingredients: "Natri clorid, Kali clorid, Calci clorid dihydrat, Natri lactat, nước cất pha tiêm vô trùng.",
      benefits:
        "Nhanh chóng bù khối lượng tuần hoàn và điện giải sinh lý an toàn cho chó mèo.",
      suitableFor: "Sử dụng điều trị nội trú và cấp cứu dưới giám sát của Bác sĩ thú y.",
      usageInstructions: "Truyền tĩnh mạch theo tốc độ tính theo cân nặng và mức độ mất nước do bác sĩ chỉ định.",
      storageInstructions: "Bảo quản dưới 30°C, không làm đông đá, chỉ sử dụng khi dung dịch trong suốt.",
      isFeaturedOnWeb: false,
      isActive: true,
    },
    {
      slug: "vac-xin-7-benh-cho-vanguard-plus",
      sku: "TH-VAC-7B",
      name: "Vắc-xin 7 bệnh cho Chó Vanguard Plus 5/CV-L (Liều)",
      brand: "Zoetis (Mỹ)",
      group: "MEDICINE",
      category: "Vắc-xin thú y",
      targetSpecies: "DOG",
      price: 260000,
      importUnit: "Hộp",
      retailUnit: "Liều",
      conversionRate: 25, // 1 Hộp = 25 Liều
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Vắc-xin đa giá phòng 7 bệnh truyền nhiễm nguy hiểm ở chó (Care, Parvo, Viêm gan, Phó cúm, Ho cũi chó, Corona, Lepto).",
      ingredients: "Virus nhược độc đông khô kết hợp dung môi vô hoạt Leptospira & Coronavirus.",
      benefits: "Tạo miễn dịch bền vững bảo vệ chó con và chó trưởng thành.",
      suitableFor: "Chó khỏe mạnh từ 6 tuần tuổi trở lên theo phác đồ tiêm phòng.",
      usageInstructions: "Pha hoàn nguyên ngay trước khi tiêm dưới da 1ml/liều bởi bác sĩ thú y.",
      storageInstructions: "Bắt buộc bảo quản dây chuyền lạnh 2–8°C, không để đóng băng.",
      isFeaturedOnWeb: false,
      isActive: true,
    },
    {
      slug: "kim-tiem-vo-trung-1ml-dung-1-lan",
      sku: "VT-KIM-1ML",
      name: "Bơm kim tiêm vô trùng 1ml dùng 1 lần đầu kim siêu mảnh",
      brand: "Vinahankook Medical",
      group: "SUPPLY",
      category: "Vật tư tiêu hao",
      targetSpecies: "BOTH",
      price: 2000,
      importUnit: "Hộp",
      retailUnit: "Cái",
      conversionRate: 100, // 1 Hộp = 100 Cái
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Bơm kim tiêm 1ml tiệt trùng khí EO dùng một lần cho tiêm phòng, tiêm thuốc chính xác liều nhỏ và lấy mẫu thú nhỏ.",
      ingredients: "Nhựa y tế PP trong suốt có vạch chia chính xác, kim thép không gỉ sắc bén giảm đau.",
      benefits: "Đảm bảo vô khuẩn tuyệt đối 1 bé – 1 kim, giảm đau tối đa cho chó mèo.",
      suitableFor: "Vật tư tiêu hao sử dụng nội bộ tại phòng khám thú y.",
      usageInstructions: "Xé bao bì ngay trước khi dùng, hủy vào hộp đựng vật sắc nhọn y tế sau 1 lần sử dụng.",
      storageInstructions: "Nơi khô ráo, thoáng mát, tránh ẩm ướt làm rách bao bì vô trùng.",
      isFeaturedOnWeb: false,
      isActive: true,
    },
    {
      slug: "bong-gon-con-sat-khuan-70-do",
      sku: "VT-CON-70",
      name: "Combo Bông gòn y tế & Cồn sát khuẩn 70 độ phòng khám (Chai 500ml)",
      brand: "OPC Pharma",
      group: "SUPPLY",
      category: "Vật tư tiêu hao",
      targetSpecies: "BOTH",
      price: 35000,
      importUnit: "Thùng",
      retailUnit: "Chai",
      conversionRate: 20, // 1 Thùng = 20 Chai
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Dung dịch Ethanol 70% kèm bông y tế thấm nước dùng sát khuẩn bề mặt da trước tiêm truyền, vệ sinh bàn khám và dụng cụ.",
      ingredients: "Ethanol tinh khiết 70% (v/v), nước tinh khiết đạt chuẩn dược điển.",
      benefits: "Sát khuẩn nhanh, bay hơi sạch không để lại cặn nhờn trên da và dụng cụ.",
      suitableFor: "Vật tư tiêu hao nội bộ tại phòng khám, phòng tiểu phẫu và khu vực Spa.",
      usageInstructions: "Thấm dung dịch vào bông gòn sạch lau sát khuẩn ngoài da hoặc bề mặt bàn khám.",
      storageInstructions: "Đậy kín nắp ngay sau khi dùng, tránh xa nguồn nhiệt và tia lửa.",
      isFeaturedOnWeb: false,
      isActive: true,
    },
  ];

  const productMap: Record<string, { id: string; conversionRate: number }> = {};

  for (const prod of productsData) {
    const saved = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        brand: prod.brand,
        group: prod.group,
        category: prod.category,
        targetSpecies: prod.targetSpecies,
        price: prod.price,
        importUnit: prod.importUnit,
        retailUnit: prod.retailUnit,
        conversionRate: prod.conversionRate,
        imageUrl: prod.imageUrl,
        shortDescription: prod.shortDescription,
        ingredients: prod.ingredients,
        benefits: prod.benefits,
        suitableFor: prod.suitableFor,
        usageInstructions: prod.usageInstructions,
        storageInstructions: prod.storageInstructions,
        isFeaturedOnWeb: prod.isFeaturedOnWeb,
        isActive: prod.isActive,
      },
      create: {
        ...prod,
        stockQuantity: 0,
      },
    });
    productMap[prod.sku] = { id: saved.id, conversionRate: saved.conversionRate };
  }

  // ==========================================
  // 4. LÔ HÀNG ĐA LÔ (INVENTORY BATCH — GỒM ĐÚNG 2 LÔ CẬN DATE < 30 NGÀY)
  // ==========================================
  const batchSeeds: {
    sku: string;
    batchNumber: string;
    expiryDays: number;
    importedPackages: number;
    remainingQuantity: number;
    importNote: string;
  }[] = [
    // 2 LÔ CẬN DATE (< 30 NGÀY) ĐỂ HIỂN THỊ CẢNH BÁO ĐỎ RÕ RÀNG TRÊN KHO & DASHBOARD
    {
      sku: "TH-AMOX-250",
      batchNumber: "AMOX-26A1",
      expiryDays: 14, // < 30 ngày -> Cảnh báo ĐỎ
      importedPackages: 1,
      remainingQuantity: 35,
      importNote: "Lô cận date (< 30 ngày) — ưu tiên trừ trước theo FEFO",
    },
    {
      sku: "DC-NEX-M",
      batchNumber: "NEX-26A8",
      expiryDays: 21, // < 30 ngày -> Cảnh báo ĐỎ
      importedPackages: 2,
      remainingQuantity: 6,
      importNote: "Lô cận date (< 30 ngày) — ưu tiên xuất trước FEFO",
    },

    // CÁC LÔ HÀNG HẠN DÀI AN TOÀN (180 - 540 NGÀY)
    {
      sku: "TH-AMOX-250",
      batchNumber: "AMOX-27B4",
      expiryDays: 365,
      importedPackages: 2,
      remainingQuantity: 200,
      importNote: "Lô nhập mới kháng sinh chính hãng Zoetis (2 hộp × 100 viên)",
    },
    {
      sku: "DC-NEX-M",
      batchNumber: "NEX-27C2",
      expiryDays: 390,
      importedPackages: 4,
      remainingQuantity: 12,
      importNote: "Lô nhập mới viên nhai NexGard Spectra (4 hộp × 3 viên)",
    },
    {
      sku: "SP-RC-PD15",
      batchNumber: "RCPD-2701",
      expiryDays: 320,
      importedPackages: 3,
      remainingQuantity: 18,
      importNote: "Lô nhập khẩu Royal Canin Poodle Adult (3 thùng × 6 túi)",
    },
    {
      sku: "SP-RC-IN27",
      batchNumber: "RCIN-2702",
      expiryDays: 340,
      importedPackages: 3,
      remainingQuantity: 18,
      importNote: "Lô nhập khẩu Royal Canin Indoor 27 (3 thùng × 6 túi)",
    },
    {
      sku: "SP-VET-REC",
      batchNumber: "RCRC-2703",
      expiryDays: 420,
      importedPackages: 2,
      remainingQuantity: 24,
      importNote: "Lô pate phục hồi thú y (2 thùng × 12 lon)",
    },
    {
      sku: "SP-SHP-HRB",
      batchNumber: "SHPH-2704",
      expiryDays: 450,
      importedPackages: 1,
      remainingQuantity: 12,
      importNote: "Lô sữa tắm thảo mộc yến mạch (1 thùng × 12 chai)",
    },
    {
      sku: "SP-EAR-EPI",
      batchNumber: "EPIO-2705",
      expiryDays: 380,
      importedPackages: 1,
      remainingQuantity: 10,
      importNote: "Lô dung dịch vệ sinh tai Epi-Otic (1 hộp × 10 chai)",
    },
    {
      sku: "SP-CAT-TOFU",
      batchNumber: "TOFU-2706",
      expiryDays: 500,
      importedPackages: 4,
      remainingQuantity: 24,
      importNote: "Lô cát đậu nành hữu cơ khử mùi (4 thùng × 6 bao)",
    },
    {
      sku: "SP-ACC-BRU",
      batchNumber: "BRSH-2707",
      expiryDays: 540,
      importedPackages: 1,
      remainingQuantity: 15,
      importNote: "Lô lược chải gỡ rối đầu bọc massage",
    },
    {
      sku: "DC-REV-CAT",
      batchNumber: "REVC-2708",
      expiryDays: 330,
      importedPackages: 4,
      remainingQuantity: 12,
      importNote: "Lô thuốc nhỏ gáy mèo Revolution Plus (4 hộp × 3 tuýp)",
    },
    {
      sku: "DC-NUT-GEL",
      batchNumber: "NUTG-2709",
      expiryDays: 300,
      importedPackages: 1,
      remainingQuantity: 12,
      importNote: "Lô gel dinh dưỡng Nutri-Plus Gel (1 thùng × 12 tuýp)",
    },
    {
      sku: "DC-BIO-FLR",
      batchNumber: "BIOF-2710",
      expiryDays: 290,
      importedPackages: 2,
      remainingQuantity: 40,
      importNote: "Lô men tiêu hóa sống thú y (2 hộp × 20 gói)",
    },
    {
      sku: "TH-RNG-100",
      batchNumber: "RING-2711",
      expiryDays: 360,
      importedPackages: 10,
      remainingQuantity: 1000,
      importNote: "Lô dung dịch truyền Ringer Lactate (10 chai × 100 ml)",
    },
    {
      sku: "TH-VAC-7B",
      batchNumber: "VANG-2712",
      expiryDays: 240,
      importedPackages: 2,
      remainingQuantity: 50,
      importNote: "Lô vắc-xin 7 bệnh bảo quản lạnh 2–8°C (2 hộp × 25 liều)",
    },
    {
      sku: "VT-KIM-1ML",
      batchNumber: "KIM1-2713",
      expiryDays: 540,
      importedPackages: 3,
      remainingQuantity: 300,
      importNote: "Lô bơm kim tiêm vô trùng 1ml (3 hộp × 100 cái)",
    },
    {
      sku: "VT-CON-70",
      batchNumber: "CON7-2714",
      expiryDays: 420,
      importedPackages: 1,
      remainingQuantity: 20,
      importNote: "Lô cồn sát khuẩn 70 độ & bông y tế (1 thùng × 20 chai)",
    },
  ];

  for (const b of batchSeeds) {
    const prod = productMap[b.sku];
    if (!prod) continue;
    const initialQuantity = b.importedPackages * prod.conversionRate;
    const expiryDate = daysFromNow(b.expiryDays);

    const existing = await prisma.inventoryBatch.findFirst({
      where: { productId: prod.id, batchNumber: b.batchNumber },
    });

    if (existing) {
      await prisma.inventoryBatch.update({
        where: { id: existing.id },
        data: {
          expiryDate,
          importedPackages: b.importedPackages,
          conversionRate: prod.conversionRate,
          initialQuantity,
          remainingQuantity: b.remainingQuantity,
          importNote: b.importNote,
        },
      });
    } else {
      await prisma.inventoryBatch.create({
        data: {
          productId: prod.id,
          batchNumber: b.batchNumber,
          expiryDate,
          importedPackages: b.importedPackages,
          conversionRate: prod.conversionRate,
          initialQuantity,
          remainingQuantity: b.remainingQuantity,
          importNote: b.importNote,
        },
      });
    }
  }

  // Đồng bộ chính xác stockQuantity trên bảng Product = tổng remainingQuantity các lô
  for (const prod of Object.values(productMap)) {
    const agg = await prisma.inventoryBatch.aggregate({
      where: { productId: prod.id },
      _sum: { remainingQuantity: true },
    });
    await prisma.product.update({
      where: { id: prod.id },
      data: { stockQuantity: agg._sum.remainingQuantity ?? 0 },
    });
  }

  // ==========================================
  // 5. SỰ KIỆN & CHƯƠNG TRÌNH KHUYẾN MÃI (3 CHƯƠNG TRÌNH HIỆU LỰC DÀI HẠN)
  // ==========================================
  const promotionsData = [
    {
      code: null as string | null,
      title: "Tuần lễ Spa Thư giãn – Giảm 20% toàn bộ Gói Tắm & Grooming",
      subtitle: "Áp dụng tự động tại quầy cho mọi gói Tắm vệ sinh, Cắt tỉa tạo kiểu & Spa thảo mộc",
      description:
        "Ưu đãi chăm sóc lông da chuẩn Spa thú y giúp bé luôn thơm sạch, mềm mượt suốt tuần. Giảm trực tiếp 20% trên tất cả dịch vụ nhóm Spa / Grooming khi thanh toán tại quầy Lễ tân ANIMORA.",
      discountType: "PERCENT",
      discountValue: 20,
      applicableScope: "SPA",
      badgeText: "Giảm 20% Spa",
      startDate: daysFromNow(-2),
      endDate: daysFromNow(45),
      showOnLanding: true,
      isActive: true,
    },
    {
      code: null as string | null,
      title: "Ưu đãi Tầm soát Sức khỏe – Giảm ngay 50.000đ Dịch vụ Y tế",
      subtitle: "Khám tổng quát, Siêu âm màu, Xét nghiệm máu & Tiêm phòng định kỳ",
      description:
        "Khuyến khích chủ nuôi tầm soát sức khỏe định kỳ cho chó mèo. Giảm trực tiếp 50.000đ cho nhóm dịch vụ Y tế lâm sàng, chẩn đoán hình ảnh và phòng bệnh tại phòng khám ANIMORA.",
      discountType: "FIXED",
      discountValue: 50000,
      applicableScope: "MEDICAL",
      badgeText: "Giảm 50.000đ",
      startDate: daysFromNow(-2),
      endDate: daysFromNow(60),
      showOnLanding: true,
      isActive: true,
    },
    {
      code: "ANIMORA10",
      title: "Mã ưu đãi ANIMORA10 – Giảm thêm 10% trên Tổng hóa đơn",
      subtitle: "Hỗ trợ cộng dồn sau ưu đãi Sự kiện khi thanh toán tại quầy POS",
      description:
        "Đọc hoặc đưa mã ANIMORA10 cho Lễ tân khi thanh toán để nhận thêm mức giảm 10% trên tổng hóa đơn (áp dụng cho cả Dịch vụ Khám, Spa và sản phẩm mua trực tiếp tại Shop).",
      discountType: "PERCENT",
      discountValue: 10,
      applicableScope: "ALL",
      badgeText: "Mã ANIMORA10",
      startDate: daysFromNow(-2),
      endDate: daysFromNow(90),
      showOnLanding: true,
      isActive: true,
    },
  ];

  for (const promo of promotionsData) {
    if (promo.code) {
      await prisma.promotion.upsert({
        where: { code: promo.code },
        update: {
          title: promo.title,
          subtitle: promo.subtitle,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          applicableScope: promo.applicableScope,
          badgeText: promo.badgeText,
          startDate: promo.startDate,
          endDate: promo.endDate,
          showOnLanding: promo.showOnLanding,
          isActive: promo.isActive,
        },
        create: promo,
      });
    } else {
      const existing = await prisma.promotion.findFirst({
        where: { title: promo.title },
      });
      if (existing) {
        await prisma.promotion.update({
          where: { id: existing.id },
          data: {
            subtitle: promo.subtitle,
            description: promo.description,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            applicableScope: promo.applicableScope,
            badgeText: promo.badgeText,
            startDate: promo.startDate,
            endDate: promo.endDate,
            showOnLanding: promo.showOnLanding,
            isActive: promo.isActive,
          },
        });
      } else {
        await prisma.promotion.create({ data: promo });
      }
    }
  }

  // ==========================================
  // 6. KIỂM CHỨNG THỐNG KÊ SAU KHI NẠP (ĐẢM BẢO BẢNG USER NGUYÊN VẸN)
  // ==========================================
  const userCountAfter = await prisma.user.count();
  const expiringCutoff = daysFromNow(30);
  const [
    clinicSettingsCount,
    serviceMedicalCount,
    serviceSpaCount,
    productShopSharedCount,
    productMedSupplyCount,
    batchCount,
    expiringBatchCount,
    promotionCount,
    petCount,
    bookingCount,
    recordCount,
    invoiceCount,
  ] = await Promise.all([
    prisma.clinicSettings.count(),
    prisma.service.count({ where: { category: "MEDICAL" } }),
    prisma.service.count({ where: { category: "SPA" } }),
    prisma.product.count({ where: { group: { in: ["SHOP", "SHARED"] } } }),
    prisma.product.count({ where: { group: { in: ["MEDICINE", "SUPPLY"] } } }),
    prisma.inventoryBatch.count(),
    prisma.inventoryBatch.count({
      where: { remainingQuantity: { gt: 0 }, expiryDate: { lte: expiringCutoff } },
    }),
    prisma.promotion.count(),
    prisma.pet.count(),
    prisma.booking.count(),
    prisma.medicalRecord.count(),
    prisma.invoice.count(),
  ]);

  console.log("✅ Nạp dữ liệu danh mục ANIMORA hoàn tất!");
  console.table({
    "User (giữ nguyên)": `${userCountBefore} -> ${userCountAfter}`,
    ClinicSettings: clinicSettingsCount,
    "Service (Y tế)": serviceMedicalCount,
    "Service (Spa)": serviceSpaCount,
    "Product (Shop + Dùng chung)": productShopSharedCount,
    "Product (Thuốc + Vật tư)": productMedSupplyCount,
    "InventoryBatch (Tổng số lô)": batchCount,
    "InventoryBatch (Cận date < 30 ngày)": expiringBatchCount,
    Promotion: promotionCount,
    "Pet / Booking / MedicalRecord / Invoice": `${petCount} / ${bookingCount} / ${recordCount} / ${invoiceCount}`,
  });
}

main()
  .catch((err) => {
    console.error("❌ Lỗi khi chạy seed-catalog:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
