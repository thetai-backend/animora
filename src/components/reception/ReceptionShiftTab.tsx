"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, QrCode, Printer, FileText, RefreshCw } from "lucide-react";
import { formatDateTimeVn, formatVnd } from "@/lib/format";

interface ShiftData {
  date: string;
  cashTotal: number;
  vietQrTotal: number;
  grandTotal: number;
  cashCount: number;
  vietQrCount: number;
  invoices: {
    id: string;
    invoiceCode: string;
    paidAt: string | null;
    customerName: string;
    petSummary: string | null;
    doctorName: string | null;
    cashierName: string;
    paymentMethod: string | null;
    totalAmount: number;
    medicalRecordId: string | null;
  }[];
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ReceptionShiftTab() {
  const [date, setDate] = useState(getTodayStr());
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadShift = async (targetDate = date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/revenue?period=DAY&date=${encodeURIComponent(targetDate)}`
      );
      if (res.ok) {
        const data = await res.json();
        setShift(data.shiftReconciliation || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#132A2E]">
            Bảng Đối soát Chốt ca Cuối ngày — Lễ tân
          </h2>
          <p className="text-xs text-[#476268]">
            Tách rạch ròi Tổng Tiền mặt tại két và Tổng Chuyển khoản VietQR để bàn giao ca không sai sót.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm font-bold"
          />
          <button
            type="button"
            onClick={() => loadShift(date)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-white px-4 py-2 text-xs font-bold text-[#0F766E]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Cập nhật
          </button>
        </div>
      </div>

      {shift && (
        <>
          <div className="grid grid-cols-3 gap-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-800">
                <Banknote className="h-5 w-5" />
                <span className="text-xs font-extrabold uppercase">Tổng Tiền mặt</span>
              </div>
              <p className="mt-2 font-heading text-3xl font-extrabold text-emerald-900">
                {formatVnd(shift.cashTotal)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">{shift.cashCount} hóa đơn tiền mặt</p>
            </div>

            <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/10 p-5">
              <div className="flex items-center gap-2 text-[#EA580C]">
                <QrCode className="h-5 w-5" />
                <span className="text-xs font-extrabold uppercase">Tổng Chuyển khoản VietQR</span>
              </div>
              <p className="mt-2 font-heading text-3xl font-extrabold text-[#EA580C]">
                {formatVnd(shift.vietQrTotal)}
              </p>
              <p className="mt-1 text-xs text-[#EA580C]/90">{shift.vietQrCount} hóa đơn VietQR</p>
            </div>

            <div className="rounded-2xl bg-[#0F766E] p-5 text-white">
              <span className="text-xs font-extrabold uppercase text-teal-100">
                Tổng doanh thu chốt ca ({shift.date})
              </span>
              <p className="mt-2 font-heading text-3xl font-extrabold">
                {formatVnd(shift.grandTotal)}
              </p>
              <p className="mt-1 text-xs text-teal-100">
                Tổng cộng {shift.cashCount + shift.vietQrCount} hóa đơn đã thu
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Mã HĐ</th>
                  <th className="py-2.5">Giờ thu</th>
                  <th className="py-2.5">Khách hàng</th>
                  <th className="py-2.5">Thu ngân</th>
                  <th className="py-2.5">Phương thức</th>
                  <th className="py-2.5 text-right">Thực thu</th>
                  <th className="py-2.5 text-right">In A4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {shift.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 font-mono font-extrabold text-[#0F766E]">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3 text-[#476268]">{formatDateTimeVn(inv.paidAt)}</td>
                    <td className="py-3">
                      <p className="font-bold text-[#132A2E]">{inv.customerName}</p>
                      <p className="text-[11px] text-[#476268]">{inv.petSummary || "Bán lẻ"}</p>
                    </td>
                    <td className="py-3">{inv.cashierName}</td>
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
                          HĐ A4
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
                {shift.invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#476268]">
                      Chưa có hóa đơn nào trong ngày {shift.date}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
