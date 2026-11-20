"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Plus,
  PlusCircle,
  PackageMinus,
  Trash2,
  Edit3,
  X,
  Layers,
} from "lucide-react";
import { formatDateVn, formatVnd } from "@/lib/format";

export interface BatchItem {
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

export interface InventoryProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  group: string;
  category: string;
  targetSpecies: string;
  price: number;
  importUnit: string;
  retailUnit: string;
  conversionRate: number;
  stockQuantity: number;
  isFeaturedOnWeb: boolean;
  isActive: boolean;
  batches: { id: string; batchNumber: string; expiryDate: string; remainingQuantity: number }[];
}

export interface SlipItem {
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
  batch?: { batchNumber: string } | null;
}

const GROUP_LABEL: Record<string, string> = {
  MEDICINE: "Thuốc y tế",
  SHOP: "Sản phẩm Shop",
  SHARED: "Hàng dùng chung",
  SUPPLY: "Vật tư tiêu hao",
};

export function ManagerInventoryTab({
  products,
  expiringBatches,
  negativeStockProducts,
  internalSlips,
  disposalSlips,
  onReload,
  notify,
}: {
  products: InventoryProduct[];
  expiringBatches: BatchItem[];
  negativeStockProducts: InventoryProduct[];
  internalSlips: SlipItem[];
  disposalSlips: SlipItem[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<"STOCK" | "SLIPS">("STOCK");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal Thêm / Sửa mặt hàng
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    sku: "",
    brand: "ANIMORA Clinic",
    group: "MEDICINE",
    category: "Thuốc kê đơn",
    targetSpecies: "BOTH",
    importUnit: "Hộp",
    retailUnit: "Viên",
    conversionRate: 10,
    price: 25000,
    isFeaturedOnWeb: false,
  });

  // Form Nhập lô hàng mới
  const [importForm, setImportForm] = useState({
    productId: products[0]?.id || "",
    batchNumber: "",
    expiryDate: "",
    importedPackages: 1,
    importNote: "",
  });

  // Form Phiếu xuất kho nội bộ
  const [internalForm, setInternalForm] = useState({
    productId: products.find((p) => p.group === "SUPPLY")?.id || products[0]?.id || "",
    quantity: 10,
    department: "Phòng khám",
    reason: "",
  });

  // Form Phiếu xuất hủy / Điều chỉnh kiểm kê
  const [disposalForm, setDisposalForm] = useState({
    type: "DISPOSAL",
    productId: products[0]?.id || "",
    batchId: "",
    quantityChange: 1,
    reason: "",
  });

  const activeImportProductId = importForm.productId || products[0]?.id || "";
  const activeInternalProductId =
    internalForm.productId || products.find((p) => p.group === "SUPPLY")?.id || products[0]?.id || "";
  const activeDisposalProductId = disposalForm.productId || products[0]?.id || "";

  const selectedImportProduct = useMemo(
    () => products.find((p) => p.id === activeImportProductId) || null,
    [products, activeImportProductId]
  );

  const selectedDisposalProduct = useMemo(
    () => products.find((p) => p.id === activeDisposalProductId) || null,
    [products, activeDisposalProductId]
  );

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: "",
      sku: "",
      brand: "ANIMORA Clinic",
      group: "MEDICINE",
      category: "Thuốc kê đơn",
      targetSpecies: "BOTH",
      importUnit: "Hộp",
      retailUnit: "Viên",
      conversionRate: 10,
      price: 25000,
      isFeaturedOnWeb: false,
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (p: InventoryProduct) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      group: p.group,
      category: p.category,
      targetSpecies: p.targetSpecies,
      importUnit: p.importUnit,
      retailUnit: p.retailUnit,
      conversionRate: p.conversionRate,
      price: p.price,
      isFeaturedOnWeb: p.isFeaturedOnWeb,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct
      ? `/api/inventory/products/${editingProduct.id}`
      : "/api/inventory/products";
    const method = editingProduct ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prodForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể lưu mặt hàng", "err");
      return;
    }
    setProductModalOpen(false);
    notify(data.message);
    await onReload();
  };

  const handleImportBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...importForm, productId: activeImportProductId }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi nhập lô hàng", "err");
    } else {
      notify(data.message);
      setImportForm((f) => ({ ...f, batchNumber: "", importNote: "", importedPackages: 1 }));
      await onReload();
    }
  };

  const handleCreateInternalSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/internal-use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...internalForm, productId: activeInternalProductId }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi lập phiếu xuất nội bộ", "err");
    } else {
      notify(data.message);
      setInternalForm((f) => ({ ...f, reason: "" }));
      await onReload();
    }
  };

  const handleCreateDisposalSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/disposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...disposalForm, productId: activeDisposalProductId }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi lập phiếu xuất hủy / kiểm kê", "err");
    } else {
      notify(data.message);
      setDisposalForm((f) => ({ ...f, reason: "", batchId: "" }));
      await onReload();
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (groupFilter !== "ALL" && p.group !== groupFilter) return false;
    if (
      search.trim() &&
      !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* KHU VỰC CẢNH BÁO ĐỎ NỔI BẬT: LÔ < 30 NGÀY HẾT HẠN & TỒN KHO ÂM (< 0) */}
      {(expiringBatches.length > 0 || negativeStockProducts.length > 0) && (
        <div className="rounded-3xl border-2 border-rose-500 bg-rose-50 p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2.5 text-rose-800">
            <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600" />
            <h2 className="text-lg font-extrabold">
              CẢNH BÁO KHO KHẨN CẤP ({expiringBatches.length} lô dưới 30 ngày HSD •{" "}
              {negativeStockProducts.length} mặt hàng tồn kho âm)
            </h2>
          </div>

          {negativeStockProducts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-rose-700">
                Mặt hàng đang TỒN KHO ÂM (&lt; 0) — Cần nhập lô bổ sung ngay:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {negativeStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl border-2 border-rose-400 bg-white px-4 py-3 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-extrabold text-rose-800">{p.name}</p>
                      <p className="font-mono text-[11px] text-[#476268]">{p.sku}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-rose-600 px-2.5 py-1 font-extrabold text-white">
                      {p.stockQuantity} {p.retailUnit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiringBatches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-rose-700">
                Các lô hàng còn DƯỚI 30 NGÀY hết hạn sử dụng (Ưu tiên xuất FEFO / Xuất hủy):
              </p>
              <div className="grid grid-cols-2 gap-3">
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
                        {b.daysLeft <= 0 ? "ĐÃ HẾT HẠN" : `Còn ${b.daysLeft} ngày`}
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
        </div>
      )}

      {/* Sub-navigation Kho */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setSubTab("STOCK")}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              subTab === "STOCK" ? "bg-[#0F766E] text-white" : "text-[#476268]"
            }`}
          >
            Danh mục Mặt hàng, Lô &amp; Nhập kho ({products.filter((p) => p.isActive).length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("SLIPS")}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              subTab === "SLIPS" ? "bg-[#F97316] text-white" : "text-[#476268]"
            }`}
          >
            Phiếu xuất nội bộ &amp; Xuất hủy / Kiểm kê ({internalSlips.length + disposalSlips.length})
          </button>
        </div>

        <button
          type="button"
          onClick={openCreateProduct}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#EA580C]"
        >
          <Plus className="h-4 w-4" />
          + Thêm mặt hàng mới
        </button>
      </div>

      {/* MODAL THÊM / SỬA MẶT HÀNG */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-2xl rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                {editingProduct ? `Chỉnh sửa mặt hàng (${editingProduct.sku})` : "+ Thêm mặt hàng mới vào Kho"}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-lg p-1.5 text-[#476268] hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Tên mặt hàng *</label>
                <input
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="VD: Thuốc nhỏ gáy trị ve rận NexGard (Tuýp)"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Phân loại kho *</label>
                <select
                  value={prodForm.group}
                  onChange={(e) => setProdForm({ ...prodForm, group: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value="MEDICINE">Thuốc y tế (Kê đơn)</option>
                  <option value="SHOP">Sản phẩm Shop (Bán lẻ)</option>
                  <option value="SHARED">Hàng dùng chung (Shop + Phòng khám)</option>
                  <option value="SUPPLY">Vật tư tiêu hao (Xuất nội bộ)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold">Mã SKU (tự sinh nếu bỏ trống)</label>
                <input
                  disabled={Boolean(editingProduct)}
                  value={prodForm.sku}
                  onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value.toUpperCase() })}
                  placeholder="VD: TH-NEX-01"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-mono font-bold uppercase disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Thương hiệu</label>
                <input
                  value={prodForm.brand}
                  onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Danh mục chi tiết</label>
                <input
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Đơn vị nhập lớn (Hộp/Chai/Thùng) *</label>
                <input
                  required
                  value={prodForm.importUnit}
                  onChange={(e) => setProdForm({ ...prodForm, importUnit: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Đơn vị bán lẻ nhỏ (Viên/ml/Liều/Gói) *</label>
                <input
                  required
                  value={prodForm.retailUnit}
                  onChange={(e) => setProdForm({ ...prodForm, retailUnit: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Hệ số quy đổi (1 lớn = ? nhỏ) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={prodForm.conversionRate}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, conversionRate: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Giá bán lẻ theo đơn vị nhỏ (VNĐ) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={prodForm.price}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, price: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
              Quy tắc quy đổi: <strong>1 {prodForm.importUnit || "Hộp"}</strong> ={" "}
              <strong>{prodForm.conversionRate} {prodForm.retailUnit || "Viên"}</strong> • Giá bán:{" "}
              <strong>{formatVnd(prodForm.price)}/{prodForm.retailUnit || "Viên"}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0B5D56]"
              >
                {editingProduct ? "Lưu thay đổi" : "Tạo mặt hàng mới"}
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === "STOCK" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Cột trái 4 cột: Nhập lô hàng mới */}
          <form
            onSubmit={handleImportBatch}
            className="col-span-4 rounded-3xl border border-[#0F766E]/20 bg-white p-6 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 text-[#0F766E]">
              <PlusCircle className="h-5 w-5" />
              <h3 className="text-base font-extrabold text-[#132A2E]">
                + Nhập lô hàng mới (Tự quy đổi đơn vị)
              </h3>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Mặt hàng trong kho</label>
              <select
                value={activeImportProductId}
                onChange={(e) => setImportForm({ ...importForm, productId: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{GROUP_LABEL[p.group] || p.group}] {p.name} (Tồn: {p.stockQuantity})
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
                  onChange={(e) => setImportForm({ ...importForm, expiryDate: e.target.value })}
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

            <div>
              <label className="mb-1 block text-xs font-bold">Ghi chú nhập kho (tùy chọn)</label>
              <input
                value={importForm.importNote}
                onChange={(e) => setImportForm({ ...importForm, importNote: e.target.value })}
                placeholder="Nhà cung cấp / hóa đơn nhập..."
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs"
              />
            </div>

            {selectedImportProduct && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                <p className="font-bold">Tự động quy đổi sang đơn vị nhỏ nhất:</p>
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

          {/* Cột phải 8 cột: Bảng tồn kho hợp nhất + xem các lô FEFO */}
          <div className="col-span-8 rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                Tồn kho Hợp nhất (Thuốc / Shop / Dùng chung / Vật tư)
              </h3>
              <div className="flex items-center gap-1.5">
                {["ALL", "MEDICINE", "SHOP", "SHARED", "SUPPLY"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupFilter(g)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
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

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh theo tên mặt hàng, mã SKU hoặc thương hiệu..."
              className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2 text-xs"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                    <th className="py-2.5">Mã / Tên mặt hàng</th>
                    <th className="py-2.5">Nhóm</th>
                    <th className="py-2.5">Quy đổi &amp; Giá bán</th>
                    <th className="py-2.5 text-right">Tồn kho</th>
                    <th className="py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {filteredProducts.map((p) => {
                    const isNeg = p.stockQuantity < 0;
                    const isZero = p.stockQuantity === 0;
                    const isExpanded = expandedProductId === p.id;
                    return (
                      <React.Fragment key={p.id}>
                        <tr className={isNeg ? "bg-rose-50" : "hover:bg-[#FAF9F6]"}>
                          <td className="py-3 pr-3">
                            <p className={`font-bold ${isNeg ? "text-rose-800" : "text-[#132A2E]"}`}>
                              {p.name}
                            </p>
                            <p className="font-mono text-[11px] text-[#476268]">
                              {p.sku} • {p.batches.length} lô
                            </p>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold">
                              {GROUP_LABEL[p.group] || p.group}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-[#476268]">
                            <div>
                              1 {p.importUnit} = {p.conversionRate} {p.retailUnit}
                            </div>
                            <div className="font-bold text-[#0F766E]">
                              {formatVnd(p.price)} / {p.retailUnit}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`rounded-lg px-2.5 py-1 font-extrabold ${
                                isNeg
                                  ? "bg-rose-600 text-white"
                                  : isZero
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {p.stockQuantity} {p.retailUnit}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedProductId(isExpanded ? null : p.id)
                                }
                                title="Xem danh sách lô FEFO"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#476268] hover:text-[#0F766E]"
                              >
                                <Layers className="h-3 w-3" />
                                Lô
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditProduct(p)}
                                title="Sửa mặt hàng"
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-[#0F766E] hover:bg-[#0F766E]/10"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[#FAF9F6]">
                            <td colSpan={5} className="px-4 py-3">
                              <p className="text-[11px] font-extrabold text-[#0F766E]">
                                Danh sách Lô hàng (Sắp xếp theo thứ tự trừ FEFO — hạn gần nhất trước):
                              </p>
                              {p.batches.length === 0 ? (
                                <p className="mt-1 text-[11px] italic text-[#476268]">
                                  Chưa có lô hàng nào được nhập.
                                </p>
                              ) : (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  {p.batches.map((b) => {
                                    const days = Math.ceil(
                                      (new Date(b.expiryDate).getTime() - Date.now()) /
                                        (1000 * 60 * 60 * 24)
                                    );
                                    const soon = b.remainingQuantity > 0 && days <= 30;
                                    return (
                                      <div
                                        key={b.id}
                                        className={`rounded-xl border px-3 py-2 text-[11px] ${
                                          soon
                                            ? "border-rose-400 bg-rose-50 text-rose-800"
                                            : "border-slate-200 bg-white"
                                        }`}
                                      >
                                        <div className="flex justify-between font-bold">
                                          <span className="font-mono">{b.batchNumber}</span>
                                          <span>
                                            Còn: {b.remainingQuantity} {p.retailUnit}
                                          </span>
                                        </div>
                                        <p className="mt-0.5 text-[10px]">
                                          HSD: {formatDateVn(b.expiryDate)}{" "}
                                          {soon && <strong>(Còn {days} ngày!)</strong>}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === "SLIPS" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Phiếu xuất kho nội bộ */}
          <div className="col-span-6 space-y-5">
            <form
              onSubmit={handleCreateInternalSlip}
              className="rounded-3xl border border-[#0F766E]/20 bg-white p-6 shadow-sm space-y-3"
            >
              <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0F766E]">
                <PackageMinus className="h-4 w-4" />
                Lập Phiếu xuất kho nội bộ (Vật tư tiêu hao)
              </h3>
              <select
                value={activeInternalProductId}
                onChange={(e) => setInternalForm({ ...internalForm, productId: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{GROUP_LABEL[p.group]}] {p.name} (Tồn: {p.stockQuantity} {p.retailUnit})
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
                  onChange={(e) => setInternalForm({ ...internalForm, department: e.target.value })}
                  placeholder="Phòng sử dụng"
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs"
                />
              </div>
              <input
                required
                value={internalForm.reason}
                onChange={(e) => setInternalForm({ ...internalForm, reason: e.target.value })}
                placeholder="Lý do xuất nội bộ *"
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0F766E] py-2.5 text-xs font-extrabold text-white hover:bg-[#0B5D56]"
              >
                Xác nhận Phiếu xuất nội bộ (Trừ kho FEFO)
              </button>
            </form>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-extrabold">
                Lịch sử Phiếu xuất nội bộ ({internalSlips.length})
              </h4>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs">
                {internalSlips.map((s) => (
                  <div key={s.id} className="rounded-xl bg-[#FAF9F6] p-3">
                    <div className="flex justify-between font-bold text-[#0F766E]">
                      <span className="font-mono">{s.slipCode}</span>
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

          {/* Phiếu xuất hủy / Điều chỉnh kiểm kê (Chọn đúng lô) */}
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
                  onChange={(e) => setDisposalForm({ ...disposalForm, type: e.target.value })}
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
                  placeholder={disposalForm.type === "DISPOSAL" ? "Số lượng hủy" : "VD: +5 hoặc -3"}
                  className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                />
              </div>
              <select
                value={activeDisposalProductId}
                onChange={(e) =>
                  setDisposalForm({ ...disposalForm, productId: e.target.value, batchId: "" })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
              >
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn: {p.stockQuantity} {p.retailUnit})
                    </option>
                  ))}
              </select>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#476268]">
                  Chọn Lô hàng áp dụng (tự trừ/cộng đúng lô):
                </label>
                <select
                  value={disposalForm.batchId}
                  onChange={(e) => setDisposalForm({ ...disposalForm, batchId: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-semibold"
                >
                  <option value="">Tự động theo lô gần hết hạn nhất (FEFO)</option>
                  {(selectedDisposalProduct?.batches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      Lô {b.batchNumber} — HSD: {formatDateVn(b.expiryDate)} (Còn: {b.remainingQuantity}{" "}
                      {selectedDisposalProduct?.retailUnit})
                    </option>
                  ))}
                </select>
              </div>

              <input
                required
                value={disposalForm.reason}
                onChange={(e) => setDisposalForm({ ...disposalForm, reason: e.target.value })}
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
                Lịch sử Xuất hủy &amp; Điều chỉnh ({disposalSlips.length})
              </h4>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs">
                {disposalSlips.map((s) => (
                  <div key={s.id} className="rounded-xl bg-rose-50/60 p-3">
                    <div className="flex justify-between font-bold text-rose-700">
                      <span className="font-mono">
                        {s.slipCode} {s.batch ? `• Lô ${s.batch.batchNumber}` : ""}
                      </span>
                      <span>
                        {(s.quantityChange || 0) > 0 ? `+${s.quantityChange}` : s.quantityChange}{" "}
                        {s.product.retailUnit}
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
    </div>
  );
}
