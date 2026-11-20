import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRangeForPeriod(period: string, dateStr: string): {
  start: Date;
  end: Date;
  label: string;
} {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || new Date().getMonth() + 1) - 1;
  const day = parts[2] || new Date().getDate();

  if (period === "WEEK") {
    const ref = new Date(year, month, day);
    const dow = ref.getDay(); // 0=CN..6=T7
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const start = new Date(year, month, day + diffToMon, 0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Tuần (${start.toLocaleDateString("vi-VN")} – ${end.toLocaleDateString("vi-VN")})`,
    };
  }

  if (period === "MONTH") {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Tháng ${String(month + 1).padStart(2, "0")}/${year}`,
    };
  }

  if (period === "YEAR") {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end, label: `Năm ${year}` };
  }

  // DAY
  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);
  return {
    start,
    end,
    label: `Ngày ${start.toLocaleDateString("vi-VN")}`,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["MANAGER", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền xem báo cáo" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = ["DAY", "WEEK", "MONTH", "YEAR"].includes(String(searchParams.get("period")))
    ? String(searchParams.get("period"))
    : "MONTH";
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const dateStr = searchParams.get("date") || defaultDate;

  const { start, end, label } = getRangeForPeriod(period, dateStr);

  // Chốt ca cuối ngày luôn tính riêng cho đúng ngày dateStr được chọn
  const dayRange = getRangeForPeriod("DAY", dateStr);

  const [periodInvoices, dayInvoices, periodRecords, doctors] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: start, lte: end },
      },
      include: {
        items: true,
        doctor: { select: { id: true, fullName: true, title: true } },
        cashier: { select: { id: true, fullName: true } },
        customer: { select: { fullName: true, phone: true } },
        medicalRecord: { select: { id: true, recordCode: true } },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: dayRange.start, lte: dayRange.end },
      },
      include: {
        doctor: { select: { id: true, fullName: true } },
        cashier: { select: { id: true, fullName: true } },
        customer: { select: { fullName: true, phone: true } },
        medicalRecord: { select: { id: true, recordCode: true } },
        items: true,
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.medicalRecord.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: { id: true, doctorId: true },
    }),
    prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, fullName: true, title: true, isActive: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  // 1) Tổng doanh thu & phân bổ 3 mảng (Y tế / Spa / Bán lẻ Shop) theo tỷ lệ thực thu
  let totalRevenue = 0;
  let totalDiscount = 0;
  let medicalRevenue = 0;
  let spaRevenue = 0;
  let shopRevenue = 0;
  let totalCash = 0;
  let totalVietQr = 0;
  let cashCount = 0;
  let vietQrCount = 0;

  for (const inv of periodInvoices) {
    totalRevenue += inv.totalAmount;
    totalDiscount += inv.eventDiscountAmount + inv.couponDiscountAmount;

    if (inv.paymentMethod === "VIETQR") {
      totalVietQr += inv.totalAmount;
      vietQrCount += 1;
    } else {
      totalCash += inv.totalAmount;
      cashCount += 1;
    }

    const grossMed = inv.items
      .filter((i) => i.category === "MEDICAL" || i.category === "MEDICINE")
      .reduce((s, i) => s + i.totalPrice, 0);
    const grossSpa = inv.items
      .filter((i) => i.category === "SPA")
      .reduce((s, i) => s + i.totalPrice, 0);
    const grossShop = inv.items
      .filter((i) => i.category === "SHOP")
      .reduce((s, i) => s + i.totalPrice, 0);
    const grossTotal = grossMed + grossSpa + grossShop;

    if (grossTotal > 0) {
      const ratio = inv.totalAmount / grossTotal;
      const netMed = Math.round(grossMed * ratio);
      const netSpa = Math.round(grossSpa * ratio);
      const netShop = Math.max(0, inv.totalAmount - netMed - netSpa);
      medicalRevenue += netMed;
      spaRevenue += netSpa;
      shopRevenue += netShop;
    } else {
      medicalRevenue += inv.totalAmount;
    }
  }

  // 2) Chuỗi biểu đồ xu hướng theo bộ lọc Ngày / Tuần / Tháng / Năm
  const trendMap = new Map<string, { label: string; total: number; medical: number; spa: number; shop: number }>();

  if (period === "DAY") {
    for (let h = 7; h <= 20; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      trendMap.set(key, { label: key, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of periodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const h = Math.min(20, Math.max(7, d.getHours()));
      const key = `${String(h).padStart(2, "0")}:00`;
      const bucket = trendMap.get(key)!;
      bucket.total += inv.totalAmount;
    }
  } else if (period === "WEEK") {
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      trendMap.set(key, {
        label: `${dayNames[i]} (${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")})`,
        total: 0,
        medical: 0,
        spa: 0,
        shop: 0,
      });
    }
    for (const inv of periodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const bucket = trendMap.get(key);
      if (bucket) bucket.total += inv.totalAmount;
    }
  } else if (period === "MONTH") {
    const daysInMonth = end.getDate();
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const key = String(dayNum).padStart(2, "0");
      trendMap.set(key, { label: `${dayNum}`, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of periodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = String(d.getDate()).padStart(2, "0");
      const bucket = trendMap.get(key);
      if (bucket) bucket.total += inv.totalAmount;
    }
  } else {
    for (let m = 1; m <= 12; m++) {
      const key = String(m).padStart(2, "0");
      trendMap.set(key, { label: `T${m}`, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of periodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = String(d.getMonth() + 1).padStart(2, "0");
      const bucket = trendMap.get(key);
      if (bucket) bucket.total += inv.totalAmount;
    }
  }

  // 3) Thống kê theo từng Bác sĩ
  const doctorStats = doctors.map((doc) => {
    const docRecords = periodRecords.filter((r) => r.doctorId === doc.id);
    const docInvoices = periodInvoices.filter((inv) => inv.doctorId === doc.id);
    const revenue = docInvoices.reduce((s, i) => s + i.totalAmount, 0);
    return {
      doctorId: doc.id,
      doctorName: doc.fullName,
      title: doc.title,
      isActive: doc.isActive,
      examCount: docRecords.length,
      invoiceCount: docInvoices.length,
      revenue,
    };
  });

  // 4) Bảng đối soát chốt ca cuối ngày (cho ngày dateStr)
  let shiftCashTotal = 0;
  let shiftVietQrTotal = 0;
  let shiftCashCount = 0;
  let shiftVietQrCount = 0;

  for (const inv of dayInvoices) {
    if (inv.paymentMethod === "VIETQR") {
      shiftVietQrTotal += inv.totalAmount;
      shiftVietQrCount += 1;
    } else {
      shiftCashTotal += inv.totalAmount;
      shiftCashCount += 1;
    }
  }

  return NextResponse.json({
    period,
    date: dateStr,
    periodLabel: label,
    summary: {
      totalRevenue,
      totalDiscount,
      invoiceCount: periodInvoices.length,
      medicalRevenue,
      spaRevenue,
      shopRevenue,
      totalCash,
      totalVietQr,
      cashCount,
      vietQrCount,
    },
    trendSeries: Array.from(trendMap.values()),
    doctorStats,
    shiftReconciliation: {
      date: dateStr,
      cashTotal: shiftCashTotal,
      vietQrTotal: shiftVietQrTotal,
      grandTotal: shiftCashTotal + shiftVietQrTotal,
      cashCount: shiftCashCount,
      vietQrCount: shiftVietQrCount,
      invoices: dayInvoices.map((inv) => ({
        id: inv.id,
        invoiceCode: inv.invoiceCode,
        type: inv.type,
        paidAt: inv.paidAt,
        customerName: inv.customer?.fullName || inv.guestName || "Khách lẻ",
        customerPhone: inv.customer?.phone || inv.guestPhone || "—",
        petSummary: inv.petSummary,
        doctorName: inv.doctor?.fullName || null,
        cashierName: inv.cashier?.fullName || "—",
        paymentMethod: inv.paymentMethod,
        subtotal: inv.subtotal,
        discountTotal: inv.eventDiscountAmount + inv.couponDiscountAmount,
        totalAmount: inv.totalAmount,
        medicalRecordId: inv.medicalRecord?.id || null,
      })),
    },
  });
}
