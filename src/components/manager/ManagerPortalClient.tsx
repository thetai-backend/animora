"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  PlusCircle,
  PackageMinus,
  Trash2,
  FileText,
  Receipt,
  CheckCircle2,
  History,
} from "lucide-react";
import { formatDateVn, formatVnd } from "@/lib/format";

interface BatchItem {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  importedPackages: number;
  conversionRate: number;
  initialQuantity: number;
  remainingQuantity: number;
  daysLeft: number;
  expiringSoon: boolean;
  product: { id: string; sku: string; name: string; group: string; retailUnit: string };
}

interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  group: string;
  category: string;
  price: number;
  importUnit: string;
  retailUnit: string;
  conversionRate: number;
  stockQuantity: number;
  batches: { id: string; batchNumber: string; expiryDate: string; remainingQuantity: number }[];
}

interface SlipItem {
  id: string;
  slipCode: string;
  type?: string;
  quantity?: number;
  quantityChange?: number;
  department?: string;
  reason: string;
  createdByName: string;
  createdAt: string;
  product: { sku: string; name: string; retailUnit: string };
}

interface ManagerRecord {
  id: string;
  recordCode: string;
  status: string;
  createdAt: string;
  assessment: string;
  guestOwnerName: string | null;
  guestPetName: string | null;
  doctor: { fullName: string };
  customer: { fullName: string; phone: string | null } | null;
  pet: { name: string; species: string } | null;
  invoice: { invoiceCode: string; status: string; totalAmount: number } | null;
}

interface ManagerInvoice {
  id: string;
  invoiceCode: string;
  type: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string;
  guestName: string | null;
  customer: { fullName: string } | null;
  cashier: { fullName: string } | null;
  auditLogs: {
    id: string;
    actorName: string;
    action: string;
    detail: string;
    createdAt: string;
  }[];
}

const GROUP_LABEL: Record<string, string> = {
  MEDICINE: "Thuốc y tế",
  SHOP: "Sản phẩm Shop",
  SUPPLY: "Vật tư tiêu hao",
};

export function ManagerPortalClient() {
  const [tab, setTab] = useState<"INVENTORY" | "SLIPS" | "RECORDS" | "INVOICES">("INVENTORY");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<BatchItem[]>([]);
  const [internalSlips, setInternalSlips] = useState<SlipItem[]>([]);
  const [disposalSlips, setDisposalSlips] = useState<SlipItem[]>([]);
  const [records, setRecords] = useState<ManagerRecord[]>([]);
  const [invoices, setInvoices] = useState<ManagerInvoice[]>([]);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Forms
  const [importForm, setImportForm] = useState({
    productId: "",
    batchNumber: "",
    expiryDate: "",
    importedPackages: 1,
    importNote: "",
  });

  const [internalForm, setInternalForm] = useState({
    productId: "",
    quantity: 10,
    department: "Phòng khám",
    reason: "",
  });

  const [disposalForm, setDisposalForm] = useState({
    type: "DISPOSAL",
    productId: "",
    quantityChange: 1,
    reason: "",
  });

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadAll = async () => {
    const [invRes, recRes] = await Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/manager/records").then((r) => r.json()),
    ]);
    const prods: InventoryProduct[] = invRes.products || [];
    setProducts(prods);
    setExpiringBatches(invRes.expiringBatches || []);
    setInternalSlips(invRes.internalSlips || []);
    setDisposalSlips(invRes.disposalSlips || []);
    setRecords(recRes.medicalRecords || []);
    setInvoices(recRes.invoices || []);

    if (prods.length) {
      if (!importForm.productId) setImportForm((f) => ({ ...f, productId: prods[0].id }));
      if (!disposalForm.productId) setDisposalForm((f) => ({ ...f, productId: prods[0].id }));
      const sup = prods.find((p) => p.group === "SUPPLY") || prods[0];
      if (!internalForm.productId) setInternalForm((f) => ({ ...f, productId: sup.id }));
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedImportProduct = useMemo(
    () => products.find((p) => p.id === importForm.productId) || null,
    [products, importForm.productId]
  );

  const handleImportBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi nhập lô hàng", "err");
    } else {
      notify(data.message);
      setImportForm((f) => ({ ...f, batchNumber: "", importNote: "", importedPackages: 1 }));
      await loadAll();
    }
  };

  const handleCreateInternalSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/internal-use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(internalForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi lập phiếu xuất nội bộ", "err");
    } else {
      notify(data.message);
      setInternalForm((f) => ({ ...f, reason: "" }));
      await loadAll();
    }
  };

  const handleCreateDisposalSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/disposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(disposalForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi lập phiếu xuất hủy / kiểm kê", "err");
    } else {
      notify(data.message);
      setDisposalForm((f) => ({ ...f, reason: "" }));
      await loadAll();
    }
  };

  const filteredProducts =
    groupFilter === "ALL"
      ? products
      : products.filter((p) => p.group === groupFilter);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold ${
            toast.type === "err"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.type === "err" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* CẢNH BÁO ĐỎ NỔI BẬT MỌI LÔ CÒN DƯỚI 30 NGÀY HẾT HẠN */}
      {expiringBatches.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-500 bg-rose-50 p-6 shadow-md">
          <div className="flex items-center gap-2.5 text-rose-800">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
            <h2 className="text-lg font-extrabold">
              Cảnh báo Kho: Có {expiringBatches.length} lô hàng còn DƯỚI 30 NGÀY hết hạn sử dụng!
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {expiringBatches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-rose-300 bg-white px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-extrabold text-rose-800">{b.product.name}</p>
                  <p className="mt-0.5 text-[#476268]">
                    Số lô: <strong className="font-mono">{b.batchNumber}</strong> • Còn tồn:{" "}
                    <strong>
                      {b.remainingQuantity} {b.product.retailUnit}
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-lg bg-rose-600 px-2.5 py-1 font-extrabold text-white">
                    Còn {b.daysLeft} ngày
                  </span>
                  <p className="mt-1 text-[11px] text-rose-700">
                    HSD: {formatDateVn(b.expiryDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Quản lý */}
      <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
        {[
          { key: "INVENTORY", label: `Kho hợp nhất & Nhập lô (${products.length})`, icon: Package },
          {
            key: "SLIPS",
            label: `Phiếu xuất nội bộ & Xuất hủy (${internalSlips.length + disposalSlips.length})`,
            icon: PackageMinus,
          },
          { key: "RECORDS", label: `Hồ sơ ca khám (${records.length})`, icon: FileText },
          { key: "INVOICES", label: `Hóa đơn & Audit Log (${invoices.length})`, icon: Receipt },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === item.key
                  ? "bg-[#0F766E] text-white"
                  : "text-[#476268] hover:text-[#132A2E]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: KHO HỢP NHẤT & NHẬP LÔ QUY ĐỔI ĐƠN VỊ */}
      {tab === "INVENTORY" && (
        <div className="grid grid-cols-12 gap-6">
          <form
            onSubmit={handleImportBatch}
            className="col-span-4 rounded-3xl border border-[#0F766E]/20 bg-white p-6 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 text-[#0F766E]">
              <PlusCircle className="h-5 w-5" />
              <h3 className="text-base font-extrabold text-[#132A2E]">
                Nhập lô hàng mới (Tự quy đổi đơn vị)
              </h3>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Mặt hàng trong kho</label>
              <select
                value={importForm.productId}
                onChange={(e) =>
                  setImportForm({ ...importForm, productId: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{GROUP_LABEL[p.group]}] {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold">Số lô *</label>
                <input
                  required
                  value={importForm.batchNumber}
                  onChange={(e) =>
                    setImportForm({ ...importForm, batchNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="VD: LOT-26X1"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-mono text-xs font-bold uppercase"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Hạn sử dụng *</label>
                <input
                  type="date"
                  required
                  value={importForm.expiryDate}
                  onChange={(e) =>
                    setImportForm({ ...importForm, expiryDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">
                Số lượng nhập theo đơn vị lớn ({selectedImportProduct?.importUnit || "Hộp"}) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={importForm.importedPackages}
                onChange={(e) =>
                  setImportForm({
                    ...importForm,
                    importedPackages: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
              />
            </div>

            {selectedImportProduct && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                <p className="font-bold">Tự động quy đổi đơn vị nhỏ nhất:</p>
                <p className="mt-1">
                  {importForm.importedPackages} {selectedImportProduct.importUnit} ×{" "}
                  {selectedImportProduct.conversionRate} ={" "}
                  <strong className="text-base text-[#0F766E]">
                    +{importForm.importedPackages * selectedImportProduct.conversionRate}{" "}
                    {selectedImportProduct.retailUnit}
                  </strong>
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0F766E] py-3 text-sm font-extrabold text-white hover:bg-[#0B5D56]"
            >
              Xác nhận Nhập lô vào kho
            </button>
          </form>

          <div className="col-span-8 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                Tồn kho Hợp nhất (Thuốc / Shop / Vật tư)
              </h3>
              <div className="flex gap-1.5">
                {["ALL", "MEDICINE", "SHOP", "SUPPLY"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroupFilter(g)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      groupFilter === g
                        ? "bg-[#0F766E] text-white"
                        : "bg-[#FAF9F6] text-[#476268]"
                    }`}
                  >
                    {g === "ALL" ? "Tất cả" : GROUP_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Mã / Tên mặt hàng</th>
                    <th className="py-2.5">Nhóm</th>
                    <th className="py-2.5">Quy đổi</th>
                    <th className="py-2.5 text-right">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 pr-3">
                        <p className="font-bold text-[#132A2E]">{p.name}</p>
                        <p className="font-mono text-[11px] text-[#476268]">{p.sku}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold">
                          {GROUP_LABEL[p.group] || p.group}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-[#476268]">
                        1 {p.importUnit} = {p.conversionRate} {p.retailUnit}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-lg px-2.5 py-1 font-extrabold ${
                            p.stockQuantity <= 0
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {p.stockQuantity} {p.retailUnit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHIẾU XUẤT KHO NỘI BỘ & XUẤT HỦY / KIỂM KÊ */}
      {tab === "SLIPS" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Phiếu xuất nội bộ */}
          <div className="col-span-6 space-y-5">
            <form
              onSubmit={handleCreateInternalSlip}
              className="rounded-3xl border border-[#0F766E]/20 bg-white p-6 shadow-sm space-y-3"
            >
              <h3 className="text-base font-extrabold text-[#0F766E]">
                Lập Phiếu xuất kho nội bộ (Vật tư tiêu hao)
              </h3>
              <select
                value={internalForm.productId}
                onChange={(e) =>
                  setInternalForm({ ...internalForm, productId: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Tồn: {p.stockQuantity} {p.retailUnit})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  required
                  value={internalForm.quantity}
                  onChange={(e) =>
                    setInternalForm({
                      ...internalForm,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  placeholder="Số lượng"
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                />
                <input
                  value={internalForm.department}
                  onChange={(e) =>
                    setInternalForm({ ...internalForm, department: e.target.value })
                  }
                  placeholder="Phòng sử dụng"
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs"
                />
              </div>
              <input
                required
                value={internalForm.reason}
                onChange={(e) =>
                  setInternalForm({ ...internalForm, reason: e.target.value })
                }
                placeholder="Lý do xuất nội bộ *"
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0F766E] py-2.5 text-xs font-extrabold text-white"
              >
                Lập Phiếu xuất nội bộ
              </button>
            </form>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-extrabold">
                Lịch sử Phiếu xuất nội bộ ({internalSlips.length})
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                {internalSlips.map((s) => (
                  <div key={s.id} className="rounded-xl bg-[#FAF9F6] p-3">
                    <div className="flex justify-between font-bold text-[#0F766E]">
                      <span>{s.slipCode}</span>
                      <span>
                        -{s.quantity} {s.product.retailUnit}
                      </span>
                    </div>
                    <p className="font-bold text-[#132A2E]">{s.product.name}</p>
                    <p className="text-[#476268]">
                      {s.createdByName} • {s.department} • {s.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phiếu xuất hủy / Điều chỉnh kiểm kê */}
          <div className="col-span-6 space-y-5">
            <form
              onSubmit={handleCreateDisposalSlip}
              className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm space-y-3"
            >
              <h3 className="flex items-center gap-1.5 text-base font-extrabold text-rose-700">
                <Trash2 className="h-4 w-4" />
                Lập Phiếu xuất hủy / Điều chỉnh kiểm kê (Bắt buộc lý do)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={disposalForm.type}
                  onChange={(e) =>
                    setDisposalForm({ ...disposalForm, type: e.target.value })
                  }
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                >
                  <option value="DISPOSAL">Xuất hủy (Quá hạn / Hỏng vỡ)</option>
                  <option value="ADJUSTMENT">Điều chỉnh kiểm kê (+/-)</option>
                </select>
                <input
                  type="number"
                  required
                  value={disposalForm.quantityChange}
                  onChange={(e) =>
                    setDisposalForm({
                      ...disposalForm,
                      quantityChange: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="Số lượng"
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                />
              </div>
              <select
                value={disposalForm.productId}
                onChange={(e) =>
                  setDisposalForm({ ...disposalForm, productId: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Tồn: {p.stockQuantity} {p.retailUnit})
                  </option>
                ))}
              </select>
              <input
                required
                value={disposalForm.reason}
                onChange={(e) =>
                  setDisposalForm({ ...disposalForm, reason: e.target.value })
                }
                placeholder="Bắt buộc nhập lý do xuất hủy / lệch kiểm kê *"
                className="w-full rounded-xl border border-rose-200 bg-[#FAF9F6] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white hover:bg-rose-700"
              >
                Xác nhận Phiếu xuất hủy / Kiểm kê
              </button>
            </form>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-extrabold">
                Lịch sử Xuất hủy & Điều chỉnh ({disposalSlips.length})
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                {disposalSlips.map((s) => (
                  <div key={s.id} className="rounded-xl bg-rose-50/60 p-3">
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>{s.slipCode}</span>
                      <span>
                        {s.quantityChange} {s.product.retailUnit}
                      </span>
                    </div>
                    <p className="font-bold text-[#132A2E]">{s.product.name}</p>
                    <p className="text-[#476268]">
                      {s.createdByName} • Lý do: {s.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HỒ SƠ CA KHÁM (BAO GỒM CẢ KHÁCH VÃNG LAI) */}
      {tab === "RECORDS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
          <h3 className="text-lg font-extrabold text-[#132A2E]">
            Toàn bộ Hồ sơ ca khám S.O.A.P (Thành viên & Khách vãng lai)
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Mã BA</th>
                  <th className="py-2.5">Thú cưng & Chủ nuôi</th>
                  <th className="py-2.5">Bác sĩ</th>
                  <th className="py-2.5">Chẩn đoán (A)</th>
                  <th className="py-2.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-mono font-bold text-[#0F766E]">
                      {r.recordCode}
                    </td>
                    <td className="py-3">
                      <strong>{r.pet ? r.pet.name : r.guestPetName}</strong> —{" "}
                      {r.customer ? r.customer.fullName : `${r.guestOwnerName} (Vãng lai)`}
                    </td>
                    <td className="py-3">{r.doctor.fullName}</td>
                    <td className="py-3 max-w-xs truncate">{r.assessment || "—"}</td>
                    <td className="py-3 font-bold">
                      {r.status === "LOCKED" ? "🔒 Đã khóa cứng" : r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ĐỐI SOÁT HÓA ĐƠN & AUDIT LOG SỬA THUỐC TẠI QUẦY */}
      {tab === "INVOICES" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-[#132A2E]">
            Danh sách Hóa đơn & Lịch sử sửa thuốc tại quầy (Audit Log)
          </h3>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                    {inv.invoiceCode}
                  </span>{" "}
                  • <strong>{inv.customer ? inv.customer.fullName : inv.guestName}</strong> •{" "}
                  {inv.paymentMethod || "Chờ thu"}
                </div>
                <div className="font-extrabold text-[#132A2E]">
                  {formatVnd(inv.totalAmount)} ({inv.status})
                </div>
              </div>
              {inv.auditLogs.length > 0 && (
                <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="flex items-center gap-1 font-bold text-amber-900">
                    <History className="h-3.5 w-3.5" />
                    Audit Log ({inv.auditLogs.length} thao tác sửa tại quầy):
                  </p>
                  {inv.auditLogs.map((log) => (
                    <p key={log.id} className="mt-1 text-amber-950">
                      • {log.actorName} ({formatDateVn(log.createdAt)}):{" "}
                      <strong>{log.action}</strong> — {log.detail}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
