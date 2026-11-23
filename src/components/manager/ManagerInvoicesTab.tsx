"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Printer,
  FileText,
  RotateCcw,
  X,
  AlertTriangle,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { formatDateTimeVn, formatVnd } from "@/lib/format";

export interface ManagerInvoiceItem {
  id: string;
  name: string;
  quantity: number;
  returnedQuantity?: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  category: string;
  productId?: string | null;
}

export interface ManagerInvoice {
  id: string;
  invoiceCode: string;
  type: string;
  status: string;
  subtotal: number;
  eventDiscountAmount: number;
  couponDiscountAmount: number;
  totalAmount: number;
  refundedAmount?: number;
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
  items: ManagerInvoiceItem[];
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
  initialSubTab = "LIST",
  onReload,
  notify,
}: {
  invoices: ManagerInvoice[];
  auditLogs: FlatAuditLog[];
  initialSubTab?: "LIST" | "AUDIT";
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<"LIST" | "AUDIT">(initialSubTab);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Modal Hủy hóa đơn / Trả hàng Shop (ĐỘC QUYỀN QUẢN LÝ)
  const [cancelTarget, setCancelTarget] = useState<ManagerInvoice | null>(null);
  const [cancelMode, setCancelMode] = useState<"FULL_CANCEL" | "PARTIAL_SHOP_RETURN">("FULL_CANCEL");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const openCancelModal = (inv: ManagerInvoice) => {
    setCancelTarget(inv);
    setCancelMode("FULL_CANCEL");
    setCancelReason("");
    const initMap: Record<string, number> = {};
    for (const item of inv.items) {
      if (item.itemType === "SHOP_PRODUCT" || item.category === "SHOP") {
        initMap[item.id] = 0;
      }
    }
    setReturnQuantities(initMap);
  };

  const returnableShopItems = cancelTarget
    ? cancelTarget.items.filter((it) => {
        const isShop = it.itemType === "SHOP_PRODUCT" || it.category === "SHOP";
        const rem = it.quantity - (it.returnedQuantity || 0);
        return isShop && rem > 0;
      })
    : [];

  const estimatedPartialRefund = (() => {
    if (!cancelTarget) return 0;
    const grossTotal = cancelTarget.items.reduce((s, i) => s + i.totalPrice, 0);
    const ratio = grossTotal > 0 ? cancelTarget.totalAmount / grossTotal : 1;
    let est = 0;
    for (const it of returnableShopItems) {
      const q = returnQuantities[it.id] || 0;
      if (q > 0) est += Math.round(q * it.unitPrice * ratio);
    }
    const maxRem = Math.max(0, cancelTarget.totalAmount - (cancelTarget.refundedAmount || 0));
    return Math.min(maxRem, est);
  })();

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;

    const payload: Record<string, unknown> = {
      mode: cancelMode,
      reason: cancelReason.trim(),
    };

    if (cancelMode === "PARTIAL_SHOP_RETURN") {
      const chosen = Object.entries(returnQuantities)
        .filter(([, q]) => q > 0)
        .map(([invoiceItemId, quantity]) => ({ invoiceItemId, quantity }));
      if (chosen.length === 0) {
        notify("Vui lòng chọn ít nhất 1 sản phẩm Shop cần trả lại", "err");
        return;
      }
      payload.returnItems = chosen;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/manager/invoices/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Không thể xử lý hủy / hoàn trả", "err");
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
    if (methodFilter !== "ALL" && inv.paymentMethod !== methodFilter) return false;
    if (dateFilter) {
      const refIso = inv.paidAt || inv.createdAt;
      if (refIso) {
        const d = new Date(refIso);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        if (ymd !== dateFilter) return false;
      }
    }
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
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "PAID", label: "Đã thanh toán" },
              { key: "PARTIALLY_RETURNED", label: "Đã hoàn trả Shop" },
              { key: "CANCELLED", label: "Đã hủy" },
              { key: "PENDING", label: "Chờ thu" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  statusFilter === st.key
                    ? "bg-[#132A2E] text-white"
                    : "bg-white border border-slate-200 text-[#476268]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Hủy hóa đơn / Trả hàng Shop hoàn kho FEFO */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmCancel}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-rose-400 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-extrabold">
                  Hủy hóa đơn / Trả hàng Shop — {cancelTarget.invoiceCode}
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

            {/* Chọn chế độ xử lý */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCancelMode("FULL_CANCEL")}
                className={`rounded-2xl border-2 p-3.5 text-left transition ${
                  cancelMode === "FULL_CANCEL"
                    ? "border-rose-600 bg-rose-50"
                    : "border-slate-200 bg-[#FAF9F6]"
                }`}
              >
                <p className="font-extrabold text-rose-700">1. Hủy toàn bộ hóa đơn</p>
                <p className="mt-1 text-[11px] text-[#476268]">
                  Hoàn trả toàn bộ tồn kho FEFO về đúng lô cũ và trừ 100% doanh thu.
                </p>
              </button>

              <button
                type="button"
                disabled={
                  returnableShopItems.length === 0 ||
                  !["PAID", "PARTIALLY_RETURNED"].includes(cancelTarget.status)
                }
                onClick={() => setCancelMode("PARTIAL_SHOP_RETURN")}
                className={`rounded-2xl border-2 p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  cancelMode === "PARTIAL_SHOP_RETURN"
                    ? "border-[#F97316] bg-[#F97316]/8"
                    : "border-slate-200 bg-[#FAF9F6]"
                }`}
              >
                <p className="flex items-center gap-1 font-extrabold text-[#EA580C]">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  2. Trả sản phẩm Shop lẻ
                </p>
                <p className="mt-1 text-[11px] text-[#476268]">
                  {returnableShopItems.length > 0
                    ? `Có ${returnableShopItems.length} sản phẩm Shop có thể hoàn trả kho.`
                    : "Hóa đơn không có sản phẩm Shop khả dụng để trả lẻ."}
                </p>
              </button>
            </div>

            {cancelMode === "FULL_CANCEL" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 space-y-1">
                <p className="font-bold">
                  Chế độ Hủy toàn bộ hóa đơn (Transaction nguyên tử):
                </p>
                <p>
                  1. Đọc lại đúng các dòng xuất kho FEFO của hóa đơn và{" "}
                  <strong>cộng hoàn trả chính xác về đúng các lô InventoryBatch ban đầu</strong>.
                </p>
                <p>
                  2. Doanh thu thực nhận trên Dashboard &amp; Bảng chốt ca tự động giảm{" "}
                  <strong>
                    {formatVnd(
                      Math.max(0, cancelTarget.totalAmount - (cancelTarget.refundedAmount || 0))
                    )}
                  </strong>
                  .
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 space-y-3">
                <p className="font-extrabold text-amber-900">
                  Chọn số lượng Sản phẩm Shop khách trả lại:
                </p>
                <div className="space-y-2">
                  {returnableShopItems.map((it) => {
                    const maxQty = it.quantity - (it.returnedQuantity || 0);
                    const curQty = returnQuantities[it.id] || 0;
                    return (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 border border-amber-200"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-[#132A2E]">{it.name}</p>
                          <p className="text-[11px] text-[#476268]">
                            Đơn giá: {formatVnd(it.unitPrice)} • Còn có thể trả: {maxQty} {it.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold">SL trả:</span>
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={curQty}
                            onChange={(e) =>
                              setReturnQuantities((prev) => ({
                                ...prev,
                                [it.id]: Math.min(
                                  maxQty,
                                  Math.max(0, Number(e.target.value) || 0)
                                ),
                              }))
                            }
                            className="w-16 rounded-lg border border-amber-300 bg-[#FAF9F6] px-2 py-1 text-center font-extrabold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-right font-extrabold text-[#EA580C]">
                  Số tiền dự kiến hoàn &amp; trừ khỏi Doanh thu: {formatVnd(estimatedPartialRefund)}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block font-bold">
                Lý do hủy hóa đơn / khách trả hàng Shop (Bắt buộc) *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Khách đổi loại thức ăn / Thu ngân xuất nhầm hóa đơn / Bao bì chưa khui khách trả lại..."
                className="w-full rounded-xl border border-rose-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 font-extrabold text-white disabled:opacity-60 ${
                  cancelMode === "FULL_CANCEL"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#F97316] hover:bg-[#EA580C]"
                }`}
              >
                <RotateCcw className="h-4 w-4" />
                {cancelling
                  ? "Đang hoàn kho FEFO..."
                  : cancelMode === "FULL_CANCEL"
                  ? "Xác nhận Hủy toàn bộ & Hoàn kho"
                  : "Xác nhận Trả hàng Shop & Hoàn kho"}
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === "LIST" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
          {/* Thanh tìm kiếm + lọc PTTT + lọc ngày */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm hóa đơn theo mã HĐ, tên khách hoặc số điện thoại..."
              className="flex-1 min-w-64 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2 text-xs"
            />

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
            >
              <option value="ALL">Mọi phương thức TT</option>
              <option value="CASH">Tiền mặt</option>
              <option value="VIETQR">Chuyển khoản VietQR</option>
            </select>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-[#0F766E]" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent font-bold focus:outline-none"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="text-rose-600 hover:text-rose-800"
                  title="Xóa lọc ngày"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredInvoices.map((inv) => {
              const netAmount =
                inv.status === "CANCELLED"
                  ? 0
                  : Math.max(0, inv.totalAmount - (inv.refundedAmount || 0));
              return (
                <div
                  key={inv.id}
                  className={`rounded-2xl border p-4 text-xs ${
                    inv.status === "CANCELLED"
                      ? "border-rose-200 bg-rose-50/40"
                      : inv.status === "PARTIALLY_RETURNED"
                      ? "border-amber-300 bg-amber-50/35"
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
                            : inv.status === "PARTIALLY_RETURNED"
                            ? "bg-amber-600 text-white"
                            : inv.status === "CANCELLED"
                            ? "bg-rose-600 text-white"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.status === "PAID"
                          ? "ĐÃ THANH TOÁN"
                          : inv.status === "PARTIALLY_RETURNED"
                          ? "ĐÃ HOÀN TRẢ SHOP"
                          : inv.status === "CANCELLED"
                          ? "ĐÃ HỦY & HOÀN KHO"
                          : "CHỜ THU"}
                      </span>
                      <span className="ml-2 font-bold text-[#132A2E]">
                        {inv.customer ? inv.customer.fullName : inv.guestName}
                      </span>{" "}
                      •{" "}
                      {inv.paymentMethod === "VIETQR"
                        ? "VietQR"
                        : inv.paymentMethod === "CASH"
                        ? "Tiền mặt"
                        : "Chưa thu"}{" "}
                      • {formatDateTimeVn(inv.paidAt || inv.createdAt)}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#132A2E]">
                          {formatVnd(netAmount)}
                        </span>
                        {(inv.refundedAmount || 0) > 0 && inv.status !== "CANCELLED" && (
                          <p className="text-[10px] font-bold text-amber-700">
                            Gốc: {formatVnd(inv.totalAmount)} • Hoàn:{" "}
                            -{formatVnd(inv.refundedAmount || 0)}
                          </p>
                        )}
                      </div>

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
                          onClick={() => openCancelModal(inv)}
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
                        className={`rounded-lg border px-2 py-0.5 ${
                          (it.returnedQuantity || 0) > 0
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {it.name} ×{it.quantity} ({formatVnd(it.totalPrice)})
                        {(it.returnedQuantity || 0) > 0 && ` [Đã trả: ${it.returnedQuantity}]`}
                      </span>
                    ))}
                  </div>

                  {inv.cancelReason && (
                    <p className="mt-2 font-semibold text-rose-700">
                      Ghi chú hủy / hoàn trả
                      {inv.cancelledAt ? ` (${formatDateTimeVn(inv.cancelledAt)})` : ""}:{" "}
                      {inv.cancelReason}
                    </p>
                  )}

                  {inv.auditLogs.length > 0 && (
                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
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
              );
            })}
            {filteredInvoices.length === 0 && (
              <p className="py-8 text-center text-sm text-[#476268]">
                Không tìm thấy hóa đơn phù hợp với bộ lọc.
              </p>
            )}
          </div>
        </div>
      )}

      {subTab === "AUDIT" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            Nhật ký Chi tiết Lễ tân Chỉnh sửa Thuốc &amp; Hóa đơn tại quầy (InvoiceAuditLog)
          </h3>
          <p className="text-xs text-[#476268]">
            Ghi nhận tự động mọi lần Lễ tân tăng/giảm số lượng, bỏ bớt thuốc bác sĩ kê, gộp sản phẩm Shop hoặc Quản lý hủy/trả hàng.
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
                  <th className="py-2.5">Chi tiết thay đổi (Cũ → Mới)</th>
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
