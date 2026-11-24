"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Stethoscope,
  Sparkles,
  ShoppingBag,
  Banknote,
  QrCode,
  Printer,
  FileText,
  RefreshCw,
  Calendar,
  Award,
  Receipt,
  Users,
  ClipboardCheck,
  AlertTriangle,
  History,
  ArrowRight,
  PackageX,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDateTimeVn, formatVnd } from "@/lib/format";
import type { FlatAuditLog } from "./ManagerInvoicesTab";

interface RevenueReportData {
  period: string;
  date: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  summary: {
    totalRevenue: number;
    totalDiscount: number;
    totalRefunded: number;
    cancelledCount: number;
    cancelledAmount: number;
    invoiceCount: number;
    completedExamsCount: number;
    totalExamsCount: number;
    newCustomersCount: number;
    medicalRevenue: number;
    spaRevenue: number;
    shopRevenue: number;
    shopOnlyRevenue: number;
    medicineRevenue: number;
    totalCash: number;
    totalVietQr: number;
    cashCount: number;
    vietQrCount: number;
  };
  trendSeries: {
    label: string;
    total: number;
    medical: number;
    spa: number;
    shop: number;
  }[];
  doctorStats: {
    doctorId: string;
    doctorName: string;
    title: string | null;
    isActive: boolean;
    examCount: number;
    invoiceCount: number;
    revenue: number;
  }[];
  shiftReconciliation: {
    date: string;
    cashTotal: number;
    vietQrTotal: number;
    grandTotal: number;
    cashCount: number;
    vietQrCount: number;
    cancelledCount: number;
    cancelledTotal: number;
    refundedTotal: number;
    invoices: {
      id: string;
      invoiceCode: string;
      type: string;
      status: string;
      paidAt: string | null;
      customerName: string;
      customerPhone: string;
      petSummary: string | null;
      doctorName: string | null;
      cashierName: string;
      paymentMethod: string | null;
      subtotal: number;
      discountTotal: number;
      totalAmount: number;
      refundedAmount: number;
      netAmount: number;
      cancelReason: string | null;
      medicalRecordId: string | null;
    }[];
  };
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getDateOffsetStr(daysOffset: number): string {
  const d = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatCompactVnd(val: number): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}tr`;
  }
  if (val >= 1_000) {
    return `${Math.round(val / 1_000)}k`;
  }
  return `${val}`;
}

const PIE_COLORS = ["#0F766E", "#F97316", "#132A2E"];

export function ManagerDashboardTab({
  refreshSignal,
  expiringBatchesCount = 0,
  negativeStockCount = 0,
  recentAuditLogs = [],
  onQuickNavigate,
}: {
  refreshSignal?: number;
  expiringBatchesCount?: number;
  negativeStockCount?: number;
  recentAuditLogs?: FlatAuditLog[];
  onQuickNavigate?: (tab: "INVENTORY" | "INVOICES", subTab?: "LIST" | "AUDIT") => void;
}) {
  const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  const [date, setDate] = useState<string>(getTodayStr());
  const [customStart, setCustomStart] = useState<string>(getDateOffsetStr(-14));
  const [customEnd, setCustomEnd] = useState<string>(getTodayStr());
  const [shiftDate, setShiftDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async (
    p = period,
    d = date,
    cs = customStart,
    ce = customEnd,
    sd = shiftDate
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: p,
        date: d,
        shiftDate: sd,
      });
      if (p === "CUSTOM") {
        params.set("startDate", cs);
        params.set("endDate", ce);
      }
      const res = await fetch(`/api/reports/revenue?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period, date, customStart, customEnd, shiftDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date, customStart, customEnd, shiftDate, refreshSignal]);

  const totalStream = Math.max(
    1,
    (data?.summary.medicalRevenue || 0) +
      (data?.summary.spaRevenue || 0) +
      (data?.summary.shopRevenue || 0)
  );

  const pieData = data
    ? [
        { name: "Dịch vụ Y tế", value: data.summary.medicalRevenue },
        { name: "Dịch vụ Spa / Grooming", value: data.summary.spaRevenue },
        { name: "Bán lẻ Shop & Thuốc", value: data.summary.shopRevenue },
      ]
    : [];
  const hasPieRevenue = pieData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Bộ lọc thời gian linh hoạt: Hôm nay / 7 ngày qua / Tháng này / Năm nay / Tùy chỉnh */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap rounded-2xl bg-[#FAF9F6] p-1">
            {[
              { key: "DAY", label: "Hôm nay" },
              { key: "WEEK", label: "7 ngày qua" },
              { key: "MONTH", label: "Tháng này" },
              { key: "YEAR", label: "Năm nay" },
              { key: "CUSTOM", label: "Tùy chỉnh ngày" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key as typeof period)}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  period === item.key
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#476268] hover:text-[#132A2E]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === "CUSTOM" ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-1.5 text-xs">
              <Calendar className="h-4 w-4 text-[#0F766E]" />
              <span className="font-bold text-[#476268]">Từ</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent font-bold text-[#132A2E] focus:outline-none"
              />
              <span className="font-bold text-[#476268]">đến</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent font-bold text-[#132A2E] focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-1.5">
              <Calendar className="h-4 w-4 text-[#0F766E]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#132A2E] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <span className="rounded-xl bg-[#0F766E]/10 px-3.5 py-2 text-xs font-extrabold text-[#0F766E]">
              Kỳ lọc: {data.periodLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadReport(period, date, customStart, customEnd, shiftDate)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-white px-3.5 py-2 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Cập nhật
          </button>
        </div>
      </div>

      {!data ? (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-12 text-center text-sm text-[#476268]">
          Đang tổng hợp số liệu doanh thu thực tế từ SQLite...
        </div>
      ) : (
        <>
          {/* 4 THẺ CHỈ SỐ KPI TỔNG QUAN */}
          <div className="grid grid-cols-4 gap-5">
            <div className="rounded-3xl border border-[#0F766E]/20 bg-gradient-to-br from-[#0F766E] to-[#0B5D56] p-6 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
                  Doanh thu thực nhận
                </span>
                <TrendingUp className="h-5 w-5 text-teal-200" />
              </div>
              <p className="tabular-nums-strict mt-3 font-heading text-3xl font-extrabold">
                {formatVnd(data.summary.totalRevenue)}
              </p>
              <p className="mt-1.5 text-[11px] text-teal-100">
                Giảm giá: {formatVnd(data.summary.totalDiscount)}
                {(data.summary.cancelledCount > 0 || data.summary.totalRefunded > 0) &&
                  ` • Đã trừ hủy/hoàn: ${formatVnd(
                    data.summary.cancelledAmount + data.summary.totalRefunded
                  )}`}
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  Tổng số Hóa đơn
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="tabular-nums-strict mt-3 font-heading text-3xl font-extrabold text-[#132A2E]">
                {data.summary.invoiceCount}{" "}
                <span className="text-sm font-bold text-[#476268]">hóa đơn</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-[#476268]">
                {data.summary.cashCount} Tiền mặt • {data.summary.vietQrCount} VietQR
                {data.summary.cancelledCount > 0 ? ` • ${data.summary.cancelledCount} đã hủy` : ""}
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  Ca khám hoàn tất
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/12 text-[#F97316]">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="tabular-nums-strict mt-3 font-heading text-3xl font-extrabold text-[#F97316]">
                {data.summary.completedExamsCount}{" "}
                <span className="text-sm font-bold text-[#476268]">ca S.O.A.P</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-[#476268]">
                Tổng phát sinh trong kỳ: {data.summary.totalExamsCount} bệnh án
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  Khách hàng mới
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#132A2E]/10 text-[#132A2E]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="tabular-nums-strict mt-3 font-heading text-3xl font-extrabold text-[#132A2E]">
                {data.summary.newCustomersCount}{" "}
                <span className="text-sm font-bold text-[#476268]">tài khoản</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-[#476268]">
                Khách thành viên đăng ký trong kỳ lọc
              </p>
            </div>
          </div>

          {/* KHU VỰC CẢNH BÁO VẬN HÀNH NHANH NGAY TRÊN DASHBOARD (0.5S RECOGNITION) */}
          <div className="grid grid-cols-12 gap-5">
            <button
              type="button"
              onClick={() => onQuickNavigate?.("INVENTORY")}
              className={`col-span-3 flex flex-col justify-between rounded-3xl border-2 p-5 text-left transition hover:shadow-md ${
                expiringBatchesCount > 0
                  ? "alert-urgent-card"
                  : "border-emerald-200 bg-emerald-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase ${
                    expiringBatchesCount > 0 ? "text-[#DC2626]" : "text-emerald-700"
                  }`}
                >
                  <Clock className={`h-4 w-4 ${expiringBatchesCount > 0 ? "animate-heartbeat" : ""}`} />
                  Lô sắp hết hạn (&lt;30 ngày)
                </span>
                <ArrowRight className="h-4 w-4 text-[#476268]" />
              </div>
              <p
                className={`tabular-nums-strict mt-3 font-heading text-3xl font-extrabold ${
                  expiringBatchesCount > 0 ? "text-[#DC2626]" : "text-emerald-700"
                }`}
              >
                {expiringBatchesCount} <span className="text-sm font-bold">lô hàng</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#476268]">
                Bấm để mở Kho thông minh &amp; kiểm tra FEFO
              </p>
            </button>

            <button
              type="button"
              onClick={() => onQuickNavigate?.("INVENTORY")}
              className={`col-span-3 flex flex-col justify-between rounded-3xl border-2 p-5 text-left transition hover:shadow-md ${
                negativeStockCount > 0
                  ? "alert-urgent-card"
                  : "border-emerald-200 bg-emerald-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase ${
                    negativeStockCount > 0 ? "text-[#DC2626]" : "text-emerald-700"
                  }`}
                >
                  <PackageX className={`h-4 w-4 ${negativeStockCount > 0 ? "animate-heartbeat" : ""}`} />
                  Tồn kho âm (&lt; 0)
                </span>
                <ArrowRight className="h-4 w-4 text-[#476268]" />
              </div>
              <p
                className={`tabular-nums-strict mt-3 font-heading text-3xl font-extrabold ${
                  negativeStockCount > 0 ? "text-[#DC2626]" : "text-emerald-700"
                }`}
              >
                {negativeStockCount} <span className="text-sm font-bold">mặt hàng</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#476268]">
                Bấm để nhập lô bù tồn kho ngay
              </p>
            </button>

            <div className="col-span-6 rounded-3xl border border-amber-300 bg-amber-50/60 p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-amber-900">
                  <History className="h-4 w-4 text-[#F97316]" />
                  5 lượt chỉnh sửa hóa đơn gần nhất của Lễ tân (Audit Log)
                </span>
                <button
                  type="button"
                  onClick={() => onQuickNavigate?.("INVOICES", "AUDIT")}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#0F766E] border border-amber-200 hover:bg-[#0F766E] hover:text-white transition"
                >
                  Xem tất cả
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {recentAuditLogs.length === 0 ? (
                <p className="text-xs text-amber-900/75">
                  Chưa ghi nhận lượt chỉnh sửa hóa đơn nào tại quầy.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {recentAuditLogs.slice(0, 5).map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => onQuickNavigate?.("INVOICES", "AUDIT")}
                      className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-left text-[11px] hover:bg-white border border-amber-200/70 transition"
                    >
                      <span className="truncate text-[#132A2E]">
                        <strong className="font-mono text-[#0F766E]">{log.invoice.invoiceCode}</strong>{" "}
                        • <strong>{log.actorName}</strong>: {log.action} [{log.itemName}] —{" "}
                        <span className="text-[#476268]">{log.detail}</span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-[#476268]">
                        {formatDateTimeVn(log.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BIỂU ĐỒ RECHARTS: XU HƯỚNG DOANH THU + TỶ TRỌNG 3 MẢNG */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#132A2E]">
                    Biểu đồ Xu hướng Doanh thu ({data.periodLabel})
                  </h3>
                  <p className="text-xs text-[#476268]">
                    Dữ liệu thực tế từ SQLite (đã tự động trừ hóa đơn hủy &amp; tiền hoàn trả Shop).
                  </p>
                </div>
                <span className="rounded-lg bg-[#0F766E]/10 px-2.5 py-1 text-xs font-extrabold text-[#0F766E]">
                  Tổng kỳ: {formatVnd(data.summary.totalRevenue)}
                </span>
              </div>

              <div className="mt-5 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.trendSeries}
                    margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="animoraRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#476268", fontWeight: 600 }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompactVnd(Number(v))}
                      tick={{ fontSize: 11, fill: "#476268", fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        formatVnd(Number(value) || 0),
                        name === "total"
                          ? "Tổng doanh thu"
                          : name === "medical"
                          ? "Dịch vụ Y tế"
                          : name === "spa"
                          ? "Spa / Grooming"
                          : "Shop & Thuốc",
                      ]}
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid #CCFBF1",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#0F766E"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#animoraRevGrad)"
                      activeDot={{ r: 6, fill: "#F97316", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ Tròn Donut Tách 3 mảng Doanh thu */}
            <div className="col-span-4 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#132A2E]">
                  Tỷ trọng 3 mảng Doanh thu
                </h3>
                <p className="text-[11px] text-[#476268]">
                  Y tế • Spa / Grooming • Bán lẻ Shop &amp; Thuốc kê đơn
                </p>

                <div className="mt-2 h-44 w-full">
                  {hasPieRevenue ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: unknown) => formatVnd(Number(value) || 0)}
                          contentStyle={{
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-[#FAF9F6] text-xs font-semibold text-[#476268]">
                      Chưa phát sinh doanh thu trong kỳ này
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  {[
                    {
                      label: "1. Dịch vụ Y tế",
                      val: data.summary.medicalRevenue,
                      color: "bg-[#0F766E]",
                      icon: Stethoscope,
                      sub: null,
                    },
                    {
                      label: "2. Dịch vụ Spa / Grooming",
                      val: data.summary.spaRevenue,
                      color: "bg-[#F97316]",
                      icon: Sparkles,
                      sub: null,
                    },
                    {
                      label: "3. Bán lẻ Shop & Thuốc",
                      val: data.summary.shopRevenue,
                      color: "bg-[#132A2E]",
                      icon: ShoppingBag,
                      sub: `Shop: ${formatVnd(data.summary.shopOnlyRevenue)} • Thuốc: ${formatVnd(
                        data.summary.medicineRevenue
                      )}`,
                    },
                  ].map((s) => {
                    const pct =
                      data.summary.totalRevenue > 0
                        ? Math.round((s.val / totalStream) * 100)
                        : 0;
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                            {s.label}
                          </span>
                          <span>
                            {formatVnd(s.val)} ({pct}%)
                          </span>
                        </div>
                        {s.sub && (
                          <p className="pl-4 text-[10px] text-[#476268]">{s.sub}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-3.5 text-xs space-y-1.5">
                <p className="font-extrabold text-[#132A2E]">
                  Phương thức thanh toán ({data.periodLabel})
                </p>
                <div className="flex justify-between">
                  <span className="text-[#476268]">
                    Tiền mặt ({data.summary.cashCount} đơn):
                  </span>
                  <strong className="text-[#0F766E]">{formatVnd(data.summary.totalCash)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#476268]">
                    VietQR ({data.summary.vietQrCount} đơn):
                  </span>
                  <strong className="text-[#F97316]">{formatVnd(data.summary.totalVietQr)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* BẢNG HIỆU SUẤT THEO TỪNG BÁC SĨ */}
          <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Award className="h-5 w-5" />
              <h3 className="text-base font-extrabold text-[#132A2E]">
                Bảng Hiệu suất theo từng Bác sĩ ({data.periodLabel})
              </h3>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Bác sĩ</th>
                    <th className="py-2.5">Chức danh</th>
                    <th className="py-2.5 text-center">Trạng thái</th>
                    <th className="py-2.5 text-center">Số ca khám đã thực hiện</th>
                    <th className="py-2.5 text-center">Hóa đơn đã thu</th>
                    <th className="py-2.5 text-right">Tổng doanh thu mang lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {data.doctorStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#476268]">
                        Chưa có dữ liệu Bác sĩ — Quản lý vui lòng thêm tài khoản Bác sĩ trong mục Nhân sự.
                      </td>
                    </tr>
                  )}
                  {data.doctorStats.map((doc) => (
                    <tr key={doc.doctorId} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 font-extrabold text-[#132A2E]">{doc.doctorName}</td>
                      <td className="py-3 text-[#476268]">{doc.title || "Bác sĩ Thú y"}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            doc.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {doc.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </span>
                      </td>
                      <td className="py-3 text-center font-extrabold text-[#0F766E]">
                        {doc.examCount} ca
                      </td>
                      <td className="py-3 text-center font-bold">{doc.invoiceCount} đơn</td>
                      <td className="py-3 text-right font-extrabold text-[#F97316]">
                        {formatVnd(doc.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BẢNG ĐỐI SOÁT CHỐT CA CUỐI NGÀY (TIỀN MẶT VS VIETQR) */}
          <div className="rounded-3xl border-2 border-[#0F766E]/25 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#132A2E]">
                  Bảng Đối soát Chốt ca Cuối ngày ({data.shiftReconciliation.date})
                </h3>
                <p className="text-xs text-[#476268]">
                  Tách bạch Tiền mặt và Chuyển khoản VietQR — kiểm soát bàn giao ca cuối ngày.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs">
                  <Calendar className="h-4 w-4 text-[#0F766E]" />
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="bg-transparent font-bold text-[#132A2E] focus:outline-none"
                  />
                </div>
                <Link
                  href={`/in/chot-ca?date=${encodeURIComponent(data.shiftReconciliation.date)}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#EA580C]"
                >
                  <Printer className="h-4 w-4" />
                  In Bảng chốt ca A4
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-emerald-800">
                      Tổng thu Tiền mặt
                    </p>
                    <p className="text-xs text-emerald-700">
                      {data.shiftReconciliation.cashCount} hóa đơn
                    </p>
                  </div>
                </div>
                <p className="font-heading text-xl font-extrabold text-emerald-900">
                  {formatVnd(data.shiftReconciliation.cashTotal)}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#F97316]/30 bg-[#F97316]/8 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#EA580C]">
                      Chuyển khoản VietQR
                    </p>
                    <p className="text-xs text-[#EA580C]/90">
                      {data.shiftReconciliation.vietQrCount} hóa đơn
                    </p>
                  </div>
                </div>
                <p className="font-heading text-xl font-extrabold text-[#EA580C]">
                  {formatVnd(data.shiftReconciliation.vietQrTotal)}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#0F766E] p-5 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase text-teal-100">
                    Tổng thực thu ngày
                  </p>
                  <p className="text-xs text-teal-100">
                    {data.shiftReconciliation.cashCount + data.shiftReconciliation.vietQrCount} hóa đơn
                  </p>
                </div>
                <p className="font-heading text-xl font-extrabold">
                  {formatVnd(data.shiftReconciliation.grandTotal)}
                </p>
              </div>
            </div>

            {(data.shiftReconciliation.cancelledCount > 0 ||
              data.shiftReconciliation.refundedTotal > 0) && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>
                  Trong ngày có <strong>{data.shiftReconciliation.cancelledCount}</strong> hóa đơn đã hủy (
                  {formatVnd(data.shiftReconciliation.cancelledTotal)}) và tổng hoàn trả Shop{" "}
                  <strong>{formatVnd(data.shiftReconciliation.refundedTotal)}</strong> — đã được tự động trừ khỏi số thực thu bên trên.
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Mã HĐ</th>
                    <th className="py-2.5">Giờ thu</th>
                    <th className="py-2.5">Khách hàng</th>
                    <th className="py-2.5">Phương thức</th>
                    <th className="py-2.5">Trạng thái</th>
                    <th className="py-2.5">Người thu</th>
                    <th className="py-2.5 text-right">Thực thu</th>
                    <th className="py-2.5 text-right">In A4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {data.shiftReconciliation.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={
                        inv.status === "CANCELLED" ? "bg-rose-50/50" : "hover:bg-[#FAF9F6]"
                      }
                    >
                      <td className="py-3 font-mono font-extrabold text-[#0F766E]">
                        {inv.invoiceCode}
                      </td>
                      <td className="py-3 text-[#476268]">{formatDateTimeVn(inv.paidAt)}</td>
                      <td className="py-3">
                        <p className="font-bold text-[#132A2E]">{inv.customerName}</p>
                        <p className="text-[11px] text-[#476268]">{inv.petSummary || "Bán lẻ"}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${
                            inv.paymentMethod === "VIETQR"
                              ? "bg-[#F97316]/15 text-[#EA580C]"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {inv.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "PARTIALLY_RETURNED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {inv.status === "PAID"
                            ? "Đã thanh toán"
                            : inv.status === "PARTIALLY_RETURNED"
                            ? `Hoàn Shop -${formatVnd(inv.refundedAmount)}`
                            : "Đã hủy"}
                        </span>
                      </td>
                      <td className="py-3 text-[#476268]">{inv.cashierName}</td>
                      <td className="py-3 text-right font-extrabold text-[#132A2E]">
                        {formatVnd(inv.netAmount)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/in/hoa-don/${inv.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#0F766E]/25 bg-white px-2.5 py-1 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                          >
                            <Printer className="h-3 w-3" />
                            HĐ
                          </Link>
                          {inv.medicalRecordId && (
                            <Link
                              href={`/in/phieu-kham/${inv.medicalRecordId}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-bold text-[#132A2E] hover:bg-slate-50"
                            >
                              <FileText className="h-3 w-3" />
                              Đơn thuốc
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.shiftReconciliation.invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#476268]">
                        Chưa có hóa đơn nào được thu trong ngày {data.shiftReconciliation.date}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
