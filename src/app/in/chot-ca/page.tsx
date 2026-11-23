import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTimeVn, formatDateVn, formatVnd } from "@/lib/format";
import { PrintTriggerBar } from "@/components/print/PrintTriggerBar";

export const dynamic = "force-dynamic";

function getTodayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function PrintShiftReconciliationA4Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    redirect("/dang-nhap");
  }

  const sp = await searchParams;
  const dateStr = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : getTodayYmd();
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);

  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: { in: ["PAID", "PARTIALLY_RETURNED", "CANCELLED"] },
        OR: [
          { paidAt: { gte: start, lte: end } },
          { paidAt: null, cancelledAt: { gte: start, lte: end } },
        ],
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        cashier: { select: { fullName: true } },
        doctor: { select: { fullName: true } },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  const clinic = {
    name: settings?.clinicName || "Phòng khám Thú y ANIMORA",
    address:
      settings?.address ||
      "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    phone: settings?.phone || "028 3890 2468",
    email: settings?.email || "cskh@animora.vn",
  };

  let cashTotal = 0;
  let vietQrTotal = 0;
  let cashCount = 0;
  let vietQrCount = 0;
  let cancelledCount = 0;
  let cancelledTotal = 0;
  let refundedTotal = 0;

  for (const inv of invoices) {
    if (inv.status === "CANCELLED") {
      cancelledCount += 1;
      cancelledTotal += inv.totalAmount;
      continue;
    }
    const net = Math.max(0, inv.totalAmount - inv.refundedAmount);
    refundedTotal += inv.refundedAmount;
    if (inv.paymentMethod === "VIETQR") {
      vietQrTotal += net;
      vietQrCount += 1;
    } else {
      cashTotal += net;
      cashCount += 1;
    }
  }

  const grandTotal = cashTotal + vietQrTotal;

  return (
    <div className="min-h-screen bg-[#E9ECEF] pb-16 text-[#132A2E] print:bg-white print:pb-0">
      <PrintTriggerBar
        title={`Xem trước bản in A4 — Bảng Chốt ca Cuối ngày (${dateStr})`}
        backHref={session.role === "MANAGER" ? "/quan-ly" : "/le-tan"}
      />

      <div className="print-a4-sheet mx-auto mt-8 w-[210mm] min-h-[297mm] rounded-xl border border-slate-200 bg-white p-[14mm] shadow-2xl print:mt-0 print:min-h-0 print:rounded-none">
        {/* Header ANIMORA */}
        <div className="flex items-start justify-between border-b-2 border-[#0F766E] pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#0F766E] text-white">
              <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                <path
                  d="M12 34V22C12 15.3726 17.3726 10 24 10C30.6274 10 36 15.3726 36 22V34"
                  stroke="white"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="24" r="4.5" fill="#F97316" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-heading text-xl font-extrabold tracking-widest text-[#0F766E]">
                <span>AN</span>
                <span className="relative">
                  I
                  <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#F97316]" />
                </span>
                <span>MORA</span>
              </div>
              <p className="text-xs font-bold text-[#132A2E]">{clinic.name}</p>
              <p className="text-[11px] text-[#476268]">{clinic.address}</p>
              <p className="text-[11px] text-[#476268]">
                Hotline: <strong>{clinic.phone}</strong> • Email: {clinic.email}
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="inline-block rounded-lg bg-[#0F766E]/10 px-3 py-1 text-[11px] font-extrabold uppercase text-[#0F766E]">
              Đối soát Chốt ca Cuối ngày
            </span>
            <p className="mt-1.5 font-bold text-[#132A2E]">
              Ngày đối soát: {formatDateVn(start)}
            </p>
            <p className="text-[11px] text-[#476268]">Người in: {session.fullName}</p>
            <p className="text-[11px] text-[#476268]">In lúc: {formatDateTimeVn(new Date())}</p>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="my-5 text-center">
          <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-[#132A2E]">
            BẢNG ĐỐI SOÁT CHỐT CA CUỐI NGÀY
          </h1>
          <p className="mt-0.5 text-xs text-[#476268]">
            Ngày {formatDateVn(start)} — Tách bạch Tổng thu Tiền mặt &amp; Chuyển khoản VietQR
          </p>
        </div>

        {/* 3 Khối Tổng hợp lớn */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="font-extrabold uppercase text-emerald-800">1. Tổng thu Tiền mặt</p>
            <p className="mt-1.5 font-heading text-xl font-extrabold text-emerald-900">
              {formatVnd(cashTotal)}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-700">{cashCount} hóa đơn tiền mặt</p>
          </div>

          <div className="rounded-2xl border-2 border-[#F97316]/40 bg-[#F97316]/8 p-4">
            <p className="font-extrabold uppercase text-[#EA580C]">2. Chuyển khoản VietQR</p>
            <p className="mt-1.5 font-heading text-xl font-extrabold text-[#EA580C]">
              {formatVnd(vietQrTotal)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#EA580C]">{vietQrCount} hóa đơn chuyển khoản</p>
          </div>

          <div className="rounded-2xl border-2 border-[#0F766E] bg-[#0F766E]/8 p-4">
            <p className="font-extrabold uppercase text-[#0F766E]">Tổng thực thu trong ngày</p>
            <p className="mt-1.5 font-heading text-xl font-extrabold text-[#0F766E]">
              {formatVnd(grandTotal)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#476268]">
              {cashCount + vietQrCount} hóa đơn hợp lệ
            </p>
          </div>
        </div>

        {(cancelledCount > 0 || refundedTotal > 0) && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
            <strong>Hóa đơn Hủy / Hoàn trả trong ngày:</strong> {cancelledCount} hóa đơn đã hủy (
            {formatVnd(cancelledTotal)}) • Tổng hoàn trả Shop: {formatVnd(refundedTotal)} (đã tự động trừ khỏi tổng thực thu).
          </div>
        )}

        {/* Bảng kê chi tiết toàn bộ hóa đơn trong ngày */}
        <table className="mt-5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y-2 border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]">
              <th className="px-2 py-2 text-center font-extrabold">STT</th>
              <th className="px-2 py-2 text-left font-extrabold">Mã HĐ</th>
              <th className="px-2 py-2 text-left font-extrabold">Giờ thu</th>
              <th className="px-2 py-2 text-left font-extrabold">Khách hàng</th>
              <th className="px-2 py-2 text-center font-extrabold">PTTT</th>
              <th className="px-2 py-2 text-center font-extrabold">Trạng thái</th>
              <th className="px-2 py-2 text-left font-extrabold">Người thu</th>
              <th className="px-2 py-2 text-right font-extrabold">Thực thu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices.map((inv, idx) => {
              const net =
                inv.status === "CANCELLED"
                  ? 0
                  : Math.max(0, inv.totalAmount - inv.refundedAmount);
              return (
                <tr key={inv.id} className={inv.status === "CANCELLED" ? "bg-rose-50/40" : ""}>
                  <td className="px-2 py-2 text-center font-semibold">{idx + 1}</td>
                  <td className="px-2 py-2 font-mono font-extrabold text-[#0F766E]">
                    {inv.invoiceCode}
                  </td>
                  <td className="px-2 py-2 text-[#476268]">
                    {formatDateTimeVn(inv.paidAt || inv.cancelledAt || inv.createdAt)}
                  </td>
                  <td className="px-2 py-2">
                    <span className="font-bold text-[#132A2E]">
                      {inv.customer?.fullName || inv.guestName || "Khách lẻ"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center font-bold">
                    {inv.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {inv.status === "PAID"
                      ? "Đã thu"
                      : inv.status === "PARTIALLY_RETURNED"
                      ? `Hoàn -${formatVnd(inv.refundedAmount)}`
                      : "Đã hủy"}
                  </td>
                  <td className="px-2 py-2">{inv.cashier?.fullName || "—"}</td>
                  <td className="px-2 py-2 text-right font-extrabold">{formatVnd(net)}</td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center italic text-[#476268]">
                  Không có hóa đơn phát sinh trong ngày {formatDateVn(start)}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Chữ ký bàn giao ca */}
        <div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs">
          <div>
            <p className="font-extrabold uppercase">Lễ tân / Thu ngân bàn giao ca</p>
            <p className="italic text-[#476268]">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold">{session.fullName}</p>
          </div>
          <div>
            <p className="font-extrabold uppercase">Quản lý Phòng khám đối soát</p>
            <p className="italic text-[#476268]">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold">Đại diện Quản lý ANIMORA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
