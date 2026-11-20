import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌿 Đang khởi tạo dữ liệu mẫu cho Phòng khám Thú y ANIMORA...");

  const defaultPasswordHash = await bcrypt.hash("Animora@123", 10);

  // ==========================================
  // 1. CÀI ĐẶT PHÒNG KHÁM (CLINIC SETTINGS)
  // ==========================================
  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
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
  // 2. TÀI KHOẢN & NHÂN SỰ (4 VAI TRÒ + 3 BÁC SĨ)
  // ==========================================
  await prisma.user.upsert({
    where: { email: "quanly@animora.vn" },
    update: {},
    create: {
      email: "quanly@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Nguyễn Minh Khang",
      phone: "0901 234 561",
      address: "Quận 3, TP. Hồ Chí Minh",
      role: "MANAGER",
      isActive: true,
      emailVerified: true,
      title: "Giám đốc Điều hành Phòng khám",
    },
  });

  await prisma.user.upsert({
    where: { email: "letan@animora.vn" },
    update: {},
    create: {
      email: "letan@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Trần Thảo Vy",
      phone: "0901 234 562",
      address: "Quận Phú Nhuận, TP. Hồ Chí Minh",
      role: "RECEPTIONIST",
      isActive: true,
      emailVerified: true,
      title: "Trưởng bộ phận Lễ tân & Điều phối",
    },
  });

  await prisma.user.upsert({
    where: { email: "bacsi@animora.vn" },
    update: {},
    create: {
      email: "bacsi@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "BS.CKI Lê Hoàng Nam",
      phone: "0901 234 563",
      role: "DOCTOR",
      isActive: true,
      emailVerified: true,
      avatarUrl: "/images/doctor-1.jpg",
      title: "Bác sĩ Trưởng • Chuyên khoa I Thú y",
      specialty: "Nội khoa tổng quát & Chẩn đoán hình ảnh (Siêu âm)",
      experienceYears: 11,
      bio: "Hơn 11 năm kinh nghiệm điều trị bệnh lý nội khoa, tim mạch và siêu âm chẩn đoán cho chó mèo. Luôn ưu tiên phác đồ ít xâm lấn, giảm tối đa căng thẳng cho thú cưng.",
      workStatus: "AVAILABLE",
    },
  });

  await prisma.user.upsert({
    where: { email: "bs.minhanh@animora.vn" },
    update: {},
    create: {
      email: "bs.minhanh@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "ThS.BS Phạm Minh Anh",
      phone: "0901 234 564",
      role: "DOCTOR",
      isActive: true,
      emailVerified: true,
      avatarUrl: "/images/doctor-2.jpg",
      title: "Thạc sĩ Bác sĩ Thú y",
      specialty: "Da liễu, Miễn dịch & Dinh dưỡng lâm sàng",
      experienceYears: 8,
      bio: "Chuyên sâu điều trị viêm da cơ địa, nấm, ký sinh trùng và tư vấn chế độ dinh dưỡng cá nhân hóa cho mèo và chó giống nhỏ.",
      workStatus: "AVAILABLE",
    },
  });

  await prisma.user.upsert({
    where: { email: "bs.quocbao@animora.vn" },
    update: {},
    create: {
      email: "bs.quocbao@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "BS. Võ Quốc Bảo",
      phone: "0901 234 565",
      role: "DOCTOR",
      isActive: true,
      emailVerified: true,
      avatarUrl: "/images/doctor-3.jpg",
      title: "Bác sĩ Phẫu thuật & Hồi sức",
      specialty: "Ngoại khoa mô mềm, Nha khoa & Triệt sản thẩm mỹ",
      experienceYears: 9,
      bio: "Giàu kinh nghiệm phẫu thuật triệt sản đường mổ nhỏ, xử lý ngoại khoa mô mềm và nha khoa thú y với hệ thống gây mê bay hơi an toàn.",
      workStatus: "AVAILABLE",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "khachhang@animora.vn" },
    update: {},
    create: {
      email: "khachhang@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Lê Thu Hà",
      phone: "0918 765 432",
      address: "45 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",
      role: "CUSTOMER",
      isActive: true,
      emailVerified: true,
    },
  });

  // ==========================================
  // 3. HỒ SƠ THÚ CƯNG MẪU CHO KHÁCH HÀNG
  // ==========================================
  const existingPets = await prisma.pet.count({
    where: { ownerId: customer.id },
  });

  if (existingPets === 0) {
    await prisma.pet.createMany({
      data: [
        {
          ownerId: customer.id,
          name: "Bơ",
          species: "DOG",
          breed: "Corgi Pembroke",
          birthDate: new Date("2023-05-14"),
          gender: "MALE",
          isNeutered: true,
          coatDescription: "Vàng trắng, lông dày 2 lớp",
          microchipCode: "900118004529104",
          allergies: "Nhạy cảm nhẹ với thịt gà công nghiệp",
          vaccinationHistory: "Đã tiêm đủ 3 mũi 7 bệnh + Dại định kỳ tháng 05/2026",
          dewormingHistory: "Tẩy giun Drontal Plus định kỳ 3 tháng/lần",
          status: "ALIVE",
        },
        {
          ownerId: customer.id,
          name: "Mochi",
          species: "CAT",
          breed: "Mèo Anh Lông Ngắn (Bicolor)",
          birthDate: new Date("2024-02-20"),
          gender: "FEMALE",
          isNeutered: false,
          coatDescription: "Xám trắng Bicolor, lông mịn ngắn",
          microchipCode: "900118004529882",
          allergies: "Chưa ghi nhận dị ứng",
          vaccinationHistory: "Đã tiêm đủ 2 mũi 4 bệnh mèo (FVRCP)",
          dewormingHistory: "Nhỏ gáy Revolution Plus hàng tháng",
          status: "ALIVE",
        },
      ],
    });
  }

  // ==========================================
  // 4. DỊCH VỤ & BẢNG GIÁ CỐ ĐỊNH (Y TẾ & SPA)
  // ==========================================
  const services = [
    // --- NHÓM Y TẾ ---
    {
      slug: "kham-lam-sang-tong-quat",
      name: "Khám lâm sàng tổng quát",
      category: "MEDICAL",
      price: 150000,
      durationMinutes: 30,
      shortDescription:
        "Kiểm tra toàn diện thể trạng, nghe tim phổi, đo thân nhiệt, kiểm tra mắt – tai – răng miệng và tư vấn chăm sóc.",
      processSteps:
        "Đo cân nặng, thân nhiệt và ghi nhận bệnh sử từ chủ nuôi\nKhám lâm sàng tim phổi, ổ bụng, hạch ngoại biên, da lông và răng miệng\nBác sĩ giải thích tình trạng sức khỏe và đề xuất phác đồ hoặc lịch tiêm phù hợp",
      sortOrder: 1,
    },
    {
      slug: "tiem-phong-vac-xin-7-benh-cho",
      name: "Tiêm phòng Vắc-xin 7 bệnh (Chó) / 4 bệnh (Mèo)",
      category: "MEDICAL",
      price: 260000,
      durationMinutes: 30,
      shortDescription:
        "Vắc-xin nhập khẩu chính hãng bảo quản dây chuyền lạnh 2–8°C, kèm khám sàng lọc trước tiêm miễn phí.",
      processSteps:
        "Khám sàng lọc thân nhiệt, hô hấp để đảm bảo bé đủ điều kiện tiêm\nKiểm tra hạn sử dụng, tem lô vắc-xin trực tiếp trước mặt chủ nuôi\nTiêm dưới da nhẹ nhàng, cấp sổ tiêm và theo dõi phản ứng sau tiêm 15 phút",
      sortOrder: 2,
    },
    {
      slug: "sieu-am-o-bung-thai-ky",
      name: "Siêu âm ổ bụng / Siêu âm thai màu",
      category: "MEDICAL",
      price: 280000,
      durationMinutes: 30,
      shortDescription:
        "Chẩn đoán hình ảnh độ phân giải cao đánh giá gan, thận, bàng quang, tử cung và theo dõi nhịp tim thai.",
      processSteps:
        "Cạo gọn vùng lông mỏng (nếu cần) và thoa gel siêu âm ấm không gây kích ứng\nBác sĩ chuyên khoa thực hiện quét đầu dò đánh giá toàn bộ cơ quan ổ bụng\nGiải thích trực tiếp trên màn hình và lưu kết quả vào bệnh án S.O.A.P",
      sortOrder: 3,
    },
    {
      slug: "xet-nghiem-mau-sinh-hoa-tong-quat",
      name: "Xét nghiệm máu tổng quát (Công thức máu + Sinh hóa)",
      category: "MEDICAL",
      price: 490000,
      durationMinutes: 30,
      shortDescription:
        "Kiểm tra chỉ số hồng cầu, bạch cầu, tiểu cầu và chức năng gan thận, trả kết quả nhanh trong 20 phút.",
      processSteps:
        "Lấy mẫu máu tĩnh mạch nhẹ nhàng bằng kim chuyên dụng cho thú nhỏ\nPhân tích tự động trên hệ thống máy huyết học & sinh hóa tại chỗ\nBác sĩ đọc chi tiết từng chỉ số và tư vấn hướng điều chỉnh dinh dưỡng/điều trị",
      sortOrder: 4,
    },
    {
      slug: "cao-voi-rang-sieu-am",
      name: "Cạo vôi răng bằng sóng siêu âm & Đánh bóng men răng",
      category: "MEDICAL",
      price: 650000,
      durationMinutes: 60,
      shortDescription:
        "Loại bỏ mảng bám cao răng, giảm hôi miệng và ngăn ngừa viêm nha chu bằng đầu siêu âm chuyên dụng.",
      processSteps:
        "Khám tim phổi và đánh giá mức độ vôi răng, viêm nướu trước thủ thuật\nTiền mê an toàn và làm sạch mảng bám bằng máy cạo vôi sóng siêu âm\nĐánh bóng bề mặt men răng, sát khuẩn khoang miệng và theo dõi hồi tỉnh",
      sortOrder: 5,
    },
    {
      slug: "triet-san-tham-my-an-toan",
      name: "Phẫu thuật Triệt sản an toàn (Gây mê bay hơi)",
      category: "MEDICAL",
      price: 950000,
      durationMinutes: 90,
      shortDescription:
        "Đường mổ siêu nhỏ thẩm mỹ, sử dụng gây mê bay hơi Isoflurane giúp bé hồi tỉnh nhanh và ít đau.",
      processSteps:
        "Khám tiền mê, kiểm tra chỉ số sinh tồn và đặt đường truyền bảo vệ\nThực hiện phẫu thuật vô trùng theo quy trình chuẩn y khoa\nGiảm đau hậu phẫu, theo dõi hồi tỉnh tại phòng riêng và hướng dẫn chăm sóc vết mổ tại nhà",
      sortOrder: 6,
    },

    // --- NHÓM SPA / GROOMING ---
    {
      slug: "tam-ve-sinh-co-ban",
      name: "Gói Tắm vệ sinh & Chăm sóc toàn diện",
      category: "SPA",
      price: 220000,
      durationMinutes: 60,
      shortDescription:
        "Tắm 2 bước bằng sữa tắm hữu cơ dịu nhẹ, vệ sinh tai, cắt mài móng, vắt tuyến hôi và sấy chải bông lông.",
      processSteps:
        "Kiểm tra nhanh da lông, gỡ rối nhẹ và cắt mài móng, nhổ lông tai\nTắm nước ấm 2 lần với sữa tắm phù hợp từng loại da + massage thư giãn\nVắt tuyến hôi, sấy khô chuẩn nhiệt độ và xịt dưỡng mượt lông",
      sortOrder: 7,
    },
    {
      slug: "tam-cat-tia-tao-kieu",
      name: "Gói Tắm & Cắt tỉa tạo kiểu thẩm mỹ",
      category: "SPA",
      price: 420000,
      durationMinutes: 90,
      shortDescription:
        "Trọn gói tắm vệ sinh kết hợp cắt tỉa tạo dáng gọn gàng theo giống (Teddy, Poodle, Corgi, Mèo sư tử...).",
      processSteps:
        "Tư vấn kiểu dáng phù hợp với chất lông và mong muốn của chủ nuôi\nThực hiện trọn bộ quy trình tắm vệ sinh, sấy bông chuẩn form\nCắt tỉa tạo kiểu bằng kéo Nhật, hoàn thiện đường nét mặt – chân – đuôi",
      sortOrder: 8,
    },
    {
      slug: "tam-tri-lieu-da-nhay-cam",
      name: "Tắm trị liệu da liễu chuyên sâu (Nấm / Viêm da)",
      category: "SPA",
      price: 320000,
      durationMinutes: 60,
      shortDescription:
        "Sử dụng dòng sữa tắm dược mỹ phẩm thú y kết hợp ủ dưỡng phục hồi hàng rào bảo vệ da.",
      processSteps:
        "Soi kiểm tra vùng da tổn thương và làm sạch vảy gàu nhẹ nhàng\nTắm ủ 10 phút với sữa tắm dược liệu chuyên biệt (Chlorhexidine / Ketoconazole)\nSấy mát hoàn toàn để tránh ẩm da và thoa dưỡng ẩm vùng da khô",
      sortOrder: 9,
    },
    {
      slug: "ve-sinh-tai-mong-ban-chan",
      name: "Gói Vệ sinh nhanh (Tai – Móng – Lông bàn chân)",
      category: "SPA",
      price: 90000,
      durationMinutes: 30,
      shortDescription:
        "Chăm sóc nhanh gọn giữa các kỳ tắm giúp bé di chuyển không trơn trượt và tai luôn sạch thoáng.",
      processSteps:
        "Cạo gọn lông đệm bàn chân và vùng vệ sinh bụng dưới\nCắt dũa móng tròn mịn tránh trầy xước khi chạy nhảy\nLàm sạch ráy tai bằng dung dịch chuyên dụng không cồn",
      sortOrder: 10,
    },
    {
      slug: "goi-spa-thu-gian-thao-moc",
      name: "Gói Spa Thảo mộc & Ủ mượt phục hồi lông",
      category: "SPA",
      price: 350000,
      durationMinutes: 60,
      shortDescription:
        "Ngâm bồn thảo mộc dịu nhẹ giúp giảm rụng lông, khử mùi tự nhiên và nuôi dưỡng bộ lông mềm mượt.",
      processSteps:
        "Tắm sạch bụi bẩn và bã nhờn bằng dầu gội thiên nhiên\nNgâm ủ thảo mộc ấm kết hợp tinh dầu yến mạch và massage thư giãn 15 phút\nSấy tạo phồng, chải gỡ lông chết và thoa tinh chất dưỡng bóng",
      sortOrder: 11,
    },
  ];

  for (const srv of services) {
    await prisma.service.upsert({
      where: { slug: srv.slug },
      update: {},
      create: srv,
    });
  }

  // ==========================================
  // 5. SẢN PHẨM TẠI SHOP (CHỈ THAM KHẢO MUA TẠI QUẦY)
  // ==========================================
  const products = [
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
      stockQuantity: 18,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Công thức cân bằng năng lượng cho mèo trưởng thành ít vận động, giảm rõ rệt mùi phân và hỗ trợ đào thải búi lông.",
      ingredients:
        "Protein gia cầm sấy khô (L.I.P dễ tiêu hóa trên 90%), gạo, lúa mì, ngô, protein thực vật phân lập, mỡ động vật, chất xơ thực vật, bột củ cải đường, khoáng chất, dầu đậu nành, Fructo-oligo-saccharides (FOS), men bia, dầu cá giàu EPA & DHA, vỏ hạt mã đề (Psyllium).",
      benefits:
        "• Giảm mùi phân lên tới 60% nhờ nguồn đạm siêu tiêu hóa L.I.P.\n• Kiểm soát cân nặng hợp lý cho mèo nuôi trong căn hộ ít vận động.\n• Hỗ trợ đào thải búi lông tự nhiên qua đường tiêu hóa nhờ sợi Psyllium.\n• Bảo vệ sức khỏe đường tiết niệu với tỷ lệ khoáng chất cân đối.",
      suitableFor:
        "Mèo trưởng thành từ 1 đến 7 tuổi sống hoàn toàn trong nhà (Anh lông ngắn, Anh lông dài, Mèo ta, Ba Tư, Munchkin...).",
      usageInstructions:
        "• Mèo 3kg: 45g/ngày.\n• Mèo 4kg: 55g/ngày.\n• Mèo 5kg: 65g/ngày.\nChia làm 2–3 bữa nhỏ trong ngày và luôn chuẩn bị sẵn nước sạch bên cạnh. Khi đổi hạt mới, trộn tăng dần trong 7 ngày.",
      storageInstructions:
        "Kéo kín khóa zip ngay sau khi lấy hạt. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và độ ẩm cao.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "royal-canin-mini-adult-cho-nho",
      sku: "SP-RC-MINI",
      name: "Hạt Royal Canin Mini Adult cho Chó giống nhỏ (2kg)",
      brand: "Royal Canin (Pháp)",
      group: "SHOP",
      category: "Thức ăn dinh dưỡng",
      targetSpecies: "DOG",
      price: 440000,
      importUnit: "Thùng",
      retailUnit: "Túi",
      conversionRate: 6,
      stockQuantity: 14,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Hạt nhỏ thơm ngon dành riêng cho chó dưới 10kg (Poodle, Corgi, Phốc sóc), giúp giữ dáng khỏe và bóng mượt lông.",
      ingredients:
        "Ngô, bột ngô, protein gia cầm sấy khô, mỡ động vật, gluten ngô, protein động vật thủy phân, bột củ cải đường, dầu đậu nành, dầu cá (giàu EPA & DHA), nấm men, khoáng chất, L-carnitine và nhóm vitamin A, D3, E.",
      benefits:
        "• Bổ sung L-carnitine hỗ trợ chuyển hóa chất béo, duy trì vóc dáng cân đối.\n• Cỡ hạt nhỏ được thiết kế riêng cho khuôn hàm chó giống nhỏ, hỗ trợ giảm mảng bám răng.\n• Giàu Omega-3 (EPA/DHA) giúp da khỏe và bộ lông mềm mượt.",
      suitableFor:
        "Chó trưởng thành từ 10 tháng đến 8 tuổi có cân nặng dưới 10kg như Poodle, Pomeranian, Chihuahua, Pug, Corgi nhỏ.",
      usageInstructions:
        "• Chó 2kg: 47g/ngày.\n• Chó 5kg: 94g/ngày.\n• Chó 8kg: 134g/ngày.\nCó thể cho ăn khô hoặc trộn thêm 1 thìa pate ấm cho bé kén ăn.",
      storageInstructions:
        "Đóng chặt miệng túi sau mỗi lần dùng, để nơi thoáng mát dưới 30°C. Sử dụng tốt nhất trong vòng 45 ngày sau khi mở túi.",
      isFeaturedOnWeb: true,
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
      stockQuantity: 24,
      imageUrl: "/images/product-food.jpg",
      shortDescription:
        "Pate siêu mịn giàu năng lượng chuyên dùng cho chó mèo biếng ăn, sau phẫu thuật, sau sinh hoặc đang hồi sức.",
      ingredients:
        "Thịt và các sản phẩm phụ từ thịt gia cầm, dầu cá tinh luyện, ngũ cốc, dẫn xuất thực vật, sữa và dẫn xuất sữa, khoáng chất thiết yếu, phức hợp chất chống oxy hóa (Vitamin E, C, Taurine, Lutein).",
      benefits:
        "• Mật độ năng lượng cao giúp bé nạp đủ dưỡng chất ngay cả khi ăn lượng rất ít.\n• Kết cấu mousse siêu mịn dễ liếm, dễ tiêu hóa và có thể bơm qua ống cho ăn khi cần.\n• Giàu đạm chất lượng cao giúp nhanh lành vết mổ và phục hồi khối cơ.",
      suitableFor:
        "Chó và mèo ở mọi lứa tuổi đang suy nhược, kén ăn, vừa triệt sản/phẫu thuật hoặc đang trong giai đoạn điều trị nội trú.",
      usageInstructions:
        "Cho ăn trực tiếp ở nhiệt độ phòng hoặc làm ấm nhẹ để tăng mùi thơm. Liều lượng tham khảo: 1/2 – 1 lon/ngày cho bé 4kg (hoặc theo chỉ định bác sĩ tại phòng khám).",
      storageInstructions:
        "Sau khi mở nắp lon, đậy kín bằng nắp silicon và bảo quản ngăn mát tủ lạnh, dùng hết trong vòng 48 giờ.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "sua-tam-duoc-lieu-vet-derma-yen-mach",
      sku: "SP-SHP-OAT",
      name: "Sữa tắm Dược liệu Yến mạch & Lô hội ANIMORA Derma (300ml)",
      brand: "Virbac / DermaCare",
      group: "SHOP",
      category: "Sữa tắm & Chăm sóc",
      targetSpecies: "BOTH",
      price: 295000,
      importUnit: "Thùng",
      retailUnit: "Chai",
      conversionRate: 12,
      stockQuantity: 11,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Công thức không xà phòng pH chuẩn 6.5–7.0 dịu nhẹ cho da nhạy cảm, giúp làm dịu ngứa rát và giảm rụng lông.",
      ingredients:
        "Chiết xuất yến mạch keo (Colloidal Oatmeal 2%), tinh chất lô hội hữu cơ, Glycerin thực vật, Panthenol (Pro-Vitamin B5), Ceramide phục hồi biểu bì, nước tinh khiết. Không chứa Paraben, không Sulfate, không hương liệu hóa học gắt.",
      benefits:
        "• Làm dịu nhanh vùng da mẩn đỏ, khô bong vảy và giảm hành vi gãi ngứa.\n• Cân bằng độ pH tự nhiên cho da chó mèo, bảo vệ lớp dầu tự nhiên.\n• Giúp bộ lông tơi mềm, thơm dịu nhẹ hương thảo mộc thiên nhiên.",
      suitableFor:
        "Chó và mèo trên 8 tuần tuổi, đặc biệt phù hợp với bé có làn da nhạy cảm, dễ kích ứng hoặc đang phục hồi sau viêm da.",
      usageInstructions:
        "Làm ướt đều lông bằng nước ấm, lấy 10–15ml sữa tắm tạo bọt và massage nhẹ nhàng toàn thân trong 5 phút, sau đó xả sạch với nước và sấy khô hoàn toàn.",
      storageInstructions:
        "Đậy kín nắp sau khi dùng, để nơi khô thoáng, tránh ánh nắng trực tiếp và xa tầm tay trẻ em.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "dung-dich-ve-sinh-tai-epi-otic",
      sku: "SP-EAR-EPI",
      name: "Dung dịch Vệ sinh Tai không cồn Epi-Otic (125ml)",
      brand: "Virbac (Pháp)",
      group: "SHOP",
      category: "Sữa tắm & Chăm sóc",
      targetSpecies: "BOTH",
      price: 265000,
      importUnit: "Hộp",
      retailUnit: "Chai",
      conversionRate: 10,
      stockQuantity: 9,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Dung dịch làm sạch ráy tai, khử mùi hôi và ngăn ngừa vi khuẩn/nấm tai phát triển, không gây xót rát.",
      ingredients:
        "Salicylic acid 0.2%, Docusate sodium, PCMX, EDTA, Monosaccharides giúp giảm bám dính vi khuẩn trên niêm mạc ống tai, độ pH trung tính không chứa cồn.",
      benefits:
        "• Làm mềm và đẩy sạch ráy tai tích tụ sâu bên trong ống tai.\n• Khử mùi hôi tai hiệu quả và làm khô thoáng ống tai sau khi tắm.\n• Hỗ trợ phòng ngừa viêm tai ngoài tái phát ở chó tai cụp (Poodle, Cocker, Corgi...).",
      suitableFor:
        "Chó và mèo ở mọi lứa tuổi dùng vệ sinh tai định kỳ hàng tuần hoặc trước khi nhỏ thuốc điều trị viêm tai.",
      usageInstructions:
        "Nhỏ 5–8 giọt trực tiếp vào ống tai, massage nhẹ phần gốc tai khoảng 30 giây để bé tự lắc đẩy ráy ra ngoài, sau đó dùng bông gòn sạch lau nhẹ vành tai. Dùng 1–2 lần/tuần.",
      storageInstructions:
        "Bảo quản ở nhiệt độ phòng (15–30°C), đóng chặt vòi nhỏ sau mỗi lần sử dụng.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "dau-ca-hoi-omega-3-duong-da-long",
      sku: "SP-SUP-OMG",
      name: "Dầu cá hồi Na Uy tinh khiết Omega-3 & 6 (Chai 250ml)",
      brand: "Nordic Pet Care",
      group: "SHOP",
      category: "Thực phẩm bổ sung",
      targetSpecies: "BOTH",
      price: 340000,
      importUnit: "Thùng",
      retailUnit: "Chai",
      conversionRate: 12,
      stockQuantity: 16,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "100% dầu cá hồi ép lạnh nguyên chất giàu EPA & DHA giúp giảm rụng lông rõ rệt sau 3 tuần và hỗ trợ tim mạch.",
      ingredients:
        "100% dầu cá hồi Đại Tây Dương ép lạnh (Salmo salar), tự nhiên giàu Omega-3 (EPA tối thiểu 8%, DHA tối thiểu 10%), Omega-6 và Vitamin E tự nhiên (Tocopherol) chống oxy hóa.",
      benefits:
        "• Giảm tình trạng rụng lông theo mùa, khắc phục da khô gàu và giúp lông bóng mượt.\n• Tăng cường đề kháng, hỗ trợ chức năng tim mạch và xương khớp cho thú cưng lớn tuổi.\n• Kích thích vị giác thơm tự nhiên cho các bé lười ăn hạt.",
      suitableFor:
        "Chó và mèo từ 3 tháng tuổi trở lên, đặc biệt hữu ích cho chó lông dày (Corgi, Samoyed, Poodle) và mèo lông dài.",
      usageInstructions:
        "Nhấn vòi trộn trực tiếp vào thức ăn hàng ngày:\n• Dưới 5kg: 1 lần nhấn (2ml)/ngày.\n• Từ 5–15kg: 2 lần nhấn (4ml)/ngày.\n• Trên 15kg: 3 lần nhấn (6ml)/ngày.",
      storageInstructions:
        "Bảo quản nơi râm mát hoặc ngăn mát tủ lạnh sau khi mở nắp để giữ trọn độ tươi của Omega-3.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "gel-dinh-duong-vitamin-nutri-plus",
      sku: "SP-SUP-NPG",
      name: "Gel Dinh dưỡng Đa Vitamin Nutri-Plus Gel (Tuýp 120.5g)",
      brand: "Virbac (Pháp)",
      group: "SHOP",
      category: "Thực phẩm bổ sung",
      targetSpecies: "BOTH",
      price: 275000,
      importUnit: "Hộp",
      retailUnit: "Tuýp",
      conversionRate: 12,
      stockQuantity: 15,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Gel bổ sung năng lượng tức thì và 10 loại vitamin khoáng chất thiết yếu, hương vị thơm ngon dễ liếm.",
      ingredients:
        "Siro glucose, dầu đậu nành, dầu cá tuyết, mật rỉ đường, protein động vật thủy phân, Vitamin A, D3, E, B1, B2, B6, B12, Niacinamide, Folic acid, Sắt, Mangan và Magie.",
      benefits:
        "• Bổ sung năng lượng nhanh chóng cho chó mèo con đang lớn, chó mèo mang thai hoặc cho con bú.\n• Hỗ trợ hồi sức nhanh sau tiêm phòng, sau bệnh hoặc di chuyển đường dài.\n• Kích thích ăn ngon miệng cho thú cưng kén ăn.",
      suitableFor:
        "Chó mèo từ 2 tháng tuổi trở lên cần bổ sung vitamin, tăng sức đề kháng hoặc phục hồi thể trạng.",
      usageInstructions:
        "Cho liếm trực tiếp từ đầu ngón tay hoặc trộn vào thức ăn: 1–2 thìa cà phê (khoảng 5cm gel) cho mỗi 5kg thể trọng/ngày.",
      storageInstructions:
        "Đậy kín nắp tuýp, bảo quản ở nơi khô ráo dưới 25°C, tránh nhiệt độ cao làm tách dầu.",
      isFeaturedOnWeb: true,
    },
    {
      slug: "luoc-chai-long-go-roi-chuyen-nghiep",
      sku: "SP-ACC-BRU",
      name: "Lược chải gỡ rối & Lấy lông chết đầu bọc bảo vệ da",
      brand: "FurCare Studio",
      group: "SHOP",
      category: "Phụ kiện",
      targetSpecies: "BOTH",
      price: 185000,
      importUnit: "Thùng",
      retailUnit: "Cái",
      conversionRate: 20,
      stockQuantity: 0,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Răng thép không gỉ uốn cong 135° có hạt nhựa massage tròn đầu, lấy sạch lông rụng mà không làm xước da bé.",
      ingredients:
        "Thân lược nhựa ABS cao cấp chống trượt, đệm cao su đàn hồi, răng chải bằng thép không gỉ 304 có đầu bọc hạt nhựa mềm an toàn, nút bấm đẩy lông 1 chạm.",
      benefits:
        "• Loại bỏ đến 90% lông rụng bám ẩn sâu trong lớp lông tơ, giúp nhà cửa sạch lông.\n• Kích thích tuần hoàn máu dưới da nhờ đầu răng massage êm ái.\n• Nút bấm tự đẩy mảng lông gọn gàng chỉ trong 1 giây, dễ vệ sinh.",
      suitableFor:
        "Mọi giống chó và mèo lông ngắn lẫn lông dài (Poodle, Corgi, Mèo Anh, Mèo Ba Tư, Golden...).",
      usageInstructions:
        "Chải nhẹ theo chiều mọc của lông từ cổ xuống đuôi 3–5 phút mỗi lần, 2–3 lần/tuần. Nhấn nút sau lưng lược để gỡ bỏ phần lông đã chải.",
      storageInstructions:
        "Rửa sạch phần răng lược với nước ấm định kỳ, lau khô hoàn toàn và bảo quản nơi khô ráo.",
      isFeaturedOnWeb: true,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
  }

  // ==========================================
  // 6. SỰ KIỆN & ƯU ĐÃI ĐANG CHẠY (BANNER ĐẾM NGƯỢC)
  // ==========================================
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  await prisma.promotion.upsert({
    where: { code: "SPA20ANIMORA" },
    update: {
      startDate: threeDaysAgo,
      endDate: in14Days,
      isActive: true,
      showOnLanding: true,
    },
    create: {
      code: "SPA20ANIMORA",
      title: "Tuần lễ Spa Thư giãn — Giảm ngay 20% mọi gói Tắm & Cắt tỉa",
      subtitle: "Áp dụng cho tất cả khách hàng đặt lịch hoặc ghé trực tiếp phòng khám",
      description:
        "Tặng thêm bước vệ sinh đệm chân và xịt dưỡng mượt thảo mộc miễn phí khi sử dụng gói Tắm vệ sinh hoặc Tắm cắt tỉa tạo kiểu cho chó mèo.",
      discountType: "PERCENT",
      discountValue: 20,
      applicableScope: "SPA",
      badgeText: "GIẢM 20% SPA",
      startDate: threeDaysAgo,
      endDate: in14Days,
      showOnLanding: true,
      isActive: true,
    },
  });

  await prisma.promotion.upsert({
    where: { code: "KHAMTONGQUAT50K" },
    update: {
      startDate: threeDaysAgo,
      endDate: in28Days,
      isActive: true,
      showOnLanding: true,
    },
    create: {
      code: "KHAMTONGQUAT50K",
      title: "Ưu đãi Tầm soát Sức khỏe Định kỳ — Giảm 50.000đ gói Khám & Xét nghiệm",
      subtitle: "Chủ động bảo vệ thú cưng trước thời điểm giao mùa",
      description:
        "Giảm trực tiếp 50.000đ trên hóa đơn khi thực hiện Khám lâm sàng tổng quát kèm Siêu âm hoặc Xét nghiệm máu tổng quát. Được cộng dồn cùng ưu đãi thành viên tại quầy.",
      discountType: "FIXED",
      discountValue: 50000,
      applicableScope: "MEDICAL",
      badgeText: "GIẢM 50.000Đ Y TẾ",
      startDate: threeDaysAgo,
      endDate: in28Days,
      showOnLanding: true,
      isActive: true,
    },
  });

  console.log("✅ Đã nạp thành công toàn bộ dữ liệu mẫu ANIMORA!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu mẫu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
