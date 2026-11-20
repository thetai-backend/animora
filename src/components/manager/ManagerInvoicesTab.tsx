"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  Printer,
  FileText,
  RotateCcw,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatDateTimeVn, formatVnd } from "@/lib/format";

export interface ManagerInvoice {
  id: string;
  invoiceCode: string;
  type: string;
  status: string;
  subtotal: number;
  eventDiscountAmount: number;
  couponDiscountAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  guestName: string | null;
  guestPhone: string | null;
  petSummary: string | null;
  customer: { fullName: string; phone: string | null } | null;
  doctor: { fullName: string } | null;
  cashier: { fullName: string } | null;
  medicalRecord: { id: string; recordCode: string; status: string } | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    totalPrice: number;
    itemType: string;
  }[];
  auditLogs: {
    id: string;
    actorName: string;
    action: string;
    itemName: string;
    detail: string;
    createdAt: string;
  }[];
}

export interface FlatAuditLog {
  id: string;
  actorName: string;
  action: string;
  itemName: string;
  detail: string;
  createdAt: string;
  invoice: {
    id: string;
    invoiceCode: string;
    status: string;
    guestName: string | null;
    customer: { fullName: string } | null;
  };
}

export function ManagerInvoicesTab({
  invoices,
  auditLogs,
  onReload,
  notify,
}: {
  invoices: ManagerInvoice[];
  auditLogs: FlatAuditLog[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<"LIST" | "AUDIT">("LIST");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modal Hủy hóa đơn / Trả hàng Shop (ĐỘC QUYỀN QUẢN LÝ)
  const [cancelTarget, setCancelTarget] = useState<ManagerInvoice | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/manager/invoices/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Không thể hủy hóa đơn", "err");
      } else {
        notify(data.message);
        setCancelTarget(null);
        setCancelReason("");
        await onReload();
      }
    } finally {
      setCancelling(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${inv.invoiceCode} ${inv.customer?.fullName || inv.guestName || ""} ${
        inv.customer?.phone || inv.guestPhone || ""
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setSubTab("LIST")}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold ${
              subTab === "LIST" ? "bg-[#0F766E] text-white" : "text-[#476268]"
            }`}
          >
            Toàn bộ Hóa đơn ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("AUDIT")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
              subTab === "AUDIT" ? "bg-[#F97316] text-white" : "text-[#476268]"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Lịch sử Lễ tân sửa thuốc tại quầy — Audit Log ({auditLogs.length})
          </button>
        </div>

        {subTab === "LIST" && (
          <div className="flex items-center gap-2">
            {["ALL", "PAID", "PENDING", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  statusFilter === st
                    ? "bg-[#132A2E] text-white"
                    : "bg-white border border-slate-200 text-[#476268]"
                }`}
              >
                {st === "ALL"
                  ? "Tất cả"
                  : st === "PAID"
                  ? "Đã thu"
                  : st === "PENDING"
                  ? "Chờ thu"
                  : "Đã hủy"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Hủy hóa đơn hoàn kho */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmCancel}
            className="w-full max-w-lg rounded-3xl border-2 border-rose-400 bg-white p-7 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-extrabold">
                  Hủy hóa đơn / Trả hàng — {cancelTarget.invoiceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-lg p-1 text-[#476268] hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-900 space-y-1">
              <p className="font-bold">
                Thao tác Độc quyền Quản lý — Hệ thống sẽ tự động thực hiện:
              </p>
              <p>
                1. Hoàn trả chính xác số lượng thuốc &amp; sản phẩm Shop về lại{" "}
                <strong>đúng các lô hàng đã trừ FEFO trước đó</strong>.
              </p>
              <p>
                2. Tự động trừ số tiền <strong>{formatVnd(cancelTarget.totalAmount)}</strong> khỏi
                Báo cáo Doanh thu &amp; Bảng chốt ca.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">
                Lý do hủy hóa đơn / khách trả hàng Shop *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Khách đổi sang loại thức ăn khác / thu ngân xuất nhầm hóa đơn..."
                className="w-full rounded-xl border border-rose-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {cancelling ? "Đang hoàn kho..." : "Xác nhận Hủy & Hoàn tồn kho"}
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === "LIST" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm hóa đơn theo mã HĐ, tên khách hoặc số điện thoại..."
            className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2 text-xs"
          />

          <div className="space-y-3">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className={`rounded-2xl border p-4 text-xs ${
                  inv.status === "CANCELLED"
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-[#132A2E]/10 bg-[#FAF9F6]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                      {inv.invoiceCode}
                    </span>{" "}
                    <span
                      className={`ml-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                        inv.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : inv.status === "CANCELLED"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status === "PAID"
                        ? "ĐÃ THANH TOÁN"
                        : inv.status === "CANCELLED"
                        ? "ĐÃ HỦY & HOÀN KHO"
                        : "CHỜ THU"}
                    </span>
                    <span className="ml-2 font-bold text-[#132A2E]">
                      {inv.customer ? inv.customer.fullName : inv.guestName}
                    </span>{" "}
                    • {inv.paymentMethod === "VIETQR" ? "VietQR" : inv.paymentMethod === "CASH" ? "Tiền mặt" : "Chưa thu"} •{" "}
                    {formatDateTimeVn(inv.paidAt || inv.createdAt)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#132A2E]">
                      {formatVnd(inv.totalAmount)}
                    </span>

                    <Link
                      href={`/in/hoa-don/${inv.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#0F766E]/25 bg-white px-2.5 py-1.5 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      In HĐ A4
                    </Link>

                    {inv.medicalRecord && (
                      <Link
                        href={`/in/phieu-kham/${inv.medicalRecord.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-[#132A2E] hover:bg-slate-50"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        In Phiếu khám
                      </Link>
                    )}

                    {inv.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(inv);
                          setCancelReason("");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Hủy / Trả hàng
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#476268]">
                  {inv.items.map((it) => (
                    <span
                      key={it.id}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-0.5"
                    >
                      {it.name} ×{it.quantity} ({formatVnd(it.totalPrice)})
                    </span>
                  ))}
                </div>

                {inv.status === "CANCELLED" && inv.cancelReason && (
                  <p className="mt-2 font-semibold text-rose-700">
                    Lý do hủy ({formatDateTimeVn(inv.cancelledAt)}): {inv.cancelReason}
                  </p>
                )}

                {inv.auditLogs.length > 0 && (
                  <div className="mt-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <p className="flex items-center gap-1 font-bold text-amber-900">
                      <History className="h-3.5 w-3.5" />
                      Audit Log ({inv.auditLogs.length} thao tác chỉnh sửa / hủy):
                    </p>
                    {inv.auditLogs.map((log) => (
                      <p key={log.id} className="mt-1 text-amber-950">
                        • <strong>{log.actorName}</strong> ({formatDateTimeVn(log.createdAt)}):{" "}
                        <strong>{log.action}</strong> [{log.itemName}] — {log.detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredInvoices.length === 0 && (
              <p className="py-8 text-center text-sm text-[#476268]">
                Không tìm thấy hóa đơn phù hợp.
              </p>
            )}
          </div>
        </div>
      )}

      {subTab === "AUDIT" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            Nhật ký Chi tiết Lễ tân Chỉnh sửa Thuốc &amp; Hóa đơn tại quầy (Audit Log)
          </h3>
          <p className="text-xs text-[#476268]">
            Ghi nhận tự động mọi lần Lễ tân tăng/giảm số lượng, bỏ bớt thuốc bác sĩ kê hoặc gộp thêm sản phẩm Shop.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Thời gian</th>
                  <th className="py-2.5">Mã HĐ</th>
                  <th className="py-2.5">Nhân sự thao tác</th>
                  <th className="py-2.5">Hành động</th>
                  <th className="py-2.5">Thuốc / Sản phẩm</th>
                  <th className="py-2.5">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 text-[#476268]">{formatDateTimeVn(log.createdAt)}</td>
                    <td className="py-3 font-mono font-extrabold text-[#0F766E]">
                      {log.invoice.invoiceCode}
                    </td>
                    <td className="py-3 font-bold text-[#132A2E]">{log.actorName}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-bold">{log.itemName}</td>
                    <td className="py-3 text-[#476268]">{log.detail}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#476268]">
                      Chưa có lịch sử chỉnh sửa hóa đơn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
