import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseYmd(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  const now = new Date();
  const year = parts[0] || now.getFullYear();
  const month = (parts[1] || now.getMonth() + 1) - 1;
  const day = parts[2] || now.getDate();
  return new Date(year, month, day);
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getRangeForPeriod(
  period: string,
  dateStr: string,
  customStart?: string | null,
  customEnd?: string | null
): { start: Date; end: Date; label: string } {
  const ref = parseYmd(dateStr);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  if (period === "CUSTOM" && customStart && customEnd) {
    const s = parseYmd(customStart);
    const e = parseYmd(customEnd);
    const start = new Date(
      Math.min(s.getTime(), e.getTime())
    );
    start.setHours(0, 0, 0, 0);
    const end = new Date(
      Math.max(s.getTime(), e.getTime())
    );
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: `Từ ${start.toLocaleDateString("vi-VN")} đến ${end.toLocaleDateString("vi-VN")}`,
    };
  }

  if (period === "WEEK") {
    // 7 ngày gần nhất tính đến ngày chọn (bao gồm ngày chọn)
    const end = new Date(year, month, day, 23, 59, 59, 999);
    const start = new Date(year, month, day - 6, 0, 0, 0, 0);
    return {
      start,
      end,
      label: `7 ngày qua (${start.toLocaleDateString("vi-VN")} – ${end.toLocaleDateString("vi-VN")})`,
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

/**
 * Tách doanh thu thực nhận của 1 hóa đơn (đã trừ khuyến mãi & đã trừ refundedAmount) thành 3 mảng:
 * 1) Dịch vụ Y tế (MEDICAL)
 * 2) Dịch vụ Spa / Grooming (SPA)
 * 3) Bán lẻ Shop & Thuốc kê đơn (SHOP + MEDICINE)
 */
function splitInvoiceNetRevenue(inv: {
  totalAmount: number;
  refundedAmount: number;
  items: { category: string; quantity: number; returnedQuantity: number; unitPrice: number; totalPrice: number }[];
}) {
  const netAmount = Math.max(0, inv.totalAmount - inv.refundedAmount);
  if (netAmount <= 0) {
    return { netAmount: 0, medical: 0, spa: 0, shop: 0, shopOnly: 0, medicineOnly: 0 };
  }

  let grossMed = 0;
  let grossSpa = 0;
  let grossShopOnly = 0;
  let grossMedOnly = 0;

  for (const it of inv.items) {
    const activeQty = Math.max(0, it.quantity - (it.returnedQuantity || 0));
    const activeGross = activeQty * it.unitPrice;
    if (it.category === "MEDICAL") grossMed += activeGross;
    else if (it.category === "SPA") grossSpa += activeGross;
    else if (it.category === "MEDICINE") grossMedOnly += activeGross;
    else grossShopOnly += activeGross;
  }

  const grossShopAndMed = grossShopOnly + grossMedOnly;
  const grossTotal = grossMed + grossSpa + grossShopAndMed;

  if (grossTotal <= 0) {
    return { netAmount, medical: netAmount, spa: 0, shop: 0, shopOnly: 0, medicineOnly: 0 };
  }

  const ratio = netAmount / grossTotal;
  const medical = Math.round(grossMed * ratio);
  const spa = Math.round(grossSpa * ratio);
  const shop = Math.max(0, netAmount - medical - spa);
  const shopOnly =
    grossShopAndMed > 0 ? Math.round((grossShopOnly / grossShopAndMed) * shop) : 0;
  const medicineOnly = Math.max(0, shop - shopOnly);

  return { netAmount, medical, spa, shop, shopOnly, medicineOnly };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["MANAGER", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền xem báo cáo" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawPeriod = String(searchParams.get("period") || "MONTH");
  const period = ["DAY", "WEEK", "MONTH", "YEAR", "CUSTOM"].includes(rawPeriod)
    ? rawPeriod
    : "MONTH";

  const todayStr = formatYmd(new Date());
  const dateStr = searchParams.get("date") || todayStr;
  const customStart = searchParams.get("startDate");
  const customEnd = searchParams.get("endDate");
  const shiftDateStr = searchParams.get("shiftDate") || dateStr;

  const { start, end, label } = getRangeForPeriod(period, dateStr, customStart, customEnd);
  const dayRange = getRangeForPeriod("DAY", shiftDateStr);

  const [
    periodAllInvoices,
    dayAllInvoices,
    periodRecords,
    newCustomersCount,
    doctors,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: { in: ["PAID", "PARTIALLY_RETURNED", "CANCELLED"] },
        OR: [
          { paidAt: { gte: start, lte: end } },
          { paidAt: null, cancelledAt: { gte: start, lte: end } },
        ],
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
        status: { in: ["PAID", "PARTIALLY_RETURNED", "CANCELLED"] },
        OR: [
          { paidAt: { gte: dayRange.start, lte: dayRange.end } },
          { paidAt: null, cancelledAt: { gte: dayRange.start, lte: dayRange.end } },
        ],
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
      select: { id: true, doctorId: true, status: true },
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, fullName: true, title: true, isActive: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const activePeriodInvoices = periodAllInvoices.filter(
    (inv) => inv.status === "PAID" || inv.status === "PARTIALLY_RETURNED"
  );
  const cancelledPeriodInvoices = periodAllInvoices.filter(
    (inv) => inv.status === "CANCELLED"
  );

  // 1) Tổng doanh thu thực nhận & tách 3 mảng (Y tế / Spa / Bán lẻ Shop & Thuốc)
  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalRefunded = 0;
  let medicalRevenue = 0;
  let spaRevenue = 0;
  let shopRevenue = 0;
  let shopOnlyRevenue = 0;
  let medicineRevenue = 0;
  let totalCash = 0;
  let totalVietQr = 0;
  let cashCount = 0;
  let vietQrCount = 0;

  for (const inv of activePeriodInvoices) {
    const split = splitInvoiceNetRevenue(inv);
    totalRevenue += split.netAmount;
    totalDiscount += inv.eventDiscountAmount + inv.couponDiscountAmount;
    totalRefunded += inv.refundedAmount;

    medicalRevenue += split.medical;
    spaRevenue += split.spa;
    shopRevenue += split.shop;
    shopOnlyRevenue += split.shopOnly;
    medicineRevenue += split.medicineOnly;

    if (inv.paymentMethod === "VIETQR") {
      totalVietQr += split.netAmount;
      vietQrCount += 1;
    } else {
      totalCash += split.netAmount;
      cashCount += 1;
    }
  }

  const cancelledAmount = cancelledPeriodInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const completedExamsCount = periodRecords.filter(
    (r) => r.status === "LOCKED" || r.status === "SENT_TO_POS"
  ).length;

  // 2) Chuỗi biểu đồ xu hướng theo bộ lọc thời gian
  const trendMap = new Map<
    string,
    { label: string; total: number; medical: number; spa: number; shop: number }
  >();

  if (period === "DAY") {
    for (let h = 7; h <= 20; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      trendMap.set(key, { label: key, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of activePeriodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const h = Math.min(20, Math.max(7, d.getHours()));
      const key = `${String(h).padStart(2, "0")}:00`;
      const bucket = trendMap.get(key);
      if (bucket) {
        const split = splitInvoiceNetRevenue(inv);
        bucket.total += split.netAmount;
        bucket.medical += split.medical;
        bucket.spa += split.spa;
        bucket.shop += split.shop;
      }
    }
  } else if (period === "WEEK" || period === "CUSTOM") {
    const daySpan = Math.min(
      62,
      Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    );
    if (daySpan <= 35) {
      const dowNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      for (let i = 0; i < daySpan; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const key = formatYmd(d);
        const shortDate = `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        trendMap.set(key, {
          label: period === "WEEK" ? `${dowNames[d.getDay()]} ${shortDate}` : shortDate,
          total: 0,
          medical: 0,
          spa: 0,
          shop: 0,
        });
      }
      for (const inv of activePeriodInvoices) {
        const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
        const key = formatYmd(d);
        const bucket = trendMap.get(key);
        if (bucket) {
          const split = splitInvoiceNetRevenue(inv);
          bucket.total += split.netAmount;
          bucket.medical += split.medical;
          bucket.spa += split.spa;
          bucket.shop += split.shop;
        }
      }
    } else {
      // Khoảng tùy chỉnh dài (> 35 ngày) -> gom theo Tháng
      const cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
        trendMap.set(key, {
          label: `T${cur.getMonth() + 1}/${String(cur.getFullYear()).slice(-2)}`,
          total: 0,
          medical: 0,
          spa: 0,
          shop: 0,
        });
        cur.setMonth(cur.getMonth() + 1);
      }
      for (const inv of activePeriodInvoices) {
        const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = trendMap.get(key);
        if (bucket) {
          const split = splitInvoiceNetRevenue(inv);
          bucket.total += split.netAmount;
          bucket.medical += split.medical;
          bucket.spa += split.spa;
          bucket.shop += split.shop;
        }
      }
    }
  } else if (period === "MONTH") {
    const daysInMonth = end.getDate();
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const key = String(dayNum).padStart(2, "0");
      trendMap.set(key, { label: `${dayNum}`, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of activePeriodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = String(d.getDate()).padStart(2, "0");
      const bucket = trendMap.get(key);
      if (bucket) {
        const split = splitInvoiceNetRevenue(inv);
        bucket.total += split.netAmount;
        bucket.medical += split.medical;
        bucket.spa += split.spa;
        bucket.shop += split.shop;
      }
    }
  } else {
    for (let m = 1; m <= 12; m++) {
      const key = String(m).padStart(2, "0");
      trendMap.set(key, { label: `T${m}`, total: 0, medical: 0, spa: 0, shop: 0 });
    }
    for (const inv of activePeriodInvoices) {
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = String(d.getMonth() + 1).padStart(2, "0");
      const bucket = trendMap.get(key);
      if (bucket) {
        const split = splitInvoiceNetRevenue(inv);
        bucket.total += split.netAmount;
        bucket.medical += split.medical;
        bucket.spa += split.spa;
        bucket.shop += split.shop;
      }
    }
  }

  // 3) Hiệu suất theo từng Bác sĩ (đã trừ hoàn trả & loại hóa đơn hủy)
  const doctorStats = doctors.map((doc) => {
    const docRecords = periodRecords.filter((r) => r.doctorId === doc.id);
    const docInvoices = activePeriodInvoices.filter((inv) => inv.doctorId === doc.id);
    const revenue = docInvoices.reduce(
      (s, i) => s + Math.max(0, i.totalAmount - i.refundedAmount),
      0
    );
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

  // 4) Bảng đối soát chốt ca cuối ngày (cho đúng ngày shiftDateStr)
  let shiftCashTotal = 0;
  let shiftVietQrTotal = 0;
  let shiftCashCount = 0;
  let shiftVietQrCount = 0;
  let shiftCancelledCount = 0;
  let shiftCancelledTotal = 0;
  let shiftRefundedTotal = 0;

  for (const inv of dayAllInvoices) {
    if (inv.status === "CANCELLED") {
      shiftCancelledCount += 1;
      shiftCancelledTotal += inv.totalAmount;
      continue;
    }
    const netAmount = Math.max(0, inv.totalAmount - inv.refundedAmount);
    shiftRefundedTotal += inv.refundedAmount;
    if (inv.paymentMethod === "VIETQR") {
      shiftVietQrTotal += netAmount;
      shiftVietQrCount += 1;
    } else {
      shiftCashTotal += netAmount;
      shiftCashCount += 1;
    }
  }

  return NextResponse.json({
    period,
    date: dateStr,
    startDate: formatYmd(start),
    endDate: formatYmd(end),
    periodLabel: label,
    summary: {
      totalRevenue,
      totalDiscount,
      totalRefunded,
      cancelledCount: cancelledPeriodInvoices.length,
      cancelledAmount,
      invoiceCount: activePeriodInvoices.length,
      completedExamsCount,
      totalExamsCount: periodRecords.length,
      newCustomersCount,
      medicalRevenue,
      spaRevenue,
      shopRevenue,
      shopOnlyRevenue,
      medicineRevenue,
      totalCash,
      totalVietQr,
      cashCount,
      vietQrCount,
    },
    trendSeries: Array.from(trendMap.values()),
    doctorStats,
    shiftReconciliation: {
      date: shiftDateStr,
      cashTotal: shiftCashTotal,
      vietQrTotal: shiftVietQrTotal,
      grandTotal: shiftCashTotal + shiftVietQrTotal,
      cashCount: shiftCashCount,
      vietQrCount: shiftVietQrCount,
      cancelledCount: shiftCancelledCount,
      cancelledTotal: shiftCancelledTotal,
      refundedTotal: shiftRefundedTotal,
      invoices: dayAllInvoices.map((inv) => {
        const netAmount =
          inv.status === "CANCELLED" ? 0 : Math.max(0, inv.totalAmount - inv.refundedAmount);
        return {
          id: inv.id,
          invoiceCode: inv.invoiceCode,
          type: inv.type,
          status: inv.status,
          paidAt: inv.paidAt || inv.cancelledAt || inv.createdAt,
          customerName: inv.customer?.fullName || inv.guestName || "Khách lẻ",
          customerPhone: inv.customer?.phone || inv.guestPhone || "—",
          petSummary: inv.petSummary,
          doctorName: inv.doctor?.fullName || null,
          cashierName: inv.cashier?.fullName || "—",
          paymentMethod: inv.paymentMethod,
          subtotal: inv.subtotal,
          discountTotal: inv.eventDiscountAmount + inv.couponDiscountAmount,
          totalAmount: inv.totalAmount,
          refundedAmount: inv.refundedAmount,
          netAmount,
          cancelReason: inv.cancelReason,
          medicalRecordId: inv.medicalRecord?.id || null,
        };
      }),
    },
  });
}
