"use client";

import React, { useState } from "react";
import { Plus, Edit3, Trash2, Sparkles, X } from "lucide-react";
import { formatDateVn, formatVnd } from "@/lib/format";

export interface ManagerPromotion {
  id: string;
  code: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  discountType: string;
  discountValue: number;
  applicableScope: string;
  badgeText: string | null;
  startDate: string;
  endDate: string;
  showOnLanding: boolean;
  isActive: boolean;
}

const SCOPE_LABEL: Record<string, string> = {
  ALL: "Toàn bộ hóa đơn",
  MEDICAL: "Dịch vụ Y tế & Thuốc",
  SPA: "Dịch vụ Spa / Grooming",
  SHOP: "Sản phẩm Shop",
};

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ManagerPromotionsTab({
  promotions,
  onReload,
  notify,
}: {
  promotions: ManagerPromotion[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerPromotion | null>(null);
  const [promoKind, setPromoKind] = useState<"EVENT" | "COUPON">("EVENT");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    code: "",
    discountType: "PERCENT",
    discountValue: 15,
    applicableScope: "ALL",
    badgeText: "Ưu đãi đặc biệt",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    showOnLanding: true,
    isActive: true,
  });

  const openCreate = () => {
    setEditing(null);
    setPromoKind("EVENT");
    setForm({
      title: "",
      subtitle: "",
      description: "",
      code: "",
      discountType: "PERCENT",
      discountValue: 15,
      applicableScope: "ALL",
      badgeText: "Ưu đãi đặc biệt",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      showOnLanding: true,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (p: ManagerPromotion) => {
    setEditing(p);
    setPromoKind(p.code && p.applicableScope === "ALL" ? "COUPON" : "EVENT");
    setForm({
      title: p.title,
      subtitle: p.subtitle || "",
      description: p.description,
      code: p.code || "",
      discountType: p.discountType,
      discountValue: p.discountValue,
      applicableScope: p.applicableScope,
      badgeText: p.badgeText || "",
      startDate: toDateInput(p.startDate),
      endDate: toDateInput(p.endDate),
      showOnLanding: p.showOnLanding,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/manager/promotions/${editing.id}` : "/api/manager/promotions";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể lưu chương trình ưu đãi", "err");
      return;
    }
    notify(data.message);
    setModalOpen(false);
    await onReload();
  };

  const handleQuickToggle = async (
    p: ManagerPromotion,
    field: "isActive" | "showOnLanding"
  ) => {
    const res = await fetch(`/api/manager/promotions/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    const data = await res.json();
    if (res.ok) {
      notify(data.message);
      await onReload();
    }
  };

  const handleDelete = async (p: ManagerPromotion) => {
    const res = await fetch(`/api/manager/promotions/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      notify(`Đã xóa sự kiện "${p.title}"!`);
      await onReload();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-[#132A2E]">
            Quản lý Sự kiện &amp; Mã Khuyến mãi ({promotions.length})
          </h3>
          <p className="text-xs text-[#476268]">
            Bật công tắc <strong>Hiện Banner Trang chủ</strong> để hiển thị ngay trên Trang Quảng cáo ANIMORA kèm đồng hồ đếm ngược.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#EA580C]"
        >
          <Plus className="h-4 w-4" />
          + Tạo Sự kiện / Mã ưu đãi
        </button>
      </div>

      {/* Modal Tạo / Sửa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                {editing ? `Sửa sự kiện — ${editing.title}` : "+ Tạo Sự kiện / Mã Khuyến mãi mới"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#476268] hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPromoKind("EVENT");
                    if (form.applicableScope === "ALL") {
                      setForm({ ...form, applicableScope: "SPA" });
                    }
                  }}
                  className={`rounded-2xl border-2 p-3 text-left transition ${
                    promoKind === "EVENT"
                      ? "border-[#0F766E] bg-[#0F766E]/8"
                      : "border-slate-200 bg-[#FAF9F6]"
                  }`}
                >
                  <p className="font-extrabold text-[#0F766E]">
                    1. Sự kiện khuyến mãi theo dịch vụ / sản phẩm
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#476268]">
                    Giảm theo nhóm Y tế, Spa hoặc Shop (Bước 1 tại POS).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoKind("COUPON");
                    setForm({ ...form, applicableScope: "ALL" });
                  }}
                  className={`rounded-2xl border-2 p-3 text-left transition ${
                    promoKind === "COUPON"
                      ? "border-[#F97316] bg-[#F97316]/8"
                      : "border-slate-200 bg-[#FAF9F6]"
                  }`}
                >
                  <p className="font-extrabold text-[#EA580C]">
                    2. Mã giảm giá trên tổng hóa đơn
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#476268]">
                    Nhập mã ưu đãi (Bước 2 tại POS — cộng dồn sau sự kiện).
                  </p>
                </button>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block font-bold">Tên chương trình / Sự kiện *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Tuần lễ Giảm 25% Gói Tắm Spa cho Chó Mèo"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">
                  {promoKind === "COUPON"
                    ? "Mã giảm giá áp dụng trên tổng hóa đơn *"
                    : "Mã sự kiện (tùy chọn, bỏ trống nếu chọn trực tiếp tại POS)"}
                </label>
                <input
                  required={promoKind === "COUPON"}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder={promoKind === "COUPON" ? "VD: MEMBER10" : "VD: SPA25 (không bắt buộc)"}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-mono text-sm font-bold uppercase"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Nhãn nổi bật trên Banner</label>
                <input
                  value={form.badgeText}
                  onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                  placeholder="VD: Hot tháng 11"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Kiểu giảm giá *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value="PERCENT">Giảm theo phần trăm (%)</option>
                  <option value="FIXED">Giảm số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold">
                  Mức giảm ({form.discountType === "PERCENT" ? "%" : "VNĐ"}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={form.discountType === "PERCENT" ? 100 : undefined}
                  required
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Phạm vi áp dụng *</label>
                <select
                  value={form.applicableScope}
                  onChange={(e) => setForm({ ...form, applicableScope: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value="ALL">Toàn bộ hóa đơn</option>
                  <option value="MEDICAL">Dịch vụ Y tế &amp; Thuốc</option>
                  <option value="SPA">Dịch vụ Spa / Grooming</option>
                  <option value="SHOP">Sản phẩm Shop</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold">Phụ đề ngắn</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Áp dụng trực tiếp tại quầy POS"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Ngày bắt đầu *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold">Ngày kết thúc *</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block font-bold">Mô tả chi tiết ưu đãi *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 accent-[#0F766E]"
                />
                Đang kích hoạt (áp dụng tại POS)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={form.showOnLanding}
                  onChange={(e) => setForm({ ...form, showOnLanding: e.target.checked })}
                  className="h-4 w-4 accent-[#F97316]"
                />
                Hiển thị trên Banner Trang Quảng cáo
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 font-extrabold text-white hover:bg-[#0B5D56]"
              >
                {editing ? "Lưu thay đổi" : "Tạo chương trình"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách khuyến mãi */}
      {promotions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#0F766E]/25 bg-white p-12 text-center shadow-xs">
          <p className="text-base font-bold text-[#132A2E]">
            Chưa có dữ liệu sự kiện hoặc mã ưu đãi nào
          </p>
          <p className="mt-1 text-xs text-[#476268]">
            Quản lý vui lòng bấm &ldquo;+ Tạo Sự kiện / Mã ưu đãi&rdquo; ở góc trên để thêm chương trình mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {promotions.map((p) => (
          <div
            key={p.id}
            className={`rounded-3xl border p-6 shadow-sm space-y-3 ${
              p.isActive
                ? "border-[#0F766E]/20 bg-white"
                : "border-slate-200 bg-slate-50 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#F97316] px-2.5 py-0.5 text-xs font-extrabold text-white">
                    <Sparkles className="h-3 w-3" />
                    {p.discountType === "PERCENT"
                      ? `Giảm ${p.discountValue}%`
                      : `Giảm ${formatVnd(p.discountValue)}`}
                  </span>
                  <span className="rounded-lg bg-[#0F766E]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0F766E]">
                    {SCOPE_LABEL[p.applicableScope] || p.applicableScope}
                  </span>
                  {p.code && (
                    <span className="rounded-lg bg-[#132A2E] px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-white">
                      MÃ: {p.code}
                    </span>
                  )}
                </div>
                <h4 className="mt-2 text-base font-extrabold text-[#132A2E]">{p.title}</h4>
                <p className="mt-0.5 text-xs text-[#476268]">{p.description}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-[#0F766E] hover:bg-[#0F766E]/10"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#132A2E]/10 pt-3 text-xs">
              <span className="text-[#476268]">
                Hiệu lực: <strong>{formatDateVn(p.startDate)}</strong> –{" "}
                <strong>{formatDateVn(p.endDate)}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickToggle(p, "showOnLanding")}
                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${
                    p.showOnLanding
                      ? "bg-[#F97316] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {p.showOnLanding ? "Banner Trang chủ: BẬT" : "Banner Trang chủ: TẮT"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickToggle(p, "isActive")}
                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${
                    p.isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-300 text-slate-700"
                  }`}
                >
                  {p.isActive ? "Đang chạy" : "Đang tắt"}
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
