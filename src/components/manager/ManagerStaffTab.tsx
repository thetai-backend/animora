"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Edit3,
  Power,
  X,
  ShieldCheck,
} from "lucide-react";

export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  title: string | null;
  specialty: string | null;
  experienceYears: number | null;
  bio: string | null;
  workStatus: string;
  _count: {
    doctorMedicalRecords: number;
    cashierInvoices: number;
    doctorInvoices: number;
  };
}

const ROLE_VI: Record<string, { label: string; cls: string }> = {
  MANAGER: { label: "Quản lý", cls: "bg-[#0F766E] text-white" },
  RECEPTIONIST: { label: "Lễ tân", cls: "bg-[#F97316] text-white" },
  DOCTOR: { label: "Bác sĩ", cls: "bg-[#0D9488] text-white" },
};

export function ManagerStaffTab({
  staff,
  onReload,
  notify,
}: {
  staff: StaffMember[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "RECEPTIONIST",
    title: "",
    specialty: "",
    experienceYears: "",
    bio: "",
    avatarUrl: "/images/doctor-1.jpg",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "RECEPTIONIST",
      title: "",
      specialty: "",
      experienceYears: "",
      bio: "",
      avatarUrl: "/images/doctor-1.jpg",
    });
    setModalOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({
      fullName: s.fullName,
      email: s.email,
      password: "",
      phone: s.phone || "",
      role: s.role,
      title: s.title || "",
      specialty: s.specialty || "",
      experienceYears: s.experienceYears !== null ? String(s.experienceYears) : "",
      bio: s.bio || "",
      avatarUrl: s.avatarUrl || "/images/doctor-1.jpg",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const res = await fetch(`/api/manager/staff/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          title: form.title,
          specialty: form.specialty,
          experienceYears: form.experienceYears,
          bio: form.bio,
          avatarUrl: form.avatarUrl,
          ...(form.password.trim() ? { newPassword: form.password.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Không thể cập nhật nhân sự", "err");
        return;
      }
      notify(data.message);
      setModalOpen(false);
      await onReload();
    } else {
      const res = await fetch("/api/manager/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Không thể tạo tài khoản nhân viên", "err");
        return;
      }
      notify(data.message);
      setModalOpen(false);
      await onReload();
    }
  };

  const handleToggleActive = async (s: StaffMember) => {
    const res = await fetch(`/api/manager/staff/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể đổi trạng thái nhân sự", "err");
    } else {
      notify(data.message);
      await onReload();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-[#132A2E]">
            Quản lý Tài khoản Nhân sự ({staff.length})
          </h3>
          <p className="text-xs text-[#476268]">
            Xóa mềm (Ngừng hoạt động) sẽ <strong>chặn đăng nhập ngay lập tức</strong> nhưng giữ nguyên 100% bệnh án S.O.A.P và hóa đơn lịch sử.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#EA580C]"
        >
          <UserPlus className="h-4 w-4" />
          + Tạo tài khoản nhân viên mới
        </button>
      </div>

      {/* Modal Tạo / Sửa nhân viên */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
              <h3 className="text-lg font-extrabold text-[#132A2E]">
                {editing ? `Sửa thông tin & phân quyền — ${editing.fullName}` : "+ Tạo tài khoản nhân viên mới"}
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
              <div>
                <label className="mb-1 block font-bold">Họ và tên *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="VD: BS. Nguyễn Thanh Tùng"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Vai trò phân quyền *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm font-bold"
                >
                  <option value="RECEPTIONIST">Lễ tân (Điều phối &amp; POS)</option>
                  <option value="DOCTOR">Bác sĩ Thú y (Khám S.O.A.P)</option>
                  <option value="MANAGER">Quản lý (Toàn quyền)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editing)}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ten@animora.vn"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">
                  {editing ? "Đổi mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu khởi tạo (>= 6 ký tự) *"}
                </label>
                <input
                  type="password"
                  required={!editing}
                  minLength={editing ? undefined : 6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Chức danh</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Bác sĩ Chuyên khoa Nội"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                />
              </div>

              {form.role === "DOCTOR" && (
                <>
                  <div>
                    <label className="mb-1 block font-bold">Chuyên môn (hiện Trang chủ)</label>
                    <input
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      placeholder="VD: Nội khoa & Siêu âm"
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold">Số năm kinh nghiệm</label>
                    <input
                      type="number"
                      min={0}
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block font-bold">Ảnh chân dung URL</label>
                    <input
                      value={form.avatarUrl}
                      onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block font-bold">Giới thiệu chuyên môn (Bio)</label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-2 font-extrabold text-white hover:bg-[#0B5D56]"
              >
                {editing ? "Lưu thay đổi" : "Tạo tài khoản nhân viên"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách nhân sự */}
      <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
              <th className="py-2.5">Nhân sự</th>
              <th className="py-2.5">Vai trò</th>
              <th className="py-2.5">Liên hệ / Chuyên môn</th>
              <th className="py-2.5 text-center">Dữ liệu lịch sử bảo toàn</th>
              <th className="py-2.5 text-center">Trạng thái</th>
              <th className="py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#132A2E]/8">
            {staff.map((s) => {
              const meta = ROLE_VI[s.role] || { label: s.role, cls: "bg-slate-200 text-slate-800" };
              return (
                <tr key={s.id} className={!s.isActive ? "bg-slate-100/70 opacity-80" : "hover:bg-[#FAF9F6]"}>
                  <td className="py-3.5 pr-3">
                    <p className="font-extrabold text-[#132A2E]">{s.fullName}</p>
                    <p className="text-[11px] text-[#476268]">{s.title || "Nhân sự phòng khám"}</p>
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-mono text-[11px] font-bold">{s.email}</p>
                    <p className="text-[11px] text-[#476268]">
                      {s.phone || "—"} {s.specialty ? `• ${s.specialty}` : ""}
                    </p>
                  </td>
                  <td className="py-3.5 text-center text-[11px] text-[#476268]">
                    {s._count.doctorMedicalRecords} bệnh án •{" "}
                    {s._count.cashierInvoices + s._count.doctorInvoices} hóa đơn
                  </td>
                  <td className="py-3.5 text-center">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-extrabold text-emerald-800">
                        <ShieldCheck className="h-3 w-3" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-extrabold text-rose-700">
                        Ngừng hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold ${
                          s.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {s.isActive ? "Ngừng hoạt động" : "Kích hoạt lại"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
