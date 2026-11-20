"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  PawPrint,
  Calendar,
  FileText,
  Plus,
  Edit3,
  Save,
  XCircle,
  CheckCircle2,
  CalendarPlus,
} from "lucide-react";
import { formatDateVn, formatGender, formatSpecies, formatVnd } from "@/lib/format";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
}

interface PetItem {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  gender: string | null;
  isNeutered: boolean;
  coatDescription: string | null;
  microchipCode: string | null;
  allergies: string | null;
  vaccinationHistory: string | null;
  dewormingHistory: string | null;
  status: string;
}

interface BookingItem {
  id: string;
  bookingCode: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor: { fullName: string } | null;
  pets: {
    id: string;
    pet: { name: string; species: string } | null;
    services: { id: string; serviceName: string; price: number }[];
  }[];
}

interface MedicalHistoryItem {
  id: string;
  recordCode: string;
  createdAt: string;
  subjective: string;
  objective: string;
  weightKg: string | null;
  temperatureC: string | null;
  assessment: string;
  plan: string;
  followUpDate: string | null;
  status: string;
  doctor: { fullName: string };
  pet: { id: string; name: string; species: string } | null;
  addendums: { id: string; authorName: string; content: string; createdAt: string }[];
  invoice: { invoiceCode: string; totalAmount: number; status: string } | null;
}

const EMPTY_PET = {
  name: "",
  species: "DOG",
  breed: "",
  birthDate: "",
  gender: "MALE",
  isNeutered: false,
  coatDescription: "",
  microchipCode: "",
  allergies: "",
  vaccinationHistory: "",
  dewormingHistory: "",
  status: "ALIVE",
};

export function CustomerPortalClient({
  initialProfile,
}: {
  initialProfile: ProfileData;
}) {
  const [tab, setTab] = useState<"PETS" | "BOOKINGS" | "HISTORY" | "PROFILE">("PETS");
  const [profile, setProfile] = useState(initialProfile);
  const [pets, setPets] = useState<PetItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [records, setRecords] = useState<MedicalHistoryItem[]>([]);
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>("ALL");

  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [petForm, setPetForm] = useState(EMPTY_PET);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    const [petsRes, histRes] = await Promise.all([
      fetch("/api/customer/pets").then((r) => r.json()),
      fetch("/api/customer/history").then((r) => r.json()),
    ]);
    setPets(petsRes.pets || []);
    setBookings(histRes.bookings || []);
    setRecords(histRes.medicalRecords || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (res.ok) {
      showToast("Đã cập nhật hồ sơ cá nhân thành công!");
    }
  };

  const openAddPet = () => {
    setEditingPetId(null);
    setPetForm(EMPTY_PET);
    setPetFormOpen(true);
  };

  const openEditPet = (pet: PetItem) => {
    setEditingPetId(pet.id);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : "",
      gender: pet.gender || "MALE",
      isNeutered: pet.isNeutered,
      coatDescription: pet.coatDescription || "",
      microchipCode: pet.microchipCode || "",
      allergies: pet.allergies || "",
      vaccinationHistory: pet.vaccinationHistory || "",
      dewormingHistory: pet.dewormingHistory || "",
      status: pet.status,
    });
    setPetFormOpen(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingPetId
      ? `/api/customer/pets/${editingPetId}`
      : "/api/customer/pets";
    const method = editingPetId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(petForm),
    });
    setSaving(false);
    if (res.ok) {
      setPetFormOpen(false);
      await loadData();
      showToast(editingPetId ? "Đã cập nhật hồ sơ thú cưng!" : "Đã thêm thú cưng mới vào sổ!");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (res.ok) {
      await loadData();
      showToast(data.message || "Đã hủy lịch hẹn!");
    } else {
      showToast(data.error || "Không thể hủy lịch");
    }
  };

  const filteredRecords =
    selectedPetFilter === "ALL"
      ? records
      : records.filter((r) => r.pet?.id === selectedPetFilter);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Thanh tab + nút Đặt lịch nhanh */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
          {[
            { key: "PETS", label: `Danh sách Thú cưng (${pets.length})`, icon: PawPrint },
            { key: "BOOKINGS", label: `Lịch hẹn của tôi (${bookings.length})`, icon: Calendar },
            { key: "HISTORY", label: `Lịch sử khám bệnh (${records.length})`, icon: FileText },
            { key: "PROFILE", label: "Hồ sơ cá nhân", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  tab === item.key
                    ? "bg-[#0F766E] text-white shadow-sm"
                    : "text-[#476268] hover:text-[#132A2E]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <Link
          href="/dat-lich"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#F97316]/25 transition hover:bg-[#EA580C]"
        >
          <CalendarPlus className="h-4 w-4" />
          Đặt lịch khám / Spa mới
        </Link>
      </div>

      {/* TAB 1: DANH SÁCH THÚ CƯNG */}
      {tab === "PETS" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#132A2E]">
              Hồ sơ Thú cưng chuẩn Thú y
            </h2>
            <button
              onClick={openAddPet}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0B5D56]"
            >
              <Plus className="h-4 w-4" />
              Thêm thú cưng mới
            </button>
          </div>

          {petFormOpen && (
            <form
              onSubmit={handleSavePet}
              className="rounded-3xl border border-[#0F766E]/25 bg-white p-7 shadow-md"
            >
              <h3 className="text-lg font-extrabold text-[#0F766E]">
                {editingPetId ? "Cập nhật hồ sơ thú cưng" : "Thêm thú cưng mới"}
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold">Tên thú cưng *</label>
                  <input
                    required
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Loài *</label>
                  <select
                    value={petForm.species}
                    onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  >
                    <option value="DOG">Chó</option>
                    <option value="CAT">Mèo</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Giống</label>
                  <input
                    value={petForm.breed}
                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                    placeholder="VD: Corgi, Mèo Anh lông ngắn..."
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Ngày sinh</label>
                  <input
                    type="date"
                    value={petForm.birthDate}
                    onChange={(e) => setPetForm({ ...petForm, birthDate: e.target.value })}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Giới tính</label>
                  <select
                    value={petForm.gender}
                    onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  >
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Tình trạng triệt sản</label>
                  <select
                    value={petForm.isNeutered ? "YES" : "NO"}
                    onChange={(e) =>
                      setPetForm({ ...petForm, isNeutered: e.target.value === "YES" })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  >
                    <option value="NO">Chưa triệt sản</option>
                    <option value="YES">Đã triệt sản</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Màu lông / Đặc điểm</label>
                  <input
                    value={petForm.coatDescription}
                    onChange={(e) =>
                      setPetForm({ ...petForm, coatDescription: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Mã Microchip</label>
                  <input
                    value={petForm.microchipCode}
                    onChange={(e) =>
                      setPetForm({ ...petForm, microchipCode: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Trạng thái</label>
                  <select
                    value={petForm.status}
                    onChange={(e) => setPetForm({ ...petForm, status: e.target.value })}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  >
                    <option value="ALIVE">Đang chăm sóc</option>
                    <option value="DECEASED">Đã mất (tự dừng email nhắc lịch)</option>
                  </select>
                </div>
                <div className="col-span-3 grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Tiền sử dị ứng</label>
                    <textarea
                      rows={2}
                      value={petForm.allergies}
                      onChange={(e) => setPetForm({ ...petForm, allergies: e.target.value })}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Lịch sử tiêm phòng</label>
                    <textarea
                      rows={2}
                      value={petForm.vaccinationHistory}
                      onChange={(e) =>
                        setPetForm({ ...petForm, vaccinationHistory: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Lịch sử tẩy giun</label>
                    <textarea
                      rows={2}
                      value={petForm.dewormingHistory}
                      onChange={(e) =>
                        setPetForm({ ...petForm, dewormingHistory: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPetFormOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-sm font-bold text-white"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Lưu hồ sơ thú cưng"}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 gap-6">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-[#132A2E]">{pet.name}</h3>
                      <span className="rounded-full bg-[#0F766E]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F766E]">
                        {formatSpecies(pet.species)}
                      </span>
                      {pet.status === "DECEASED" && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          Đã mất
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#476268]">
                      {pet.breed || "Chưa rõ giống"} • {formatGender(pet.gender)} •{" "}
                      {pet.isNeutered ? "Đã triệt sản" : "Chưa triệt sản"} • Sinh:{" "}
                      {formatDateVn(pet.birthDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditPet(pet)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#0F766E]/25 px-3 py-1.5 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/8"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Sửa
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#FAF9F6] p-4 text-xs">
                  <div>
                    <span className="font-bold text-[#476268]">Màu lông:</span>{" "}
                    {pet.coatDescription || "—"}
                  </div>
                  <div>
                    <span className="font-bold text-[#476268]">Microchip:</span>{" "}
                    <span className="font-mono">{pet.microchipCode || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-rose-700">Tiền sử dị ứng:</span>{" "}
                    {pet.allergies || "Không ghi nhận"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-[#0F766E]">Tiêm phòng:</span>{" "}
                    {pet.vaccinationHistory || "Chưa cập nhật"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-[#0F766E]">Tẩy giun:</span>{" "}
                    {pet.dewormingHistory || "Chưa cập nhật"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH HẸN CỦA TÔI */}
      {tab === "BOOKINGS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#132A2E]">
            Lịch hẹn khám & Spa đã đặt
          </h2>
          <div className="mt-5 space-y-4">
            {bookings.length === 0 && (
              <p className="text-sm text-[#476268]">Bạn chưa có lịch hẹn nào.</p>
            )}
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-5"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-extrabold text-[#0F766E]">
                      {b.bookingCode}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#132A2E] border border-[#132A2E]/10">
                      {b.bookingDate} • {b.startTime} – {b.endTime}
                    </span>
                    <span className="text-xs font-bold text-[#476268]">
                      Trạng thái: {b.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#476268]">
                    Bác sĩ: <strong>{b.doctor?.fullName || "Phòng khám phân công"}</strong> •
                    Thú cưng:{" "}
                    <strong>
                      {b.pets.map((p) => p.pet?.name || "Thú cưng").join(", ")}
                    </strong>
                  </p>
                </div>

                {(b.status === "CONFIRMED" || b.status === "CHECKED_IN") && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Hủy lịch
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LỊCH SỬ KHÁM BỆNH S.O.A.P */}
      {tab === "HISTORY" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#132A2E]">
              Lịch sử Bệnh án S.O.A.P của từng bé
            </h2>
            <select
              value={selectedPetFilter}
              onChange={(e) => setSelectedPetFilter(e.target.value)}
              className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2 text-sm font-semibold"
            >
              <option value="ALL">Tất cả thú cưng</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  Chỉ xem bé {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {filteredRecords.length === 0 && (
              <p className="text-sm text-[#476268]">Chưa có hồ sơ khám bệnh nào.</p>
            )}
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-[#0F766E]/15 bg-[#FAF9F6] p-6"
              >
                <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-3">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                      {rec.recordCode}
                    </span>{" "}
                    • <strong>{rec.pet?.name}</strong> •{" "}
                    <span className="text-xs text-[#476268]">
                      Khám ngày {formatDateVn(rec.createdAt)} bởi {rec.doctor.fullName}
                    </span>
                  </div>
                  {rec.invoice && (
                    <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#132A2E]">
                      Hóa đơn {rec.invoice.invoiceCode}: {formatVnd(rec.invoice.totalAmount)}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div>
                    <p className="font-bold text-[#0F766E]">S — Triệu chứng:</p>
                    <p className="mt-0.5 text-[#132A2E]">{rec.subjective || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F766E]">O — Lâm sàng:</p>
                    <p className="mt-0.5 text-[#132A2E]">
                      {rec.weightKg ? `Cân nặng: ${rec.weightKg}kg • ` : ""}
                      {rec.temperatureC ? `Nhiệt độ: ${rec.temperatureC}°C • ` : ""}
                      {rec.objective || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F766E]">A — Chẩn đoán:</p>
                    <p className="mt-0.5 font-semibold text-[#132A2E]">
                      {rec.assessment || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F766E]">P — Phác đồ & Đơn thuốc:</p>
                    <p className="mt-0.5 whitespace-pre-line text-[#132A2E]">
                      {rec.plan || "—"}
                    </p>
                  </div>
                </div>

                {rec.followUpDate && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800">
                    📅 Ngày hẹn tái khám / tiêm nhắc: {formatDateVn(rec.followUpDate)}
                  </p>
                )}

                {rec.addendums.length > 0 && (
                  <div className="mt-3 border-t border-[#132A2E]/10 pt-3">
                    <p className="text-xs font-bold text-[#476268]">Ghi chú bổ sung từ bác sĩ:</p>
                    {rec.addendums.map((ad) => (
                      <p key={ad.id} className="mt-1 text-xs text-[#132A2E]">
                        • [{formatDateVn(ad.createdAt)} - {ad.authorName}]: {ad.content}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HỒ SƠ CÁ NHÂN */}
      {tab === "PROFILE" && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-2xl rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm"
        >
          <h2 className="text-xl font-extrabold text-[#132A2E]">
            Thông tin Chủ nuôi
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold">Email đăng nhập</label>
              <input
                disabled
                value={profile.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Họ và tên *</label>
              <input
                required
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Số điện thoại</label>
              <input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Địa chỉ liên hệ</label>
              <input
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-bold text-white hover:bg-[#0B5D56]"
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      )}
    </div>
  );
}
