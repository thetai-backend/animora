"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Stethoscope,
  ShoppingBag,
  UserCheck,
  Save,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { formatVnd } from "@/lib/format";
import type { StaffMember } from "./ManagerStaffTab";

export interface CmsSettings {
  clinicName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  latitude: number | null;
  longitude: number | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

export interface CmsService {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  shortDescription: string;
  processSteps: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CmsShopProduct {
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
  imageUrl: string;
  shortDescription: string;
  ingredients: string;
  benefits: string;
  suitableFor: string;
  usageInstructions: string;
  storageInstructions: string;
  isFeaturedOnWeb: boolean;
  isActive: boolean;
}

export function ManagerCmsTab({
  settings,
  services,
  products,
  doctors,
  onReload,
  notify,
}: {
  settings: CmsSettings | null;
  services: CmsService[];
  products: CmsShopProduct[];
  doctors: StaffMember[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [section, setSection] = useState<"CLINIC" | "SERVICES" | "SHOP" | "DOCTORS">("CLINIC");

  // 1) Clinic Settings + VietQR
  const [clinicForm, setClinicForm] = useState({
    clinicName: "",
    tagline: "",
    heroTitle: "",
    heroSubtitle: "",
    address: "",
    phone: "",
    email: "",
    openTime: "07:00",
    closeTime: "20:00",
    googleMapsUrl: "",
    googleMapsEmbedUrl: "",
    latitude: "",
    longitude: "",
    bankCode: "MB",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [savingClinic, setSavingClinic] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setClinicForm({
      clinicName: settings.clinicName || "",
      tagline: settings.tagline || "",
      heroTitle: settings.heroTitle || "",
      heroSubtitle: settings.heroSubtitle || "",
      address: settings.address || "",
      phone: settings.phone || "",
      email: settings.email || "",
      openTime: settings.openTime || "07:00",
      closeTime: settings.closeTime || "20:00",
      googleMapsUrl: settings.googleMapsUrl || "",
      googleMapsEmbedUrl: settings.googleMapsEmbedUrl || "",
      latitude: settings.latitude !== null ? String(settings.latitude) : "",
      longitude: settings.longitude !== null ? String(settings.longitude) : "",
      bankCode: settings.bankCode || "MB",
      bankAccountNumber: settings.bankAccountNumber || "",
      bankAccountName: settings.bankAccountName || "",
    });
  }, [settings]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClinic(true);
    try {
      const res = await fetch("/api/manager/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicForm),
      });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Lưu thất bại", "err");
      else {
        notify(data.message);
        await onReload();
      }
    } finally {
      setSavingClinic(false);
    }
  };

  // 2) Services CRUD
  const [srvModalOpen, setSrvModalOpen] = useState(false);
  const [editingSrv, setEditingSrv] = useState<CmsService | null>(null);
  const [srvForm, setSrvForm] = useState({
    name: "",
    category: "MEDICAL",
    price: 150000,
    durationMinutes: 30,
    shortDescription: "",
    processSteps: "",
    isActive: true,
  });

  const openCreateSrv = () => {
    setEditingSrv(null);
    setSrvForm({
      name: "",
      category: "MEDICAL",
      price: 150000,
      durationMinutes: 30,
      shortDescription: "",
      processSteps: "Tiếp nhận thú cưng\nThực hiện dịch vụ chuẩn y khoa ANIMORA",
      isActive: true,
    });
    setSrvModalOpen(true);
  };

  const openEditSrv = (s: CmsService) => {
    setEditingSrv(s);
    setSrvForm({
      name: s.name,
      category: s.category,
      price: s.price,
      durationMinutes: s.durationMinutes,
      shortDescription: s.shortDescription,
      processSteps: s.processSteps,
      isActive: s.isActive,
    });
    setSrvModalOpen(true);
  };

  const handleSaveSrv = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingSrv ? `/api/manager/cms/services/${editingSrv.id}` : "/api/manager/cms/services";
    const method = editingSrv ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(srvForm),
    });
    const data = await res.json();
    if (!res.ok) notify(data.error || "Không thể lưu dịch vụ", "err");
    else {
      notify(data.message);
      setSrvModalOpen(false);
      await onReload();
    }
  };

  const handleToggleSrv = async (s: CmsService) => {
    const res = await fetch(`/api/manager/cms/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) {
      notify(s.isActive ? `Đã ẩn dịch vụ "${s.name}" khỏi Trang chủ` : `Đã hiện dịch vụ "${s.name}" trên Trang chủ`);
      await onReload();
    }
  };

  // 3) Shop Product Detailed CMS CRUD
  const shopDisplayProducts = products.filter((p) => p.group === "SHOP" || p.group === "SHARED");
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<CmsShopProduct | null>(null);
  const [shopForm, setShopForm] = useState({
    name: "",
    brand: "",
    group: "SHOP",
    category: "Thức ăn dinh dưỡng",
    targetSpecies: "BOTH",
    price: 250000,
    importUnit: "Thùng",
    retailUnit: "Túi",
    conversionRate: 6,
    imageUrl: "/images/product-food.jpg",
    shortDescription: "",
    ingredients: "",
    benefits: "",
    suitableFor: "",
    usageInstructions: "",
    storageInstructions: "",
    isFeaturedOnWeb: true,
  });

  const openCreateShop = () => {
    setEditingShop(null);
    setShopForm({
      name: "",
      brand: "Royal Canin",
      group: "SHOP",
      category: "Thức ăn dinh dưỡng",
      targetSpecies: "BOTH",
      price: 250000,
      importUnit: "Thùng",
      retailUnit: "Túi",
      conversionRate: 6,
      imageUrl: "/images/product-food.jpg",
      shortDescription: "",
      ingredients: "",
      benefits: "",
      suitableFor: "",
      usageInstructions: "",
      storageInstructions: "",
      isFeaturedOnWeb: true,
    });
    setShopModalOpen(true);
  };

  const openEditShop = (p: CmsShopProduct) => {
    setEditingShop(p);
    setShopForm({
      name: p.name,
      brand: p.brand,
      group: p.group,
      category: p.category,
      targetSpecies: p.targetSpecies,
      price: p.price,
      importUnit: p.importUnit,
      retailUnit: p.retailUnit,
      conversionRate: p.conversionRate,
      imageUrl: p.imageUrl,
      shortDescription: p.shortDescription,
      ingredients: p.ingredients,
      benefits: p.benefits,
      suitableFor: p.suitableFor,
      usageInstructions: p.usageInstructions,
      storageInstructions: p.storageInstructions,
      isFeaturedOnWeb: p.isFeaturedOnWeb,
    });
    setShopModalOpen(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingShop ? `/api/inventory/products/${editingShop.id}` : "/api/inventory/products";
    const method = editingShop ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shopForm),
    });
    const data = await res.json();
    if (!res.ok) notify(data.error || "Không thể lưu sản phẩm Shop", "err");
    else {
      notify(`${data.message} Trang chủ đã cập nhật ngay!`);
      setShopModalOpen(false);
      await onReload();
    }
  };

  const handleToggleShopWeb = async (p: CmsShopProduct) => {
    const res = await fetch(`/api/inventory/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeaturedOnWeb: !p.isFeaturedOnWeb }),
    });
    if (res.ok) {
      notify(
        p.isFeaturedOnWeb
          ? `Đã ẩn "${p.name}" khỏi Thư viện Shop Trang chủ.`
          : `Đã hiện "${p.name}" trên Thư viện Shop Trang chủ!`
      );
      await onReload();
    }
  };

  // 4) Doctors Profile CMS Edit
  const [editingDoc, setEditingDoc] = useState<StaffMember | null>(null);
  const [docForm, setDocForm] = useState({
    fullName: "",
    title: "",
    specialty: "",
    experienceYears: "",
    bio: "",
    avatarUrl: "/images/doctor-1.jpg",
  });

  const openEditDoc = (d: StaffMember) => {
    setEditingDoc(d);
    setDocForm({
      fullName: d.fullName,
      title: d.title || "",
      specialty: d.specialty || "",
      experienceYears: d.experienceYears !== null ? String(d.experienceYears) : "",
      bio: d.bio || "",
      avatarUrl: d.avatarUrl || "/images/doctor-1.jpg",
    });
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    const res = await fetch(`/api/manager/staff/${editingDoc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    const data = await res.json();
    if (!res.ok) notify(data.error || "Không thể cập nhật hồ sơ bác sĩ", "err");
    else {
      notify("Đã cập nhật hồ sơ Bác sĩ trên Trang chủ!");
      setEditingDoc(null);
      await onReload();
    }
  };

  return (
    <div className="space-y-5">
      {/* Thanh chuyển 4 mục CMS */}
      <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
        {[
          { key: "CLINIC", label: "Thông tin Phòng khám, Maps & VietQR", icon: Building2 },
          { key: "SERVICES", label: `Dịch vụ & Bảng giá cố định (${services.length})`, icon: Stethoscope },
          { key: "SHOP", label: `Bài mô tả Sản phẩm Shop (${shopDisplayProducts.length})`, icon: ShoppingBag },
          { key: "DOCTORS", label: `Đội ngũ Bác sĩ (${doctors.length})`, icon: UserCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key as typeof section)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                section === item.key ? "bg-[#0F766E] text-white" : "text-[#476268]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: THÔNG TIN PHÒNG KHÁM, GOOGLE MAPS & NGÂN HÀNG VIETQR */}
      {section === "CLINIC" && (
        <form
          onSubmit={handleSaveClinic}
          className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                Thông tin Phòng khám, Google Maps &amp; Cấu hình VietQR
              </h3>
              <p className="text-[#476268]">
                Mọi thay đổi sau khi lưu sẽ cập nhật trực tiếp lên Trang chủ, mẫu in A4 và mã QR tại quầy Thu ngân POS.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingClinic}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#EA580C]"
            >
              <Save className="h-4 w-4" />
              {savingClinic ? "Đang lưu..." : "Lưu tất cả thay đổi"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-bold">Tên phòng khám *</label>
              <input
                required
                value={clinicForm.clinicName}
                onChange={(e) => setClinicForm({ ...clinicForm, clinicName: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Khẩu hiệu thương hiệu (Tagline)</label>
              <input
                value={clinicForm.tagline}
                onChange={(e) => setClinicForm({ ...clinicForm, tagline: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block font-bold">Tiêu đề Hero Trang chủ</label>
              <input
                value={clinicForm.heroTitle}
                onChange={(e) => setClinicForm({ ...clinicForm, heroTitle: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block font-bold">Mô tả Hero Trang chủ</label>
              <textarea
                rows={2}
                value={clinicForm.heroSubtitle}
                onChange={(e) => setClinicForm({ ...clinicForm, heroSubtitle: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block font-bold">Địa chỉ cơ sở *</label>
              <input
                required
                value={clinicForm.address}
                onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Hotline phòng khám *</label>
              <input
                required
                value={clinicForm.phone}
                onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Email liên hệ</label>
              <input
                value={clinicForm.email}
                onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Giờ mở cửa (VD: 07:00)</label>
              <input
                type="time"
                value={clinicForm.openTime}
                onChange={(e) => setClinicForm({ ...clinicForm, openTime: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Giờ đóng cửa (VD: 20:00)</label>
              <input
                type="time"
                value={clinicForm.closeTime}
                onChange={(e) => setClinicForm({ ...clinicForm, closeTime: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Link chỉ đường Google Maps</label>
              <input
                value={clinicForm.googleMapsUrl}
                onChange={(e) => setClinicForm({ ...clinicForm, googleMapsUrl: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Link nhúng bản đồ Google Maps (iframe)</label>
              <input
                value={clinicForm.googleMapsEmbedUrl}
                onChange={(e) => setClinicForm({ ...clinicForm, googleMapsEmbedUrl: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Vĩ độ (Latitude)</label>
              <input
                value={clinicForm.latitude}
                onChange={(e) => setClinicForm({ ...clinicForm, latitude: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Kinh độ (Longitude)</label>
              <input
                value={clinicForm.longitude}
                onChange={(e) => setClinicForm({ ...clinicForm, longitude: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#0F766E]/25 bg-[#0F766E]/5 p-5 space-y-3">
            <h4 className="text-sm font-extrabold text-[#0F766E]">
              Cấu hình Tài khoản Ngân hàng VietQR tĩnh (Dùng cho Thu ngân POS)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block font-bold">Mã ngân hàng (VD: MB, VCB, TCB, ACB)</label>
                <input
                  value={clinicForm.bankCode}
                  onChange={(e) =>
                    setClinicForm({ ...clinicForm, bankCode: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2 font-mono text-sm font-extrabold uppercase"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Số tài khoản nhận tiền *</label>
                <input
                  value={clinicForm.bankAccountNumber}
                  onChange={(e) =>
                    setClinicForm({ ...clinicForm, bankAccountNumber: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2 font-mono text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Tên chủ tài khoản (Không dấu)</label>
                <input
                  value={clinicForm.bankAccountName}
                  onChange={(e) =>
                    setClinicForm({ ...clinicForm, bankAccountName: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2 text-sm font-bold uppercase"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 2: DỊCH VỤ & BẢNG GIÁ CỐ ĐỊNH */}
      {section === "SERVICES" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#132A2E]">
                Quản lý Dịch vụ &amp; Bảng giá cố định (Kèm thời lượng khóa slot)
              </h3>
              <p className="text-xs text-[#476268]">
                Mỗi dịch vụ 1 mức giá cố định, đồng bộ ngay lên Trang chủ và trang Đặt lịch.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateSrv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#EA580C]"
            >
              <Plus className="h-4 w-4" />
              + Thêm dịch vụ mới
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                <th className="py-2.5">Tên dịch vụ</th>
                <th className="py-2.5">Nhóm</th>
                <th className="py-2.5 text-center">Thời lượng</th>
                <th className="py-2.5 text-right">Giá cố định</th>
                <th className="py-2.5 text-center">Hiển thị Web</th>
                <th className="py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132A2E]/8">
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#476268]">
                    Chưa có dữ liệu dịch vụ — Vui lòng bấm &ldquo;+ Thêm dịch vụ mới&rdquo; để niêm yết lên Trang chủ.
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s.id} className={!s.isActive ? "bg-slate-100/70 opacity-75" : "hover:bg-[#FAF9F6]"}>
                  <td className="py-3 pr-3">
                    <p className="font-bold text-[#132A2E]">{s.name}</p>
                    <p className="max-w-md truncate text-[11px] text-[#476268]">{s.shortDescription}</p>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 font-bold ${
                        s.category === "MEDICAL"
                          ? "bg-[#0F766E]/10 text-[#0F766E]"
                          : "bg-[#F97316]/12 text-[#EA580C]"
                      }`}
                    >
                      {s.category === "MEDICAL" ? "Y tế" : "Spa / Grooming"}
                    </span>
                  </td>
                  <td className="py-3 text-center font-bold">{s.durationMinutes} phút</td>
                  <td className="py-3 text-right font-extrabold text-[#0F766E]">
                    {formatVnd(s.price)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSrv(s)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        s.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {s.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {s.isActive ? "Đang hiện" : "Đang ẩn"}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditSrv(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dịch vụ */}
      {srvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSaveSrv}
            className="w-full max-w-xl rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                {editingSrv ? "Chỉnh sửa Dịch vụ" : "+ Thêm Dịch vụ mới"}
              </h3>
              <button type="button" onClick={() => setSrvModalOpen(false)}>
                <X className="h-5 w-5 text-[#476268]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Tên dịch vụ *</label>
                <input
                  required
                  value={srvForm.name}
                  onChange={(e) => setSrvForm({ ...srvForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Nhóm dịch vụ</label>
                <select
                  value={srvForm.category}
                  onChange={(e) => setSrvForm({ ...srvForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value="MEDICAL">Dịch vụ Y tế</option>
                  <option value="SPA">Dịch vụ Spa / Grooming</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold">Thời lượng ước tính (phút) *</label>
                <select
                  value={srvForm.durationMinutes}
                  onChange={(e) =>
                    setSrvForm({ ...srvForm, durationMinutes: Number(e.target.value) || 30 })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value={30}>30 phút (1 slot)</option>
                  <option value={60}>60 phút (2 slot)</option>
                  <option value={90}>90 phút (3 slot)</option>
                  <option value={120}>120 phút (4 slot)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Giá cố định (VNĐ) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={srvForm.price}
                  onChange={(e) => setSrvForm({ ...srvForm, price: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Mô tả ngắn *</label>
                <textarea
                  required
                  rows={2}
                  value={srvForm.shortDescription}
                  onChange={(e) => setSrvForm({ ...srvForm, shortDescription: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Quy trình thực hiện (mỗi bước 1 dòng)</label>
                <textarea
                  rows={3}
                  value={srvForm.processSteps}
                  onChange={(e) => setSrvForm({ ...srvForm, processSteps: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSrvModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 font-extrabold text-white"
              >
                Lưu dịch vụ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: MÔ TẢ CHI TIẾT SẢN PHẨM SHOP */}
      {section === "SHOP" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#132A2E]">
                CMS Bài mô tả Chuyên sâu Sản phẩm tại Shop (Hiển thị trên Trang chủ)
              </h3>
              <p className="text-xs text-[#476268]">
                Quản lý thành phần, công dụng, đối tượng phù hợp, hướng dẫn sử dụng, bảo quản và hình ảnh sản phẩm.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateShop}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#EA580C]"
            >
              <Plus className="h-4 w-4" />
              + Thêm Sản phẩm Shop
            </button>
          </div>

          {shopDisplayProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#0F766E]/25 bg-[#FAF9F6] p-10 text-center text-xs text-[#476268]">
              <p className="text-sm font-bold text-[#132A2E]">
                Chưa có dữ liệu sản phẩm Shop nào
              </p>
              <p className="mt-1">
                Vui lòng bấm &ldquo;+ Thêm Sản phẩm Shop&rdquo; để tạo bài mô tả sản phẩm hiển thị trên Trang chủ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {shopDisplayProducts.map((p) => (
              <div
                key={p.id}
                className="flex gap-4 rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4 text-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-24 w-24 shrink-0 rounded-xl object-cover border border-white shadow-xs"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-[#132A2E] line-clamp-2">{p.name}</h4>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleShopWeb(p)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                          p.isFeaturedOnWeb
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {p.isFeaturedOnWeb ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {p.isFeaturedOnWeb ? "Đang hiện" : "Đang ẩn"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditShop(p)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-2.5 py-1 font-bold text-white"
                      >
                        <Edit3 className="h-3 w-3" />
                        Sửa bài
                      </button>
                    </div>
                  </div>
                  <p className="text-[#476268]">
                    {p.brand} •{" "}
                    {p.targetSpecies === "DOG"
                      ? "Chó"
                      : p.targetSpecies === "CAT"
                      ? "Mèo"
                      : "Chó & Mèo"}{" "}
                    • <strong className="text-[#0F766E]">{formatVnd(p.price)}</strong> •{" "}
                    <span
                      className={
                        p.stockQuantity > 0
                          ? "font-bold text-emerald-700"
                          : "font-bold text-rose-600"
                      }
                    >
                      {p.stockQuantity > 0
                        ? `Còn hàng tại quầy (${p.stockQuantity} ${p.retailUnit})`
                        : `Tồn kho: ${p.stockQuantity}`}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-[11px] text-[#476268]">{p.shortDescription}</p>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Modal CMS Sản phẩm Shop */}
      {shopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSaveShop}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                {editingShop ? `Sửa bài mô tả Shop — ${editingShop.name}` : "+ Thêm Sản phẩm Shop mới"}
              </h3>
              <button type="button" onClick={() => setShopModalOpen(false)}>
                <X className="h-5 w-5 text-[#476268]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Tên sản phẩm *</label>
                <input
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Thương hiệu</label>
                <input
                  value={shopForm.brand}
                  onChange={(e) => setShopForm({ ...shopForm, brand: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Danh mục</label>
                <input
                  value={shopForm.category}
                  onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Loài phù hợp *</label>
                <select
                  value={shopForm.targetSpecies}
                  onChange={(e) => setShopForm({ ...shopForm, targetSpecies: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                >
                  <option value="BOTH">Cả Chó &amp; Mèo</option>
                  <option value="DOG">Dành cho Chó</option>
                  <option value="CAT">Dành cho Mèo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold">Giá bán tại quầy (VNĐ) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={shopForm.price}
                  onChange={(e) => setShopForm({ ...shopForm, price: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Ảnh sản phẩm (URL hoặc /images/...)</label>
                <input
                  value={shopForm.imageUrl}
                  onChange={(e) => setShopForm({ ...shopForm, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Mô tả tổng quan *</label>
                <textarea
                  required
                  rows={2}
                  value={shopForm.shortDescription}
                  onChange={(e) => setShopForm({ ...shopForm, shortDescription: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Thành phần chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={shopForm.ingredients}
                  onChange={(e) => setShopForm({ ...shopForm, ingredients: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Công dụng nổi bật *</label>
                <textarea
                  required
                  rows={3}
                  value={shopForm.benefits}
                  onChange={(e) => setShopForm({ ...shopForm, benefits: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Đối tượng phù hợp *</label>
                <textarea
                  required
                  rows={2}
                  value={shopForm.suitableFor}
                  onChange={(e) => setShopForm({ ...shopForm, suitableFor: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Hướng dẫn sử dụng *</label>
                <textarea
                  required
                  rows={2}
                  value={shopForm.usageInstructions}
                  onChange={(e) => setShopForm({ ...shopForm, usageInstructions: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Hướng dẫn bảo quản *</label>
                <input
                  required
                  value={shopForm.storageInstructions}
                  onChange={(e) => setShopForm({ ...shopForm, storageInstructions: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={shopForm.isFeaturedOnWeb}
                onChange={(e) => setShopForm({ ...shopForm, isFeaturedOnWeb: e.target.checked })}
                className="h-4 w-4 accent-[#0F766E]"
              />
              Hiển thị nổi bật trong Thư viện Sản phẩm Trang chủ
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShopModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 font-extrabold text-white"
              >
                Lưu bài mô tả sản phẩm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: ĐỘI NGŨ BÁC SĨ */}
      {section === "DOCTORS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            CMS Hồ sơ Đội ngũ Bác sĩ hiển thị trên Trang Quảng cáo
          </h3>
          {doctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#0F766E]/25 bg-[#FAF9F6] p-10 text-center text-xs text-[#476268]">
              <p className="text-sm font-bold text-[#132A2E]">
                Chưa có dữ liệu hồ sơ Bác sĩ
              </p>
              <p className="mt-1">
                Quản lý vui lòng tạo tài khoản vai trò Bác sĩ ở mục Nhân sự để cập nhật hồ sơ hiển thị trên Trang chủ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {doctors.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4 text-xs space-y-2"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.avatarUrl || "/images/doctor-1.jpg"}
                    alt={doc.fullName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-extrabold text-[#132A2E]">{doc.fullName}</p>
                    <p className="text-[11px] text-[#0F766E] font-bold">{doc.title || "Bác sĩ Thú y"}</p>
                    <p className="text-[11px] text-[#476268]">{doc.experienceYears || 0} năm kinh nghiệm</p>
                  </div>
                </div>
                <p className="font-semibold text-[#132A2E]">{doc.specialty}</p>
                <p className="line-clamp-3 text-[#476268]">{doc.bio}</p>
                <button
                  type="button"
                  onClick={() => openEditDoc(doc)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#0F766E] px-3.5 py-2 font-bold text-white hover:bg-[#0B5D56]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Chỉnh sửa hồ sơ Trang chủ
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Sửa Hồ sơ Bác sĩ */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSaveDoc}
            className="w-full max-w-xl rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                Chỉnh sửa hồ sơ Bác sĩ — {editingDoc.fullName}
              </h3>
              <button type="button" onClick={() => setEditingDoc(null)}>
                <X className="h-5 w-5 text-[#476268]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Họ tên hiển thị *</label>
                <input
                  required
                  value={docForm.fullName}
                  onChange={(e) => setDocForm({ ...docForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Chức danh</label>
                <input
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Số năm kinh nghiệm</label>
                <input
                  type="number"
                  min={0}
                  value={docForm.experienceYears}
                  onChange={(e) => setDocForm({ ...docForm, experienceYears: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Chuyên môn chính</label>
                <input
                  value={docForm.specialty}
                  onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Ảnh chân dung URL</label>
                <input
                  value={docForm.avatarUrl}
                  onChange={(e) => setDocForm({ ...docForm, avatarUrl: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold">Tiểu sử &amp; Kinh nghiệm (Bio)</label>
                <textarea
                  rows={3}
                  value={docForm.bio}
                  onChange={(e) => setDocForm({ ...docForm, bio: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 font-extrabold text-white"
              >
                Lưu hồ sơ Bác sĩ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
