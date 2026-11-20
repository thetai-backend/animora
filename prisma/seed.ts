import { PrismaClient } from ".prisma/client-animora";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateOffsetStr(daysOffset: number): string {
  const dt = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  console.log("🌿 Đang khởi tạo dữ liệu mẫu toàn diện cho ANIMORA (GD1 + GD2 + GD3)...");

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
  const manager = await prisma.user.upsert({
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

  const receptionist = await prisma.user.upsert({
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

  const docNam = await prisma.user.upsert({
    where: { email: "bacsi@animora.vn" },
    update: { workStatus: "AVAILABLE" },
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

  const docMinhAnh = await prisma.user.upsert({
    where: { email: "bs.minhanh@animora.vn" },
    update: { workStatus: "IN_EXAM" },
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
      workStatus: "IN_EXAM",
    },
  });

  const docQuocBao = await prisma.user.upsert({
    where: { email: "bs.quocbao@animora.vn" },
    update: { workStatus: "AVAILABLE" },
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

  const customer2 = await prisma.user.upsert({
    where: { email: "minhtuan@animora.vn" },
    update: {},
    create: {
      email: "minhtuan@animora.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Nguyễn Minh Tuấn",
      phone: "0903 555 812",
      address: "212 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh",
      role: "CUSTOMER",
      isActive: true,
      emailVerified: true,
    },
  });

  // ==========================================
  // 2B. LỊCH TRỰC TUẦN CỐ ĐỊNH (WORK SCHEDULE)
  // ==========================================
  const doctorsList = [docNam, docMinhAnh, docQuocBao];
  for (const doc of doctorsList) {
    for (let dow = 0; dow <= 6; dow++) {
      // Xoay ca hợp lý, luôn có ít nhất 2 bác sĩ trực mỗi ca
      const morningShift = doc.id === docQuocBao.id && dow === 0 ? false : true;
      const afternoonShift = doc.id === docMinhAnh.id && dow === 1 ? false : true;
      await prisma.workSchedule.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doc.id, dayOfWeek: dow } },
        update: { morningShift, afternoonShift },
        create: {
          doctorId: doc.id,
          dayOfWeek: dow,
          morningShift,
          afternoonShift,
        },
      });
    }
  }

  // ==========================================
  // 3. HỒ SƠ THÚ CƯNG MẪU CHO KHÁCH HÀNG
  // ==========================================
  let petBo = await prisma.pet.findFirst({ where: { ownerId: customer.id, name: "Bơ" } });
  if (!petBo) {
    petBo = await prisma.pet.create({
      data: {
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
    });
  }

  let petMochi = await prisma.pet.findFirst({ where: { ownerId: customer.id, name: "Mochi" } });
  if (!petMochi) {
    petMochi = await prisma.pet.create({
      data: {
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
    });
  }

  let petMilo = await prisma.pet.findFirst({ where: { ownerId: customer2.id, name: "Milo" } });
  if (!petMilo) {
    petMilo = await prisma.pet.create({
      data: {
        ownerId: customer2.id,
        name: "Milo",
        species: "DOG",
        breed: "Poodle Toy",
        birthDate: new Date("2022-09-10"),
        gender: "MALE",
        isNeutered: true,
        coatDescription: "Nâu đỏ xoăn nhẹ",
        microchipCode: "900118009912345",
        allergies: "Không",
        vaccinationHistory: "Đủ 7 bệnh + Dại 2026",
        dewormingHistory: "NexGard Spectra hàng tháng",
        status: "ALIVE",
      },
    });
  }

  // ==========================================
  // 4. DỊCH VỤ & BẢNG GIÁ CỐ ĐỊNH (Y TẾ & SPA)
  // ==========================================
  const servicesData = [
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

  const serviceMap: Record<string, { id: string; name: string; category: string; price: number; durationMinutes: number }> = {};
  for (const srv of servicesData) {
    const saved = await prisma.service.upsert({
      where: { slug: srv.slug },
      update: {},
      create: srv,
    });
    serviceMap[srv.slug] = saved;
  }

  // ==========================================
  // 5. KHO HỢP NHẤT: SHOP + THUỐC Y TẾ + VẬT TƯ TIÊU HAO
  // ==========================================
  const productsData = [
    // --- SHOP ---
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
        "Protein gia cầm sấy khô (L.I.P dễ tiêu hóa trên 90%), gạo, lúa mì, ngô, chất xơ thực vật, dầu cá giàu EPA & DHA, vỏ hạt mã đề (Psyllium).",
      benefits:
        "• Giảm mùi phân lên tới 60% nhờ nguồn đạm siêu tiêu hóa L.I.P.\n• Kiểm soát cân nặng hợp lý cho mèo nuôi trong căn hộ.\n• Hỗ trợ đào thải búi lông tự nhiên.",
      suitableFor: "Mèo trưởng thành từ 1 đến 7 tuổi sống hoàn toàn trong nhà.",
      usageInstructions: "Mèo 3kg: 45g/ngày; Mèo 4kg: 55g/ngày; Mèo 5kg: 65g/ngày.",
      storageInstructions: "Kéo kín khóa zip sau khi lấy hạt, bảo quản nơi khô ráo.",
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
      ingredients: "Ngô, protein gia cầm sấy khô, mỡ động vật, dầu cá (EPA & DHA), L-carnitine, vitamin A, D3, E.",
      benefits: "• Duy trì vóc dáng cân đối.\n• Cỡ hạt nhỏ phù hợp hàm chó nhỏ.\n• Giàu Omega-3 giúp lông mềm mượt.",
      suitableFor: "Chó trưởng thành từ 10 tháng đến 8 tuổi dưới 10kg.",
      usageInstructions: "Chó 2kg: 47g/ngày; Chó 5kg: 94g/ngày; Chó 8kg: 134g/ngày.",
      storageInstructions: "Đóng chặt miệng túi sau mỗi lần dùng, tránh ẩm.",
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
      ingredients: "Thịt gia cầm, dầu cá tinh luyện, khoáng chất thiết yếu, Vitamin E, C, Taurine.",
      benefits: "• Mật độ năng lượng cao.\n• Kết cấu mousse siêu mịn dễ liếm.\n• Hỗ trợ nhanh lành vết mổ.",
      suitableFor: "Chó và mèo suy nhược, kén ăn hoặc vừa phẫu thuật.",
      usageInstructions: "1/2 – 1 lon/ngày cho bé 4kg hoặc theo chỉ định bác sĩ.",
      storageInstructions: "Đậy kín nắp bảo quản tủ lạnh dùng trong 48 giờ sau khi mở.",
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
      stockQuantity: 12,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Công thức không xà phòng pH chuẩn 6.5–7.0 dịu nhẹ cho da nhạy cảm, giúp làm dịu ngứa rát và giảm rụng lông.",
      ingredients: "Chiết xuất yến mạch keo 2%, lô hội hữu cơ, Panthenol B5, Ceramide.",
      benefits: "• Làm dịu nhanh vùng da mẩn đỏ, ngứa.\n• Cân bằng pH tự nhiên cho da thú cưng.",
      suitableFor: "Chó và mèo trên 8 tuần tuổi có da nhạy cảm.",
      usageInstructions: "Làm ướt lông, massage 5 phút rồi xả sạch và sấy khô.",
      storageInstructions: "Đậy kín nắp, để nơi khô thoáng.",
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
      stockQuantity: 10,
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Dung dịch làm sạch ráy tai, khử mùi hôi và ngăn ngừa vi khuẩn/nấm tai phát triển, không gây xót rát.",
      ingredients: "Salicylic acid 0.2%, Docusate sodium, PCMX, EDTA, pH trung tính.",
      benefits: "• Làm mềm và đẩy sạch ráy tai.\n• Hỗ trợ phòng ngừa viêm tai ngoài tái phát.",
      suitableFor: "Chó và mèo vệ sinh tai định kỳ hàng tuần.",
      usageInstructions: "Nhỏ 5–8 giọt vào ống tai, massage gốc tai 30 giây rồi lau sạch.",
      storageInstructions: "Nhiệt độ phòng 15–30°C.",
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
      stockQuantity: 0, // Cố tình tồn = 0 để test cảnh báo đỏ + tồn kho âm tạm thời!
      imageUrl: "/images/product-care.jpg",
      shortDescription:
        "Răng thép không gỉ uốn cong 135° có hạt nhựa massage tròn đầu, lấy sạch lông rụng mà không làm xước da bé.",
      ingredients: "Nhựa ABS cao cấp, răng thép không gỉ 304 bọc đầu hạt nhựa.",
      benefits: "• Loại bỏ 90% lông rụng.\n• Nút bấm đẩy lông 1 chạm.",
      suitableFor: "Mọi giống chó mèo lông ngắn và lông dài.",
      usageInstructions: "Chải nhẹ theo chiều lông 2–3 lần/tuần.",
      storageInstructions: "Rửa sạch và để khô ráo.",
      isFeaturedOnWeb: true,
    },

    // --- THUỐC Y TẾ (MEDICINE) ---
    {
      slug: "thuoc-khang-sinh-amoxicillin-clavulanate-250mg",
      sku: "TH-AMOX-250",
      name: "Kháng sinh thú y Amoxicillin-Clavulanate 250mg (Clavamox)",
      brand: "Zoetis (Mỹ)",
      group: "MEDICINE",
      category: "Thuốc kê đơn",
      targetSpecies: "BOTH",
      price: 18000,
      importUnit: "Hộp",
      retailUnit: "Viên",
      conversionRate: 14,
      stockQuantity: 42,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Kháng sinh phổ rộng điều trị nhiễm khuẩn hô hấp, da, tiết niệu và mô mềm ở chó mèo.",
      ingredients: "Amoxicillin 200mg + Clavulanic acid 50mg.",
      benefits: "Điều trị hiệu quả nhiễm khuẩn đường hô hấp và viêm da mủ.",
      suitableFor: "Chó mèo theo chỉ định của bác sĩ thú y.",
      usageInstructions: "Uống 12.5mg/kg mỗi 12 giờ sau ăn theo đơn bác sĩ.",
      storageInstructions: "Nơi khô ráo dưới 25°C, tránh ánh sáng.",
      isFeaturedOnWeb: false,
    },
    {
      slug: "thuoc-nho-tai-surolan-15ml",
      sku: "TH-SURO-15",
      name: "Thuốc nhỏ tai đặc trị viêm tai Surolan (Lọ 15ml)",
      brand: "Elanco (Bỉ)",
      group: "MEDICINE",
      category: "Thuốc kê đơn",
      targetSpecies: "BOTH",
      price: 245000,
      importUnit: "Hộp",
      retailUnit: "Lọ",
      conversionRate: 10,
      stockQuantity: 8,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Đặc trị viêm tai ngoài do vi khuẩn, nấm men Malassezia và ký sinh trùng tai ở chó mèo.",
      ingredients: "Miconazole nitrate, Polymyxin B sulfate, Prednisolone acetate.",
      benefits: "Giảm nhanh ngứa rát, sưng đỏ và tiêu diệt nấm/vi khuẩn ống tai.",
      suitableFor: "Chó mèo bị viêm tai ngoài (màng nhĩ còn nguyên vẹn).",
      usageInstructions: "Lắc kỹ trước khi nhỏ 3–5 giọt/tai, 2 lần/ngày trong 7 ngày.",
      storageInstructions: "Nhiệt độ dưới 25°C.",
      isFeaturedOnWeb: false,
    },
    {
      slug: "men-tieu-hoa-bio-flora-goi",
      sku: "TH-BIOF-5G",
      name: "Men tiêu hóa sống phục hồi đường ruột Bio-Flora (Gói 5g)",
      brand: "BioPharmachemie",
      group: "MEDICINE",
      category: "Thuốc hỗ trợ",
      targetSpecies: "BOTH",
      price: 15000,
      importUnit: "Hộp",
      retailUnit: "Gói",
      conversionRate: 20,
      stockQuantity: 35,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Bổ sung lợi khuẩn Lactobacillus & Bacillus hỗ trợ cầm tiêu chảy, rối loạn tiêu hóa và kích thích ăn.",
      ingredients: "Bacillus subtilis, Lactobacillus acidophilus, Enzyme tiêu hóa.",
      benefits: "Cân bằng hệ vi sinh đường ruột, giảm mùi phân.",
      suitableFor: "Chó mèo đang dùng kháng sinh hoặc rối loạn tiêu hóa.",
      usageInstructions: "Pha nước ấm hoặc trộn thức ăn 1 gói/lần, ngày 2 lần.",
      storageInstructions: "Nơi khô mát.",
      isFeaturedOnWeb: false,
    },
    {
      slug: "thuoc-khang-viem-giam-dau-meloxicam-15mg",
      sku: "TH-MELO-15",
      name: "Thuốc kháng viêm giảm đau Meloxicam thú y (Viên nhai)",
      brand: "Boehringer Ingelheim",
      group: "MEDICINE",
      category: "Thuốc kê đơn",
      targetSpecies: "DOG",
      price: 22000,
      importUnit: "Hộp",
      retailUnit: "Viên",
      conversionRate: 10,
      stockQuantity: 20,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Giảm đau và kháng viêm hậu phẫu, đau cơ xương khớp cấp và mãn tính cho chó.",
      ingredients: "Meloxicam 1.5mg.",
      benefits: "Giảm sưng đau nhanh, vị bò dễ ăn.",
      suitableFor: "Chó theo kê đơn bác sĩ.",
      usageInstructions: "Uống sau ăn no theo đúng cân nặng bác sĩ kê.",
      storageInstructions: "Nơi khô ráo dưới 30°C.",
      isFeaturedOnWeb: false,
    },

    // --- VẬT TƯ TIÊU HAO (SUPPLY) ---
    {
      slug: "kim-tiem-1ml-vo-trung",
      sku: "VT-KIM-1ML",
      name: "Bơm kim tiêm vô trùng 1ml dùng 1 lần (Cái)",
      brand: "Vinahankook",
      group: "SUPPLY",
      category: "Vật tư tiêu hao",
      targetSpecies: "BOTH",
      price: 2000,
      importUnit: "Hộp",
      retailUnit: "Cái",
      conversionRate: 100,
      stockQuantity: 180,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Bơm kim tiêm 1ml vô trùng đầu kim siêu mảnh dùng trong tiêm phòng và tiêm thuốc thú nhỏ.",
      ingredients: "Nhựa y tế PP, kim thép không gỉ vô trùng EO.",
      benefits: "Giảm đau khi tiêm cho chó mèo.",
      suitableFor: "Sử dụng nội bộ tại phòng khám.",
      usageInstructions: "Sử dụng 1 lần duy nhất, hủy vào hộp vật sắc nhọn.",
      storageInstructions: "Nơi khô ráo sạch sẽ.",
      isFeaturedOnWeb: false,
    },
    {
      slug: "bong-y-te-tham-nuoc-con-70",
      sku: "VT-CON-70",
      name: "Cồn sát khuẩn 70 độ y tế (Chai 500ml)",
      brand: "OPC Pharma",
      group: "SUPPLY",
      category: "Vật tư tiêu hao",
      targetSpecies: "BOTH",
      price: 35000,
      importUnit: "Thùng",
      retailUnit: "Chai",
      conversionRate: 20,
      stockQuantity: 15,
      imageUrl: "/images/product-care.jpg",
      shortDescription: "Dung dịch Ethanol 70% sát khuẩn vùng da tiêm truyền và dụng cụ phòng khám.",
      ingredients: "Ethanol 70%, nước tinh khiết.",
      benefits: "Sát khuẩn nhanh, bay hơi sạch.",
      suitableFor: "Sử dụng nội bộ phòng khám.",
      usageInstructions: "Thấm bông gòn lau sát khuẩn ngoài da.",
      storageInstructions: "Đậy kín nắp, tránh nguồn lửa.",
      isFeaturedOnWeb: false,
    },
  ];

  const productMap: Record<string, { id: string; sku: string; name: string; price: number; retailUnit: string; conversionRate: number; stockQuantity: number }> = {};
  for (const prod of productsData) {
    const saved = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: { stockQuantity: prod.stockQuantity },
      create: prod,
    });
    productMap[prod.sku] = saved;
  }

  // ==========================================
  // 5B. LÔ HÀNG ĐA LÔ (INVENTORY BATCH) - CÓ LÔ DƯỚI 30 NGÀY HẾT HẠN!
  // ==========================================
  const now = new Date();
  const in12Days = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000); // < 30 ngày -> Cảnh báo ĐỎ!
  const in22Days = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000); // < 30 ngày -> Cảnh báo ĐỎ!
  const in180Days = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const in365Days = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const existingBatches = await prisma.inventoryBatch.count();
  if (existingBatches === 0) {
    const batchSeeds = [
      // Kháng sinh Amoxicillin: 1 lô sắp hết hạn (12 ngày) + 1 lô mới (365 ngày) -> test FEFO!
      {
        sku: "TH-AMOX-250",
        batchNumber: "AMOX-26A1",
        expiryDate: in12Days,
        importedPackages: 1,
        conversionRate: 14,
        initialQuantity: 14,
        remainingQuantity: 14,
        importNote: "Lô cận date - ưu tiên xuất trước FEFO",
      },
      {
        sku: "TH-AMOX-250",
        batchNumber: "AMOX-27B2",
        expiryDate: in365Days,
        importedPackages: 2,
        conversionRate: 14,
        initialQuantity: 28,
        remainingQuantity: 28,
        importNote: "Lô nhập mới quý IV",
      },
      // Thuốc nhỏ tai Surolan: lô còn 22 ngày hết hạn!
      {
        sku: "TH-SURO-15",
        batchNumber: "SURO-26C9",
        expiryDate: in22Days,
        importedPackages: 1,
        conversionRate: 10,
        initialQuantity: 10,
        remainingQuantity: 8,
        importNote: "Cần theo dõi hạn dùng dưới 30 ngày",
      },
      // Men tiêu hóa Bio-Flora
      {
        sku: "TH-BIOF-5G",
        batchNumber: "BIOF-2701",
        expiryDate: in180Days,
        importedPackages: 2,
        conversionRate: 20,
        initialQuantity: 40,
        remainingQuantity: 35,
        importNote: "Nhập kho định kỳ",
      },
      // Kháng viêm Meloxicam
      {
        sku: "TH-MELO-15",
        batchNumber: "MELO-2705",
        expiryDate: in365Days,
        importedPackages: 2,
        conversionRate: 10,
        initialQuantity: 20,
        remainingQuantity: 20,
        importNote: "Nhập kho định kỳ",
      },
      // Shop products
      {
        sku: "SP-RC-IN27",
        batchNumber: "RC27-2708",
        expiryDate: in365Days,
        importedPackages: 3,
        conversionRate: 6,
        initialQuantity: 18,
        remainingQuantity: 18,
      },
      {
        sku: "SP-RC-MINI",
        batchNumber: "RCMN-2708",
        expiryDate: in365Days,
        importedPackages: 3,
        conversionRate: 6,
        initialQuantity: 18,
        remainingQuantity: 14,
      },
      {
        sku: "SP-VET-REC",
        batchNumber: "REC-2612",
        expiryDate: in180Days,
        importedPackages: 2,
        conversionRate: 12,
        initialQuantity: 24,
        remainingQuantity: 24,
      },
      {
        sku: "SP-SHP-OAT",
        batchNumber: "OAT-2703",
        expiryDate: in365Days,
        importedPackages: 1,
        conversionRate: 12,
        initialQuantity: 12,
        remainingQuantity: 12,
      },
      {
        sku: "SP-EAR-EPI",
        batchNumber: "EPI-2704",
        expiryDate: in365Days,
        importedPackages: 1,
        conversionRate: 10,
        initialQuantity: 10,
        remainingQuantity: 10,
      },
      // Supplies
      {
        sku: "VT-KIM-1ML",
        batchNumber: "KIM-2709",
        expiryDate: in365Days,
        importedPackages: 2,
        conversionRate: 100,
        initialQuantity: 200,
        remainingQuantity: 180,
      },
      {
        sku: "VT-CON-70",
        batchNumber: "CON-2702",
        expiryDate: in365Days,
        importedPackages: 1,
        conversionRate: 20,
        initialQuantity: 20,
        remainingQuantity: 15,
      },
    ];

    for (const b of batchSeeds) {
      const prod = productMap[b.sku];
      if (!prod) continue;
      const batch = await prisma.inventoryBatch.create({
        data: {
          productId: prod.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          importedPackages: b.importedPackages,
          conversionRate: b.conversionRate,
          initialQuantity: b.initialQuantity,
          remainingQuantity: b.remainingQuantity,
          importNote: b.importNote ?? "Nhập kho ban đầu",
          createdById: manager.id,
        },
      });
      await prisma.stockTransaction.create({
        data: {
          productId: prod.id,
          batchId: batch.id,
          type: "IMPORT",
          quantityChange: b.initialQuantity,
          note: `Nhập ${b.importedPackages} đơn vị lớn (${b.initialQuantity} ${prod.retailUnit}) - Lô ${b.batchNumber}`,
          createdById: manager.id,
          createdByName: manager.fullName,
        },
      });
    }

    // 1 phiếu xuất kho nội bộ mẫu (Kim tiêm 1ml)
    await prisma.internalUsageSlip.create({
      data: {
        slipCode: "XNB-2026-001",
        productId: productMap["VT-KIM-1ML"].id,
        quantity: 20,
        department: "Phòng khám số 1",
        reason: "Xuất kim tiêm 1ml dùng cho ca tiêm phòng trong tuần",
        createdById: docNam.id,
        createdByName: docNam.fullName,
      },
    });

    // 1 phiếu xuất hủy mẫu
    await prisma.disposalSlip.create({
      data: {
        slipCode: "XH-2026-001",
        type: "DISPOSAL",
        productId: productMap["TH-SURO-15"].id,
        quantityChange: -2,
        reason: "Vỡ 2 lọ trong quá trình vận chuyển kiểm kê kho",
        createdById: manager.id,
        createdByName: manager.fullName,
      },
    });
  }

  // ==========================================
  // 6. SỰ KIỆN & ƯU ĐÃI ĐANG CHẠY
  // ==========================================
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  await prisma.promotion.upsert({
    where: { code: "SPA20ANIMORA" },
    update: { startDate: threeDaysAgo, endDate: in14Days, isActive: true, showOnLanding: true },
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
    update: { startDate: threeDaysAgo, endDate: in28Days, isActive: true, showOnLanding: true },
    create: {
      code: "KHAMTONGQUAT50K",
      title: "Ưu đãi Tầm soát Sức khỏe Định kỳ — Giảm 50.000đ gói Khám & Xét nghiệm",
      subtitle: "Chủ động bảo vệ thú cưng trước thời điểm giao mùa",
      description:
        "Giảm trực tiếp 50.000đ trên hóa đơn khi thực hiện Khám lâm sàng tổng quát kèm Siêu âm hoặc Xét nghiệm máu tổng quát.",
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

  await prisma.promotion.upsert({
    where: { code: "MEMBER10" },
    update: { startDate: threeDaysAgo, endDate: in28Days, isActive: true },
    create: {
      code: "MEMBER10",
      title: "Mã giảm thêm 10% tổng hóa đơn khách hàng thân thiết",
      subtitle: "Có thể cộng dồn sau khuyến mãi dịch vụ/sự kiện",
      description: "Áp dụng cộng dồn trên tổng tiền còn lại sau khi đã trừ ưu đãi sự kiện.",
      discountType: "PERCENT",
      discountValue: 10,
      applicableScope: "ALL",
      badgeText: "MÃ GIẢM 10%",
      startDate: threeDaysAgo,
      endDate: in28Days,
      showOnLanding: false,
      isActive: true,
    },
  });

  // ==========================================
  // 7. DỮ LIỆU VẬN HÀNH MẪU (BOOKING + S.O.A.P + POS INVOICE)
  // ==========================================
  const todayStr = getTodayStr();
  const pastDateStr = getDateOffsetStr(-15);
  const existingBookings = await prisma.booking.count();

  if (existingBookings === 0) {
    const srvKham = serviceMap["kham-lam-sang-tong-quat"];
    const srvVacxin = serviceMap["tiem-phong-vac-xin-7-benh-cho"];
    const srvTam = serviceMap["tam-ve-sinh-co-ban"];
    const srvSieuAm = serviceMap["sieu-am-o-bung-thai-ky"];

    // (A) Lịch hẹn quá giờ > 20 phút hôm nay (08:00, chưa check-in -> DÒNG MÀU ĐỎ trên màn hình Lễ tân!)
    await prisma.booking.create({
      data: {
        bookingCode: "ANM-7102",
        isGuest: false,
        customerId: customer2.id,
        doctorId: docQuocBao.id,
        bookingDate: todayStr,
        startTime: "08:00",
        endTime: "08:30",
        totalDurationMinutes: 30,
        status: "CONFIRMED",
        notes: "Bé Milo đi tiêm nhắc lại, khách báo có thể đến trễ",
        pets: {
          create: [
            {
              petId: petMilo.id,
              services: {
                create: [
                  {
                    serviceId: srvVacxin.id,
                    serviceName: srvVacxin.name,
                    serviceCategory: srvVacxin.category,
                    price: srvVacxin.price,
                    durationMinutes: srvVacxin.durationMinutes,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // (B) Lịch hẹn Khách vãng lai (Guest) — để test ngay trang /tra-cuu với Mã ANM-8492 & SĐT 0909888777
    await prisma.booking.create({
      data: {
        bookingCode: "ANM-8492",
        isGuest: true,
        guestName: "Phạm Quốc Hưng",
        guestPhone: "0909888777",
        guestEmail: "quochung.guest@gmail.com",
        doctorId: docNam.id,
        autoAssigned: true,
        bookingDate: todayStr,
        startTime: "16:30",
        endTime: "17:00",
        totalDurationMinutes: 30,
        status: "CONFIRMED",
        notes: "Bé Cà Phê bị hắt hơi nhẹ 2 hôm nay",
        pets: {
          create: [
            {
              guestPetName: "Cà Phê",
              guestPetSpecies: "CAT",
              guestPetBreed: "Mèo mướp ta",
              guestPetNote: "Khoảng 1 tuổi, hơi nhát người lạ",
              services: {
                create: [
                  {
                    serviceId: srvKham.id,
                    serviceName: srvKham.name,
                    serviceCategory: srvKham.category,
                    price: srvKham.price,
                    durationMinutes: srvKham.durationMinutes,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // (C) Lịch hẹn ĐA THÚ CƯNG của Khách thành viên Lê Thu Hà (Bơ + Mochi) hôm nay
    await prisma.booking.create({
      data: {
        bookingCode: "ANM-8501",
        isGuest: false,
        customerId: customer.id,
        doctorId: docNam.id,
        bookingDate: todayStr,
        startTime: "15:00",
        endTime: "16:30",
        totalDurationMinutes: 90,
        status: "CONFIRMED",
        notes: "Đặt khám cho Bơ và tắm vệ sinh cho Mochi trong cùng lượt",
        pets: {
          create: [
            {
              petId: petBo.id,
              services: {
                create: [
                  {
                    serviceId: srvKham.id,
                    serviceName: srvKham.name,
                    serviceCategory: srvKham.category,
                    price: srvKham.price,
                    durationMinutes: srvKham.durationMinutes,
                  },
                ],
              },
            },
            {
              petId: petMochi.id,
              services: {
                create: [
                  {
                    serviceId: srvTam.id,
                    serviceName: srvTam.name,
                    serviceCategory: srvTam.category,
                    price: srvTam.price,
                    durationMinutes: srvTam.durationMinutes,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // (D) Ca đã CHECK-IN chờ BS. Lê Hoàng Nam bấm "Bắt đầu khám" ngay lập tức!
    await prisma.booking.create({
      data: {
        bookingCode: "ANM-8455",
        isGuest: false,
        customerId: customer.id,
        doctorId: docNam.id,
        bookingDate: todayStr,
        startTime: "14:00",
        endTime: "14:30",
        totalDurationMinutes: 30,
        status: "CHECKED_IN",
        notes: "Bé Bơ gãi tai phải nhiều từ tối qua, chủ nuôi đã đến quầy check-in",
        pets: {
          create: [
            {
              petId: petBo.id,
              services: {
                create: [
                  {
                    serviceId: srvKham.id,
                    serviceName: srvKham.name,
                    serviceCategory: srvKham.category,
                    price: srvKham.price,
                    durationMinutes: srvKham.durationMinutes,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // (E) Ca khám quá khứ (15 ngày trước) ĐÃ THANH TOÁN & KHÓA CỨNG S.O.A.P -> Để hiển thị lịch sử khám của bé Bơ!
    const pastBooking = await prisma.booking.create({
      data: {
        bookingCode: "ANM-6012",
        isGuest: false,
        customerId: customer.id,
        doctorId: docNam.id,
        bookingDate: pastDateStr,
        startTime: "09:30",
        endTime: "10:30",
        totalDurationMinutes: 60,
        status: "COMPLETED",
        pets: {
          create: [
            {
              petId: petBo.id,
              services: {
                create: [
                  {
                    serviceId: srvKham.id,
                    serviceName: srvKham.name,
                    serviceCategory: srvKham.category,
                    price: srvKham.price,
                    durationMinutes: srvKham.durationMinutes,
                  },
                  {
                    serviceId: srvSieuAm.id,
                    serviceName: srvSieuAm.name,
                    serviceCategory: srvSieuAm.category,
                    price: srvSieuAm.price,
                    durationMinutes: srvSieuAm.durationMinutes,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const lockedRecord = await prisma.medicalRecord.create({
      data: {
        recordCode: "BA-2026-0001",
        bookingId: pastBooking.id,
        doctorId: docNam.id,
        customerId: customer.id,
        petId: petBo.id,
        subjective: "Bé Bơ ăn hơi chậm trong 2 ngày, đi phân hơi mềm, không nôn ói.",
        objective: "Niêm mạc hồng, bụng mềm không chướng hơi. Siêu âm ổ bụng gan thận bình thường, nhu động ruột hơi tăng nhẹ.",
        weightKg: "11.4",
        temperatureC: "38.6",
        heartRate: "104",
        respiratoryRate: "26",
        assessment: "Rối loạn tiêu hóa nhẹ do thay đổi khẩu phần ăn.",
        plan: "1. Men tiêu hóa Bio-Flora: 1 gói/lần x 2 lần/ngày trong 5 ngày.\n2. Chuyển sang thức ăn dễ tiêu, chia nhỏ bữa.\n3. Theo dõi phân trong 48h, tái khám nếu phân lỏng kéo dài.",
        followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        followUpNote: "Kiểm tra lại cân nặng và tiêm nhắc phòng dại định kỳ",
        status: "LOCKED",
        lockedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceCode: "HD-2026-0001",
        type: "CLINIC",
        bookingId: pastBooking.id,
        medicalRecordId: lockedRecord.id,
        customerId: customer.id,
        petSummary: "Bơ (Chó - Corgi Pembroke)",
        doctorId: docNam.id,
        cashierId: receptionist.id,
        subtotal: 505000,
        eventDiscountAmount: 50000,
        couponDiscountAmount: 0,
        totalAmount: 455000,
        appliedEventPromoTitle: "Ưu đãi Tầm soát Sức khỏe Định kỳ",
        paymentMethod: "VIETQR",
        status: "PAID",
        paidAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              itemType: "SERVICE",
              serviceId: srvKham.id,
              name: srvKham.name,
              category: "MEDICAL",
              unit: "Lần",
              quantity: 1,
              unitPrice: srvKham.price,
              totalPrice: srvKham.price,
              addedByRole: "DOCTOR",
            },
            {
              itemType: "SERVICE",
              serviceId: srvSieuAm.id,
              name: srvSieuAm.name,
              category: "MEDICAL",
              unit: "Lần",
              quantity: 1,
              unitPrice: srvSieuAm.price,
              totalPrice: srvSieuAm.price,
              addedByRole: "DOCTOR",
            },
            {
              itemType: "MEDICINE",
              productId: productMap["TH-BIOF-5G"].id,
              name: productMap["TH-BIOF-5G"].name,
              category: "MEDICINE",
              unit: "Gói",
              quantity: 5,
              unitPrice: productMap["TH-BIOF-5G"].price,
              totalPrice: productMap["TH-BIOF-5G"].price * 5,
              dosageInstruction: "Pha nước ấm uống 1 gói/lần, sáng & tối",
              addedByRole: "DOCTOR",
            },
          ],
        },
      },
    });

    // (F) 1 PHIẾU HÓA ĐƠN CHỜ THANH TOÁN (SENT_TO_POS) từ Bác sĩ gửi ra quầy -> Để test POS ngay!
    const pendingRecord = await prisma.medicalRecord.create({
      data: {
        recordCode: "BA-2026-0002",
        doctorId: docMinhAnh.id,
        customerId: customer.id,
        petId: petMochi.id,
        subjective: "Bé Mochi có vảy gàu nhẹ vùng tai và cổ, gãi tai nhiều 3 ngày gần đây.",
        objective: "Soi tai có dịch ráy nâu sẫm, niêm mạc ống tai hơi đỏ nhẹ. Không sốt, ăn uống bình thường.",
        weightKg: "3.8",
        temperatureC: "38.4",
        heartRate: "152",
        respiratoryRate: "30",
        assessment: "Viêm tai ngoài nhẹ do nấm men Malassezia.",
        plan: "1. Nhỏ tai Surolan: 3 giọt/tai, ngày 2 lần trong 7 ngày.\n2. Uống kháng sinh Amoxicillin 250mg (1/2 viên/lần, ngày 2 lần trong 5 ngày).\n3. Tái khám soi tai sau 7 ngày.",
        followUpDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        followUpNote: "Soi kiểm tra lại ống tai sau liệu trình 7 ngày",
        status: "SENT_TO_POS",
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceCode: "HD-2026-0002",
        type: "CLINIC",
        medicalRecordId: pendingRecord.id,
        customerId: customer.id,
        petSummary: "Mochi (Mèo - Mèo Anh Lông Ngắn)",
        doctorId: docMinhAnh.id,
        subtotal: 150000 + 245000 + 18000 * 5,
        eventDiscountAmount: 0,
        couponDiscountAmount: 0,
        totalAmount: 150000 + 245000 + 18000 * 5,
        status: "PENDING",
        notes: "Bác sĩ Phạm Minh Anh gửi quầy thanh toán (có kê thuốc từ kho FEFO)",
        items: {
          create: [
            {
              itemType: "SERVICE",
              serviceId: srvKham.id,
              name: srvKham.name,
              category: "MEDICAL",
              unit: "Lần",
              quantity: 1,
              unitPrice: srvKham.price,
              totalPrice: srvKham.price,
              addedByRole: "DOCTOR",
            },
            {
              itemType: "MEDICINE",
              productId: productMap["TH-SURO-15"].id,
              name: productMap["TH-SURO-15"].name,
              category: "MEDICINE",
              unit: "Lọ",
              quantity: 1,
              unitPrice: productMap["TH-SURO-15"].price,
              totalPrice: productMap["TH-SURO-15"].price,
              dosageInstruction: "Nhỏ 3 giọt/tai, sáng & tối trong 7 ngày",
              addedByRole: "DOCTOR",
            },
            {
              itemType: "MEDICINE",
              productId: productMap["TH-AMOX-250"].id,
              name: productMap["TH-AMOX-250"].name,
              category: "MEDICINE",
              unit: "Viên",
              quantity: 5,
              unitPrice: productMap["TH-AMOX-250"].price,
              totalPrice: productMap["TH-AMOX-250"].price * 5,
              dosageInstruction: "1/2 viên/lần, ngày 2 lần sau ăn trong 5 ngày",
              addedByRole: "DOCTOR",
            },
          ],
        },
      },
    });
  }

  console.log("✅ Đã nạp thành công toàn bộ dữ liệu mẫu ANIMORA (GD1 + GD2 + GD3)!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu mẫu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
