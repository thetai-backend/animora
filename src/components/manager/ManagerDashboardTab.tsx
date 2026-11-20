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
} from "lucide-react";
import { formatDateTimeVn, formatVnd } from "@/lib/format";

interface RevenueReportData {
  period: string;
  date: string;
  periodLabel: string;
  summary: {
    totalRevenue: number;
    totalDiscount: number;
    invoiceCount: number;
    medicalRevenue: number;
    spaRevenue: number;
    shopRevenue: number;
    totalCash: number;
    totalVietQr: number;
    cashCount: number;
    vietQrCount: number;
  };
  trendSeries: { label: string; total: number }[];
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
    invoices: {
      id: string;
      invoiceCode: string;
      type: string;
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

export function ManagerDashboardTab({
  refreshSignal,
}: {
  refreshSignal?: number;
}) {
  const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR">("MONTH");
  const [date, setDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async (p = period, d = date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue?period=${p}&date=${encodeURIComponent(d)}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date, refreshSignal]);

  const maxTrend = Math.max(
    1,
    ...(data?.trendSeries.map((t) => t.total) || [1])
  );
  const totalStream = Math.max(
    1,
    (data?.summary.medicalRevenue || 0) +
      (data?.summary.spaRevenue || 0) +
      (data?.summary.shopRevenue || 0)
  );

  return (
    <div className="space-y-6">
      {/* Bộ lọc Ngày / Tuần / Tháng / Năm */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl bg-[#FAF9F6] p-1">
            {[
              { key: "DAY", label: "Theo Ngày" },
              { key: "WEEK", label: "Theo Tuần" },
              { key: "MONTH", label: "Theo Tháng" },
              { key: "YEAR", label: "Theo Năm" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key as typeof period)}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                  period === item.key
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#476268] hover:text-[#132A2E]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-1.5">
            <Calendar className="h-4 w-4 text-[#0F766E]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#132A2E] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <span className="rounded-xl bg-[#0F766E]/10 px-3.5 py-2 text-xs font-extrabold text-[#0F766E]">
              Kỳ báo cáo: {data.periodLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadReport(period, date)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-white px-3.5 py-2 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Cập nhật
          </button>
        </div>
      </div>

      {!data ? (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-12 text-center text-sm text-[#476268]">
          Đang tải số liệu doanh thu thực tế từ hệ thống...
        </div>
      ) : (
        <>
          {/* 4 Thẻ Tổng quan + 3 Mảng doanh thu rõ ràng */}
          <div className="grid grid-cols-4 gap-5">
            <div className="rounded-3xl border border-[#0F766E]/20 bg-gradient-to-br from-[#0F766E] to-[#0B5D56] p-6 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
                  Tổng Doanh thu thực thu
                </span>
                <TrendingUp className="h-5 w-5 text-teal-200" />
              </div>
              <p className="mt-3 font-heading text-3xl font-extrabold">
                {formatVnd(data.summary.totalRevenue)}
              </p>
              <p className="mt-1.5 text-xs text-teal-100">
                {data.summary.invoiceCount} hóa đơn đã thu • Giảm giá:{" "}
                {formatVnd(data.summary.totalDiscount)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  1. Dịch vụ Y tế &amp; Thuốc
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                  <Stethoscope className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-heading text-2xl font-extrabold text-[#0F766E]">
                {formatVnd(data.summary.medicalRevenue)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#476268]">
                Chiếm {Math.round((data.summary.medicalRevenue / totalStream) * 100)}% tổng doanh thu
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  2. Dịch vụ Spa / Grooming
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/12 text-[#F97316]">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-heading text-2xl font-extrabold text-[#F97316]">
                {formatVnd(data.summary.spaRevenue)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#476268]">
                Chiếm {Math.round((data.summary.spaRevenue / totalStream) * 100)}% tổng doanh thu
              </p>
            </div>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#476268]">
                  3. Bán lẻ Shop tại quầy
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#132A2E]/10 text-[#132A2E]">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-heading text-2xl font-extrabold text-[#132A2E]">
                {formatVnd(data.summary.shopRevenue)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#476268]">
                Chiếm {Math.round((data.summary.shopRevenue / totalStream) * 100)}% tổng doanh thu
              </p>
            </div>
          </div>

          {/* Biểu đồ Xu hướng + Tỷ trọng 3 mảng */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#132A2E]">
                    Biểu đồ Xu hướng Doanh thu ({data.periodLabel})
                  </h3>
                  <p className="text-xs text-[#476268]">
                    Chỉ tính hóa đơn Đã thanh toán (tự động loại bỏ hóa đơn đã hủy).
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0F766E]">
                  Cao nhất: {formatVnd(maxTrend === 1 && data.summary.totalRevenue === 0 ? 0 : maxTrend)}
                </span>
              </div>

              <div className="mt-6 flex h-56 items-end gap-1.5 rounded-2xl bg-[#FAF9F6] px-4 pb-3 pt-6">
                {data.trendSeries.map((bar) => {
                  const pct = bar.total > 0 ? Math.max(8, Math.round((bar.total / maxTrend) * 100)) : 2;
                  return (
                    <div
                      key={bar.label}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                    >
                      {bar.total > 0 && (
                        <div className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-lg bg-[#132A2E] px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block">
                          {bar.label}: {formatVnd(bar.total)}
                        </div>
                      )}
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full max-w-[34px] rounded-t-lg transition-all ${
                          bar.total > 0
                            ? "bg-gradient-to-t from-[#0F766E] to-[#14B8A6] group-hover:from-[#F97316] group-hover:to-[#FB923C]"
                            : "bg-slate-200"
                        }`}
                      />
                      <span className="mt-1.5 truncate text-[10px] font-bold text-[#476268]">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tỷ trọng 3 mảng & Kênh thanh toán trong kỳ */}
            <div className="col-span-4 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-[#132A2E]">
                  Cơ cấu 3 mảng Doanh thu
                </h3>
                <div className="mt-4 space-y-3.5 text-xs">
                  {[
                    {
                      label: "Dịch vụ Y tế & Thuốc",
                      val: data.summary.medicalRevenue,
                      color: "bg-[#0F766E]",
                    },
                    {
                      label: "Dịch vụ Spa / Grooming",
                      val: data.summary.spaRevenue,
                      color: "bg-[#F97316]",
                    },
                    {
                      label: "Bán lẻ Shop tại quầy",
                      val: data.summary.shopRevenue,
                      color: "bg-[#132A2E]",
                    },
                  ].map((s) => {
                    const pct =
                      data.summary.totalRevenue > 0
                        ? Math.round((s.val / totalStream) * 100)
                        : 0;
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between font-bold">
                          <span>{s.label}</span>
                          <span>
                            {formatVnd(s.val)} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${s.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4 text-xs space-y-2">
                <p className="font-extrabold text-[#132A2E]">
                  Phân bổ phương thức thanh toán ({data.periodLabel})
                </p>
                <div className="flex justify-between">
                  <span className="text-[#476268]">
                    Tiền mặt ({data.summary.cashCount} đơn):
                  </span>
                  <strong className="text-[#0F766E]">{formatVnd(data.summary.totalCash)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#476268]">
                    Chuyển khoản VietQR ({data.summary.vietQrCount} đơn):
                  </span>
                  <strong className="text-[#F97316]">{formatVnd(data.summary.totalVietQr)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng thống kê ca khám & doanh thu theo từng Bác sĩ */}
          <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Award className="h-5 w-5" />
              <h3 className="text-base font-extrabold text-[#132A2E]">
                Hiệu suất Khám bệnh &amp; Doanh thu theo từng Bác sĩ ({data.periodLabel})
              </h3>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Bác sĩ</th>
                    <th className="py-2.5">Chức danh</th>
                    <th className="py-2.5 text-center">Trạng thái</th>
                    <th className="py-2.5 text-center">Số ca khám S.O.A.P</th>
                    <th className="py-2.5 text-center">Hóa đơn đã thu</th>
                    <th className="py-2.5 text-right">Tổng doanh thu thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#132A2E]">
                  Bảng Đối soát Chốt ca Cuối ngày ({data.shiftReconciliation.date})
                </h3>
                <p className="text-xs text-[#476268]">
                  Tách bạch Tiền mặt và Chuyển khoản VietQR để Lễ tân bàn giao tiền cuối ca &amp; Quản lý kiểm soát.
                </p>
              </div>
              <div className="rounded-2xl bg-[#0F766E]/10 px-4 py-2 text-right">
                <p className="text-[11px] font-bold text-[#0F766E]">TỔNG THU TRONG NGÀY</p>
                <p className="font-heading text-xl font-extrabold text-[#0F766E]">
                  {formatVnd(data.shiftReconciliation.grandTotal)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-800">
                      Tổng thu Tiền mặt (Tại két)
                    </p>
                    <p className="text-xs text-emerald-700">
                      {data.shiftReconciliation.cashCount} hóa đơn tiền mặt
                    </p>
                  </div>
                </div>
                <p className="font-heading text-2xl font-extrabold text-emerald-900">
                  {formatVnd(data.shiftReconciliation.cashTotal)}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#F97316]/30 bg-[#F97316]/8 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-[#EA580C]">
                      Tổng thu Chuyển khoản VietQR
                    </p>
                    <p className="text-xs text-[#EA580C]/90">
                      {data.shiftReconciliation.vietQrCount} hóa đơn chuyển khoản
                    </p>
                  </div>
                </div>
                <p className="font-heading text-2xl font-extrabold text-[#EA580C]">
                  {formatVnd(data.shiftReconciliation.vietQrTotal)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Mã HĐ</th>
                    <th className="py-2.5">Thời gian thu</th>
                    <th className="py-2.5">Khách hàng</th>
                    <th className="py-2.5">Thu ngân / Bác sĩ</th>
                    <th className="py-2.5">Phương thức</th>
                    <th className="py-2.5 text-right">Thực thu</th>
                    <th className="py-2.5 text-right">In A4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {data.shiftReconciliation.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 font-mono font-extrabold text-[#0F766E]">
                        {inv.invoiceCode}
                      </td>
                      <td className="py-3 text-[#476268]">{formatDateTimeVn(inv.paidAt)}</td>
                      <td className="py-3">
                        <p className="font-bold text-[#132A2E]">{inv.customerName}</p>
                        <p className="text-[11px] text-[#476268]">{inv.petSummary || "Bán lẻ"}</p>
                      </td>
                      <td className="py-3 text-[#476268]">
                        TN: <strong>{inv.cashierName}</strong>
                        {inv.doctorName && <div>BS: {inv.doctorName}</div>}
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
                      <td className="py-3 text-right font-extrabold text-[#132A2E]">
                        {formatVnd(inv.totalAmount)}
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
                              Phiếu khám
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.shiftReconciliation.invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#476268]">
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
