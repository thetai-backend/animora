"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  FileText,
  History,
  Minus,
  Plus,
  Printer,
  QrCode,
  ShoppingBag,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { formatDateTimeVn, formatVnd } from "@/lib/format";
import { buildVietQrUrl, calculateInvoiceTotals } from "@/lib/pricing-utils";

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  group: string;
  category?: string;
  price: number;
  retailUnit: string;
  stockQuantity: number;
}

export interface PosPromotion {
  id: string;
  code: string | null;
  title: string;
  discountType: string;
  discountValue: number;
  applicableScope: string;
}

export interface PosInvoice {
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
  guestName: string | null;
  guestPhone: string | null;
  petSummary: string | null;
  customer: { fullName: string; phone: string | null } | null;
  doctor: { fullName: string } | null;
  cashier?: { fullName: string } | null;
  medicalRecord: { id: string; recordCode: string; status: string } | null;
  items: {
    id: string;
    itemType: string;
    productId: string | null;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addedByRole: string;
    product?: { id: string; stockQuantity: number; retailUnit: string } | null;
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

function makeRetailCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BL-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function ReceptionPosTab({
  pendingInvoices,
  paidInvoices,
  promotions,
  products,
  bankInfo,
  onReloadPos,
  notify,
}: {
  pendingInvoices: PosInvoice[];
  paidInvoices: PosInvoice[];
  promotions: PosPromotion[];
  products: PosProduct[];
  bankInfo: { bankCode: string; bankAccountNumber: string; bankAccountName: string };
  onReloadPos: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  // 2 chế độ rõ ràng theo checklist E.1
  const [posMode, setPosMode] = useState<"DOCTOR_QUEUE" | "RETAIL_SHOP">("DOCTOR_QUEUE");

  // --- MODE 1: PHIẾU CHỜ THANH TOÁN TỪ BÁC SĨ ---
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    pendingInvoices[0]?.id || null
  );
  const [shopProductToAdd, setShopProductToAdd] = useState<string>("");
  const [selectedEventPromoId, setSelectedEventPromoId] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "VIETQR">("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [paying, setPaying] = useState(false);

  // Banner in A4 ngay sau khi thanh toán thành công
  const [lastPaid, setLastPaid] = useState<{
    invoiceId: string;
    invoiceCode: string;
    totalAmount: number;
    medicalRecordId: string | null;
    negativeWarnings: string[];
  } | null>(null);

  // --- MODE 2: BÁN LẺ SHOP NHANH ---
  const [retailSearch, setRetailSearch] = useState("");
  const [retailGuestName, setRetailGuestName] = useState("Khách mua lẻ tại quầy");
  const [retailGuestPhone, setRetailGuestPhone] = useState("");
  const [retailCart, setRetailCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [retailEventPromoId, setRetailEventPromoId] = useState("");
  const [retailCouponCode, setRetailCouponCode] = useState("");
  const [retailPaymentMethod, setRetailPaymentMethod] = useState<"CASH" | "VIETQR">("CASH");
  const [retailCashReceived, setRetailCashReceived] = useState("");
  const [retailDraftCode, setRetailDraftCode] = useState<string>(() => makeRetailCode());
  const [retailPaying, setRetailPaying] = useState(false);

  const shopProducts = useMemo(
    () => products.filter((p) => p.group === "SHOP" || p.group === "SHARED"),
    [products]
  );
  const activeShopAddId = shopProductToAdd || shopProducts[0]?.id || "";

  const effectiveSelectedId =
    pendingInvoices.find((i) => i.id === selectedInvoiceId)?.id ||
    pendingInvoices[0]?.id ||
    null;

  const activeInvoice = useMemo(
    () => pendingInvoices.find((inv) => inv.id === effectiveSelectedId) || null,
    [pendingInvoices, effectiveSelectedId]
  );

  const couponPromos = useMemo(
    () => promotions.filter((p) => Boolean(p.code)),
    [promotions]
  );

  // Mode 1 totals
  const selectedEventPromo = useMemo(
    () => promotions.find((p) => p.id === selectedEventPromoId) || null,
    [promotions, selectedEventPromoId]
  );
  const matchedCouponPromo = useMemo(() => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return null;
    return promotions.find((p) => p.code?.toUpperCase() === clean) || null;
  }, [promotions, couponCode]);

  const posTotals = useMemo(() => {
    if (!activeInvoice) {
      return { subtotal: 0, eventDiscountAmount: 0, couponDiscountAmount: 0, totalAmount: 0 };
    }
    return calculateInvoiceTotals(
      activeInvoice.items.map((i) => ({ category: i.category, totalPrice: i.totalPrice })),
      selectedEventPromo,
      matchedCouponPromo && matchedCouponPromo.id !== selectedEventPromo?.id
        ? matchedCouponPromo
        : null
    );
  }, [activeInvoice, selectedEventPromo, matchedCouponPromo]);

  const zeroStockItemsInInvoice = useMemo(() => {
    if (!activeInvoice) return [];
    return activeInvoice.items.filter(
      (i) => i.product && (i.product.stockQuantity <= 0 || i.product.stockQuantity < i.quantity)
    );
  }, [activeInvoice]);

  // Mode 2 totals
  const retailCartDetailed = useMemo(() => {
    return retailCart
      .map((row) => {
        const prod = shopProducts.find((p) => p.id === row.productId);
        if (!prod) return null;
        return {
          ...row,
          product: prod,
          totalPrice: prod.price * row.quantity,
        };
      })
      .filter(Boolean) as { productId: string; quantity: number; product: PosProduct; totalPrice: number }[];
  }, [retailCart, shopProducts]);

  const retailEventPromo = useMemo(
    () => promotions.find((p) => p.id === retailEventPromoId) || null,
    [promotions, retailEventPromoId]
  );
  const retailMatchedCoupon = useMemo(() => {
    const clean = retailCouponCode.trim().toUpperCase();
    if (!clean) return null;
    return promotions.find((p) => p.code?.toUpperCase() === clean) || null;
  }, [promotions, retailCouponCode]);

  const retailTotals = useMemo(() => {
    return calculateInvoiceTotals(
      retailCartDetailed.map((r) => ({ category: "SHOP", totalPrice: r.totalPrice })),
      retailEventPromo,
      retailMatchedCoupon && retailMatchedCoupon.id !== retailEventPromo?.id
        ? retailMatchedCoupon
        : null
    );
  }, [retailCartDetailed, retailEventPromo, retailMatchedCoupon]);

  const retailZeroStockItems = useMemo(
    () =>
      retailCartDetailed.filter(
        (r) => r.product.stockQuantity <= 0 || r.product.stockQuantity < r.quantity
      ),
    [retailCartDetailed]
  );

  const handleAddShopToInvoice = async () => {
    if (!activeInvoice || !activeShopAddId) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_SHOP_PRODUCT",
        productId: activeShopAddId,
        quantity: 1,
      }),
    });
    if (res.ok) {
      notify("Đã gộp thêm sản phẩm Shop vào hóa đơn khám & lưu vào Audit Log.");
      await onReloadPos();
    }
  };

  const handleUpdateInvoiceItemQty = async (itemId: string, quantity: number) => {
    if (!activeInvoice) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_QTY", itemId, quantity }),
    });
    if (res.ok) {
      notify("Đã cập nhật số lượng & ghi nhận vào Lịch sử chỉnh sửa (Audit Log).");
      await onReloadPos();
    }
  };

  const handleRemoveInvoiceItem = async (itemId: string) => {
    if (!activeInvoice) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REMOVE_ITEM", itemId }),
    });
    if (res.ok) {
      notify("Đã bỏ mục khỏi hóa đơn & ghi nhận vào Audit Log.");
      await onReloadPos();
    }
  };

  const handlePayInvoice = async () => {
    if (!activeInvoice) return;
    setPaying(true);
    try {
      const cashVal =
        paymentMethod === "CASH" ? Number(cashReceived || posTotals.totalAmount) : undefined;
      const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          eventPromoId: selectedEventPromoId || null,
          couponCode: couponCode.trim() || null,
          cashReceived: cashVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Thanh toán thất bại", "err");
      } else {
        notify(data.message);
        setLastPaid({
          invoiceId: data.invoice.id,
          invoiceCode: data.invoice.invoiceCode,
          totalAmount: data.invoice.totalAmount,
          medicalRecordId: data.invoice.medicalRecordId || null,
          negativeWarnings: data.negativeStockWarnings || [],
        });
        setSelectedInvoiceId(null);
        setSelectedEventPromoId("");
        setCouponCode("");
        setCashReceived("");
        await onReloadPos();
      }
    } finally {
      setPaying(false);
    }
  };

  const handlePayRetailDirectly = async () => {
    if (retailCart.length === 0) {
      notify("Vui lòng chọn ít nhất 1 sản phẩm Shop để thanh toán", "err");
      return;
    }
    setRetailPaying(true);
    try {
      const cashVal =
        retailPaymentMethod === "CASH"
          ? Number(retailCashReceived || retailTotals.totalAmount)
          : undefined;
      const res = await fetch("/api/pos/retail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payNow: true,
          invoiceCode: retailDraftCode,
          guestName: retailGuestName,
          guestPhone: retailGuestPhone,
          items: retailCart,
          eventPromoId: retailEventPromoId || null,
          couponCode: retailCouponCode.trim() || null,
          paymentMethod: retailPaymentMethod,
          cashReceived: cashVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Thanh toán bán lẻ thất bại", "err");
      } else {
        notify(data.message);
        setLastPaid({
          invoiceId: data.invoice.id,
          invoiceCode: data.invoice.invoiceCode,
          totalAmount: data.invoice.totalAmount,
          medicalRecordId: null,
          negativeWarnings: data.negativeStockWarnings || [],
        });
        setRetailCart([]);
        setRetailGuestName("Khách mua lẻ tại quầy");
        setRetailGuestPhone("");
        setRetailEventPromoId("");
        setRetailCouponCode("");
        setRetailCashReceived("");
        setRetailDraftCode(makeRetailCode());
        await onReloadPos();
      }
    } finally {
      setRetailPaying(false);
    }
  };

  const filteredRetailProducts = shopProducts.filter((p) => {
    if (!retailSearch.trim()) return true;
    return `${p.name} ${p.sku} ${p.brand || ""}`
      .toLowerCase()
      .includes(retailSearch.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Banner thanh toán thành công kèm 2 nút In A4 ngay lập tức */}
      {lastPaid && (
        <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-base font-extrabold text-emerald-900">
                  Thu ngân thành công — Hóa đơn {lastPaid.invoiceCode} ({formatVnd(lastPaid.totalAmount)})
                </p>
                <p className="text-xs text-emerald-800">
                  Đã trừ tồn kho tự động theo nguyên tắc FEFO
                  {lastPaid.medicalRecordId ? " và KHÓA CỨNG bệnh án S.O.A.P." : "."}
                </p>
                {lastPaid.negativeWarnings.length > 0 && (
                  <p className="mt-1 text-xs font-extrabold text-rose-700">
                    Cảnh báo tồn kho âm tạm thời: {lastPaid.negativeWarnings.join("; ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/in/hoa-don/${lastPaid.invoiceId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#0B5D56]"
              >
                <Printer className="h-4 w-4" />
                In Hóa đơn A4
              </Link>
              {lastPaid.medicalRecordId && (
                <Link
                  href={`/in/phieu-kham/${lastPaid.medicalRecordId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#EA580C]"
                >
                  <FileText className="h-4 w-4" />
                  In Phiếu khám &amp; Đơn thuốc A4
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLastPaid(null)}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 CHẾ ĐỘ POS RÕ RÀNG (E.1) */}
      <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setPosMode("DOCTOR_QUEUE")}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${
            posMode === "DOCTOR_QUEUE"
              ? "bg-[#0F766E] text-white"
              : "text-[#476268] hover:text-[#132A2E]"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Tab 1: Phiếu chờ thanh toán từ Bác sĩ ({pendingInvoices.length})
        </button>
        <button
          type="button"
          onClick={() => setPosMode("RETAIL_SHOP")}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${
            posMode === "RETAIL_SHOP"
              ? "bg-[#F97316] text-white"
              : "text-[#476268] hover:text-[#132A2E]"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Tab 2: Bán lẻ Shop nhanh (Không khám bệnh)
        </button>
      </div>

      {/* ========================================================
          TAB 1: PHIẾU CHỜ THANH TOÁN TỪ BÁC SĨ
         ======================================================== */}
      {posMode === "DOCTOR_QUEUE" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Cột trái 4 cột */}
          <div className="col-span-4 space-y-4">
            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#476268]">
                Phiếu chờ thanh toán ({pendingInvoices.length})
              </h3>
              <div className="mt-3 space-y-2.5">
                {pendingInvoices.length === 0 && (
                  <p className="text-xs text-[#476268]">
                    Hiện không có phiếu nào bác sĩ gửi ra chờ thu tiền.
                  </p>
                )}
                {pendingInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setCashReceived("");
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      effectiveSelectedId === inv.id
                        ? "border-[#F97316] bg-[#F97316]/8 shadow-xs"
                        : "border-[#132A2E]/10 bg-[#FAF9F6] hover:border-[#0F766E]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                        {inv.invoiceCode}
                      </span>
                      <span className="text-sm font-extrabold text-[#F97316]">
                        {formatVnd(inv.subtotal)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#132A2E]">
                      {inv.customer ? inv.customer.fullName : inv.guestName}
                    </p>
                    <p className="text-[11px] text-[#476268]">
                      {inv.petSummary || "Mua lẻ Shop"} •{" "}
                      {inv.doctor ? `BS: ${inv.doctor.fullName}` : "Bán lẻ tại quầy"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Lịch sử đã thu gần đây + Nút In A4 */}
            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#476268]">
                Đã thu gần đây ({paidInvoices.length}) — In lại A4
              </h3>
              <div className="mt-3 max-h-96 space-y-2.5 overflow-y-auto">
                {paidInvoices.slice(0, 12).map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-slate-200 bg-[#FAF9F6] p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-[#0F766E]">
                        {inv.invoiceCode}
                      </span>
                      <span className="font-extrabold text-[#132A2E]">
                        {formatVnd(inv.totalAmount)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#476268]">
                      {inv.customer?.fullName || inv.guestName} •{" "}
                      {inv.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
                    </p>
                    <div className="flex gap-1.5 pt-0.5">
                      <Link
                        href={`/in/hoa-don/${inv.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#0F766E]/25 bg-white px-2 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                      >
                        <Printer className="h-3 w-3" />
                        In Hóa đơn A4
                      </Link>
                      {inv.medicalRecord && (
                        <Link
                          href={`/in/phieu-kham/${inv.medicalRecord.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-[#132A2E] hover:bg-slate-50"
                        >
                          <FileText className="h-3 w-3" />
                          In Phiếu khám
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải 8 cột: Chi tiết thu ngân POS */}
          <div className="col-span-8">
            {!activeInvoice ? (
              <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-12 text-center text-sm text-[#476268]">
                Chọn một phiếu chờ thanh toán bên trái hoặc chuyển sang{" "}
                <strong>Tab 2: Bán lẻ Shop nhanh</strong> cho khách chỉ ghé mua hàng.
              </div>
            ) : (
              <div className="rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-md space-y-6">
                {/* Header hóa đơn */}
                <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-4">
                  <div>
                    <span className="font-mono text-2xl font-extrabold text-[#0F766E]">
                      {activeInvoice.invoiceCode}
                    </span>
                    <p className="mt-1 text-sm text-[#476268]">
                      Khách:{" "}
                      <strong className="text-[#132A2E]">
                        {activeInvoice.customer
                          ? activeInvoice.customer.fullName
                          : activeInvoice.guestName}
                      </strong>{" "}
                      • {activeInvoice.petSummary}
                    </p>
                  </div>
                  {activeInvoice.medicalRecord && (
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                      Bệnh án {activeInvoice.medicalRecord.recordCode} sẽ KHÓA CỨNG khi thu tiền
                    </span>
                  )}
                </div>

                {/* CẢNH BÁO ĐỎ TỒN KHO <= 0 (VẪN CHO PHÉP THANH TOÁN) */}
                {zeroStockItemsInInvoice.length > 0 && (
                  <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div>
                      <p className="text-sm font-extrabold">
                        CẢNH BÁO ĐỎ: MẶT HÀNG TỒN KHO &le; 0 HOẶC KHÔNG ĐỦ TRÊN HỆ THỐNG!
                      </p>
                      <p className="mt-0.5 font-normal">
                        {zeroStockItemsInInvoice
                          .map(
                            (i) =>
                              `${i.name} (tồn hiện tại: ${i.product?.stockQuantity ?? 0}, xuất: ${i.quantity})`
                          )
                          .join("; ")}
                        . Hệ thống <strong>VẪN CHO PHÉP</strong> xác nhận thu tiền (chấp nhận tồn kho âm tạm thời).
                      </p>
                    </div>
                  </div>
                )}

                {/* + Gộp thêm sản phẩm Shop */}
                <div className="flex items-center gap-2 rounded-2xl bg-[#FAF9F6] p-3.5">
                  <select
                    value={activeShopAddId}
                    onChange={(e) => setShopProductToAdd(e.target.value)}
                    className="flex-1 rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    {shopProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.group === "SHARED" ? "DÙNG CHUNG" : "SHOP"}] {p.name} —{" "}
                        {formatVnd(p.price)} (Tồn: {p.stockQuantity} {p.retailUnit})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddShopToInvoice}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0B5D56]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Gộp thêm sản phẩm Shop
                  </button>
                </div>

                {/* Bảng chi tiết món */}
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                      <th className="py-2">Hạng mục</th>
                      <th className="py-2">Đơn giá</th>
                      <th className="py-2">Số lượng</th>
                      <th className="py-2 text-right">Thành tiền</th>
                      <th className="py-2 text-right">Bỏ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A2E]/8">
                    {activeInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-[#132A2E]">{item.name}</p>
                          <p className="text-[11px] text-[#476268]">
                            {item.itemType === "SERVICE"
                              ? "Dịch vụ"
                              : item.itemType === "MEDICINE"
                              ? "Thuốc bác sĩ kê"
                              : "Sản phẩm Shop"}
                            {item.product && (
                              <span
                                className={
                                  item.product.stockQuantity <= 0
                                    ? " ml-2 font-extrabold text-rose-600"
                                    : " ml-2 text-emerald-700"
                                }
                              >
                                (Tồn kho: {item.product.stockQuantity} {item.unit})
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="py-2.5">{formatVnd(item.unitPrice)}</td>
                        <td className="py-2.5">
                          {item.itemType !== "SERVICE" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateInvoiceItemQty(item.id, item.quantity - 1)
                                }
                                className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center font-bold">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateInvoiceItemQty(item.id, item.quantity + 1)
                                }
                                className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-bold">
                          {formatVnd(item.totalPrice)}
                        </td>
                        <td className="py-2.5 text-right">
                          {item.itemType !== "SERVICE" && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceItem(item.id)}
                              title="Bỏ bớt thuốc/sản phẩm (ghi Audit Log)"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* LỊCH SỬ CHỈNH SỬA HÓA ĐƠN (AUDIT LOG) */}
                {activeInvoice.auditLogs.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                      <History className="h-4 w-4" />
                      Lịch sử chỉnh sửa hóa đơn tại quầy (InvoiceAuditLog):
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-950">
                      {activeInvoice.auditLogs.map((log) => (
                        <li key={log.id}>
                          • <strong>{log.actorName}</strong> ({formatDateTimeVn(log.createdAt)}):{" "}
                          <strong>{log.action}</strong> [{log.itemName}] — {log.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ÁP DỤNG ĐA KHUYẾN MÃI (SỰ KIỆN TRƯỚC -> MÃ GIẢM GIÁ SAU) */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF9F6] p-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                      1. Ưu đãi Sự kiện / Dịch vụ (trừ bước 1)
                    </label>
                    <select
                      value={selectedEventPromoId}
                      onChange={(e) => setSelectedEventPromoId(e.target.value)}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-xs font-semibold"
                    >
                      <option value="">Không áp dụng sự kiện</option>
                      {promotions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (
                          {p.discountType === "PERCENT"
                            ? `-${p.discountValue}%`
                            : `-${formatVnd(p.discountValue)}`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                      2. Mã giảm giá cộng dồn (trừ bước 2 trên phần còn lại)
                    </label>
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã VD: MEMBER10"
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 font-mono text-xs font-bold uppercase"
                    />
                    {couponPromos.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {couponPromos.map((cp) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => setCouponCode(cp.code || "")}
                            className="rounded-md bg-[#0F766E]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0F766E] hover:bg-[#0F766E]/20"
                          >
                            {cp.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BẢNG TỔNG KẾT TIỀN */}
                <div className="space-y-1.5 rounded-2xl border border-[#0F766E]/15 bg-white p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#476268]">Tạm tính</span>
                    <span className="font-bold">{formatVnd(posTotals.subtotal)}</span>
                  </div>
                  {posTotals.eventDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm ưu đãi sự kiện (bước 1)</span>
                      <span className="font-bold">
                        -{formatVnd(posTotals.eventDiscountAmount)}
                      </span>
                    </div>
                  )}
                  {posTotals.couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm mã ưu đãi cộng dồn (bước 2)</span>
                      <span className="font-bold">
                        -{formatVnd(posTotals.couponDiscountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#132A2E]/10 pt-2 text-lg font-extrabold text-[#0F766E]">
                    <span>Tổng khách phải thanh toán (tối thiểu 0đ)</span>
                    <span>{formatVnd(posTotals.totalAmount)}</span>
                  </div>
                </div>

                {/* CHỌN 1 TRONG 2 PHƯƠNG THỨC: TIỀN MẶT HOẶC VIETQR */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                        paymentMethod === "CASH"
                          ? "border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]"
                          : "border-slate-200 text-[#476268]"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                      Tiền mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VIETQR")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                        paymentMethod === "VIETQR"
                          ? "border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]"
                          : "border-slate-200 text-[#476268]"
                      }`}
                    >
                      <QrCode className="h-5 w-5" />
                      Chuyển khoản VietQR tĩnh
                    </button>
                  </div>

                  {paymentMethod === "CASH" ? (
                    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF9F6] p-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold">Tiền khách đưa (VNĐ)</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder={String(posTotals.totalAmount)}
                          className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2.5 text-sm font-bold"
                        />
                      </div>
                      <div className="flex flex-col justify-center rounded-xl border border-[#132A2E]/10 bg-white px-4 py-2">
                        <span className="text-xs text-[#476268]">Tiền thối lại khách</span>
                        <span className="text-xl font-extrabold text-[#F97316]">
                          {formatVnd(
                            Math.max(
                              0,
                              Number(cashReceived || posTotals.totalAmount) - posTotals.totalAmount
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6 rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildVietQrUrl({
                          bankCode: bankInfo.bankCode,
                          accountNumber: bankInfo.bankAccountNumber,
                          accountName: bankInfo.bankAccountName,
                          amount: posTotals.totalAmount,
                          invoiceCode: activeInvoice.invoiceCode,
                        })}
                        alt="Mã VietQR thanh toán ANIMORA"
                        className="h-44 w-44 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                      />
                      <div className="space-y-1.5 text-xs">
                        <p className="text-sm font-extrabold text-[#0F766E]">
                          Quét mã VietQR — Đã điền sẵn số tiền &amp; mã hóa đơn
                        </p>
                        <p>
                          Ngân hàng: <strong>{bankInfo.bankCode}</strong> • STK:{" "}
                          <strong className="font-mono">{bankInfo.bankAccountNumber}</strong>
                        </p>
                        <p>
                          Chủ tài khoản: <strong>{bankInfo.bankAccountName}</strong>
                        </p>
                        <p>
                          Số tiền:{" "}
                          <strong className="text-base text-[#F97316]">
                            {formatVnd(posTotals.totalAmount)}
                          </strong>
                        </p>
                        <p>
                          Nội dung CK:{" "}
                          <strong className="font-mono">ANIMORA {activeInvoice.invoiceCode}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePayInvoice}
                    disabled={paying}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-4 text-base font-extrabold text-white shadow-lg shadow-[#F97316]/25 transition hover:bg-[#EA580C] disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {paying
                      ? "Đang xác nhận thu tiền & trừ kho FEFO..."
                      : "Xác nhận đã thu (Trừ kho FEFO & Khóa cứng bệnh án S.O.A.P)"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: BÁN LẺ SHOP NHANH (KHÔNG KHÁM BỆNH)
         ======================================================== */}
      {posMode === "RETAIL_SHOP" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Cột trái 7 cột: Danh mục sản phẩm Shop & Hàng dùng chung */}
          <div className="col-span-7 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#132A2E]">
                  Chọn Sản phẩm Bán lẻ tại Shop ({filteredRetailProducts.length})
                </h3>
                <p className="text-xs text-[#476268]">
                  Bấm để thêm vào giỏ thanh toán ngay. Mặt hàng tồn &le; 0 vẫn cho phép bán kèm cảnh báo đỏ.
                </p>
              </div>
            </div>

            <input
              value={retailSearch}
              onChange={(e) => setRetailSearch(e.target.value)}
              placeholder="Tìm tên thức ăn, phụ kiện, sữa tắm, mã SKU..."
              className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-xs"
            />

            <div className="grid grid-cols-2 gap-3">
              {filteredRetailProducts.map((p) => {
                const inCart = retailCart.find((c) => c.productId === p.id);
                const isOut = p.stockQuantity <= 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-xs transition ${
                      isOut
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-[#132A2E]/10 bg-[#FAF9F6]"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-extrabold text-[#132A2E]">{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#476268]">
                        <strong className="text-[#0F766E]">{formatVnd(p.price)}</strong> / {p.retailUnit}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-bold ${
                          isOut ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        Tồn: {p.stockQuantity} {p.retailUnit} {isOut ? "(Tồn ≤ 0)" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRetailCart((prev) =>
                          inCart
                            ? prev.map((c) =>
                                c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c
                              )
                            : [...prev, { productId: p.id, quantity: 1 }]
                        )
                      }
                      className="shrink-0 rounded-xl bg-[#0F766E] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#0B5D56]"
                    >
                      {inCart ? `+1 (${inCart.quantity})` : "+ Thêm"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải 5 cột: Giỏ bán lẻ + Khuyến mãi + Tiền mặt / VietQR */}
          <div className="col-span-5 rounded-3xl border border-[#F97316]/30 bg-white p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#132A2E]">
                  Phiếu Bán lẻ Shop nhanh
                </h3>
                <p className="font-mono text-xs font-bold text-[#0F766E]">
                  Mã dự kiến: {retailDraftCode}
                </p>
              </div>
              {retailCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRetailCart([])}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Xóa giỏ
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="mb-1 block font-bold">Tên khách mua lẻ</label>
                <input
                  value={retailGuestName}
                  onChange={(e) => setRetailGuestName(e.target.value)}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">SĐT (tùy chọn)</label>
                <input
                  value={retailGuestPhone}
                  onChange={(e) => setRetailGuestPhone(e.target.value)}
                  placeholder="09xx..."
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
            </div>

            {retailZeroStockItems.length > 0 && (
              <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                CẢNH BÁO ĐỎ: {retailZeroStockItems.map((r) => r.product.name).join(", ")} đang có tồn kho &le; 0. Vẫn cho phép thanh toán (tồn âm tạm thời).
              </div>
            )}

            {/* Giỏ hàng */}
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {retailCartDetailed.length === 0 ? (
                <p className="rounded-xl bg-[#FAF9F6] py-6 text-center text-xs text-[#476268]">
                  Chưa chọn sản phẩm nào. Hãy bấm &quot;+ Thêm&quot; bên trái.
                </p>
              ) : (
                retailCartDetailed.map((row) => (
                  <div
                    key={row.productId}
                    className="flex items-center justify-between rounded-xl bg-[#FAF9F6] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-bold">{row.product.name}</p>
                      <p className="text-[11px] text-[#476268]">
                        {formatVnd(row.product.price)} × {row.quantity} ={" "}
                        <strong className="text-[#0F766E]">{formatVnd(row.totalPrice)}</strong>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setRetailCart((prev) =>
                            row.quantity <= 1
                              ? prev.filter((c) => c.productId !== row.productId)
                              : prev.map((c) =>
                                  c.productId === row.productId
                                    ? { ...c, quantity: c.quantity - 1 }
                                    : c
                                )
                          )
                        }
                        className="rounded border border-slate-300 bg-white p-1"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold">{row.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRetailCart((prev) =>
                            prev.map((c) =>
                              c.productId === row.productId
                                ? { ...c, quantity: c.quantity + 1 }
                                : c
                            )
                          )
                        }
                        className="rounded border border-slate-300 bg-white p-1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Khuyến mãi cộng dồn */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <select
                value={retailEventPromoId}
                onChange={(e) => setRetailEventPromoId(e.target.value)}
                className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-2.5 py-2 font-semibold"
              >
                <option value="">Sự kiện ưu đãi...</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <input
                value={retailCouponCode}
                onChange={(e) => setRetailCouponCode(e.target.value.toUpperCase())}
                placeholder="Mã giảm giá (VD: MEMBER10)"
                className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-2.5 py-2 font-mono font-bold uppercase"
              />
            </div>

            {/* Tổng kết */}
            <div className="space-y-1 rounded-2xl border border-[#0F766E]/15 bg-[#FAF9F6] p-3.5 text-xs">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <strong>{formatVnd(retailTotals.subtotal)}</strong>
              </div>
              {retailTotals.eventDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm sự kiện:</span>
                  <strong>-{formatVnd(retailTotals.eventDiscountAmount)}</strong>
                </div>
              )}
              {retailTotals.couponDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm mã ưu đãi:</span>
                  <strong>-{formatVnd(retailTotals.couponDiscountAmount)}</strong>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-extrabold text-[#0F766E]">
                <span>Thanh toán:</span>
                <span>{formatVnd(retailTotals.totalAmount)}</span>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRetailPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-extrabold ${
                  retailPaymentMethod === "CASH"
                    ? "border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]"
                    : "border-slate-200 text-[#476268]"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setRetailPaymentMethod("VIETQR")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-extrabold ${
                  retailPaymentMethod === "VIETQR"
                    ? "border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]"
                    : "border-slate-200 text-[#476268]"
                }`}
              >
                <QrCode className="h-4 w-4" />
                VietQR tĩnh
              </button>
            </div>

            {retailPaymentMethod === "CASH" ? (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <input
                  type="number"
                  value={retailCashReceived}
                  onChange={(e) => setRetailCashReceived(e.target.value)}
                  placeholder={`Khách đưa (${retailTotals.totalAmount})`}
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 font-bold">
                  <span>Thối lại:</span>
                  <span className="text-[#F97316]">
                    {formatVnd(
                      Math.max(
                        0,
                        Number(retailCashReceived || retailTotals.totalAmount) -
                          retailTotals.totalAmount
                      )
                    )}
                  </span>
                </div>
              </div>
            ) : (
              retailCartDetailed.length > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-3 text-[11px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildVietQrUrl({
                      bankCode: bankInfo.bankCode,
                      accountNumber: bankInfo.bankAccountNumber,
                      accountName: bankInfo.bankAccountName,
                      amount: retailTotals.totalAmount,
                      invoiceCode: retailDraftCode,
                    })}
                    alt="VietQR Bán lẻ"
                    className="h-28 w-28 rounded-xl bg-white p-1"
                  />
                  <div className="space-y-1">
                    <p className="font-extrabold text-[#0F766E]">VietQR Bán lẻ Shop</p>
                    <p>
                      {bankInfo.bankCode} • <strong className="font-mono">{bankInfo.bankAccountNumber}</strong>
                    </p>
                    <p>
                      Số tiền: <strong className="text-[#F97316]">{formatVnd(retailTotals.totalAmount)}</strong>
                    </p>
                    <p className="font-mono">ND: ANIMORA {retailDraftCode}</p>
                  </div>
                </div>
              )
            )}

            <button
              type="button"
              disabled={retailPaying || retailCart.length === 0}
              onClick={handlePayRetailDirectly}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#EA580C] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {retailPaying ? "Đang thanh toán..." : "Xác nhận đã thu & Trừ kho FEFO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
