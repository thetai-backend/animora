"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
  Stethoscope,
  Sparkles,
  AlertCircle,
  HeartOff,
  RotateCcw,
  Eye,
  X,
  Mail,
} from "lucide-react";
import {
  calculatePetAge,
  formatBookingStatus,
  formatDateVn,
  formatGender,
  formatSpecies,
  formatVnd,
} from "@/lib/format";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
}

interface DoctorOption {
  id: string;
  fullName: string;
  title: string | null;
  specialty: string | null;
}

interface SlotItem {
  time: string;
  available: boolean;
  availableDoctorIds: string[];
  reason?: string;
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
  totalDurationMinutes: number;
  status: string;
  notes: string | null;
  cancelReason: string | null;
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
  heartRate: string | null;
  respiratoryRate: string | null;
  assessment: string;
  plan: string;
  followUpDate: string | null;
  followUpNote: string | null;
  status: string;
  doctor: { fullName: string; title: string | null };
  pet: { id: string; name: string; species: string; breed: string | null } | null;
  addendums: { id: string; authorName: string; content: string; createdAt: string }[];
  invoice: {
    invoiceCode: string;
    totalAmount: number;
    status: string;
    items: {
      id: string;
      itemType: string;
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      dosageInstruction: string | null;
    }[];
  } | null;
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

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function CustomerPortalClient({
  initialProfile,
  services,
  doctors,
}: {
  initialProfile: ProfileData;
  services: ServiceOption[];
  doctors: DoctorOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"PETS" | "BOOKINGS" | "HISTORY" | "PROFILE">("PETS");
  const [profile, setProfile] = useState(initialProfile);
  const [pets, setPets] = useState<PetItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [records, setRecords] = useState<MedicalHistoryItem[]>([]);
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>("ALL");
  const [viewingRecord, setViewingRecord] = useState<MedicalHistoryItem | null>(null);

  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [petForm, setPetForm] = useState(EMPTY_PET);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Member inline booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPetServices, setSelectedPetServices] = useState<Record<string, string[]>>({});
  const [bkDate, setBkDate] = useState(getTodayLocal());
  const [bkDoctorId, setBkDoctorId] = useState("AUTO");
  const [bkTime, setBkTime] = useState("");
  const [bkNotes, setBkNotes] = useState("");
  const [bkSlots, setBkSlots] = useState<SlotItem[]>([]);
  const [bkLunchEnabled, setBkLunchEnabled] = useState(false);
  const [bkLoadingSlots, setBkLoadingSlots] = useState(false);
  const [bkSubmitting, setBkSubmitting] = useState(false);
  const [bkError, setBkError] = useState<string | null>(null);
  const [bkConfirmed, setBkConfirmed] = useState<{
    bookingCode: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    doctorName: string;
    autoAssigned: boolean;
    emailSimulation: string;
  } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
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

  const alivePets = useMemo(() => pets.filter((p) => p.status !== "DECEASED"), [pets]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const { bkTotalDuration, bkLockedDuration, bkTotalPrice } = useMemo(() => {
    let dur = 0;
    let price = 0;
    for (const sids of Object.values(selectedPetServices)) {
      for (const sid of sids) {
        const srv = serviceById.get(sid);
        if (srv) {
          dur += srv.durationMinutes;
          price += srv.price;
        }
      }
    }
    const locked = Math.max(30, Math.ceil((dur || 30) / 30) * 30);
    return { bkTotalDuration: dur, bkLockedDuration: locked, bkTotalPrice: price };
  }, [selectedPetServices, serviceById]);

  useEffect(() => {
    if (!bookingModalOpen) return;
    let active = true;
    setBkLoadingSlots(true);
    setBkTime("");
    fetch(
      `/api/booking/availability?date=${encodeURIComponent(
        bkDate
      )}&duration=${bkLockedDuration}&doctorId=${encodeURIComponent(bkDoctorId)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setBkSlots(data.slots || []);
        setBkLunchEnabled(Boolean(data.lunchBreakEnabled));
      })
      .catch(() => {
        if (active) setBkSlots([]);
      })
      .finally(() => {
        if (active) setBkLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [bookingModalOpen, bkDate, bkLockedDuration, bkDoctorId]);

  const openMemberBookingModal = () => {
    setBkError(null);
    setBkConfirmed(null);
    setBkDate(getTodayLocal());
    setBkDoctorId("AUTO");
    setBkTime("");
    setBkNotes("");
    if (alivePets.length > 0) {
      setSelectedPetServices({
        [alivePets[0].id]: services[0] ? [services[0].id] : [],
      });
    } else {
      setSelectedPetServices({});
    }
    setBookingModalOpen(true);
  };

  const togglePetForBooking = (petId: string) => {
    setSelectedPetServices((prev) => {
      const next = { ...prev };
      if (next[petId]) {
        delete next[petId];
      } else {
        next[petId] = services[0] ? [services[0].id] : [];
      }
      return next;
    });
  };

  const toggleServiceForMemberPet = (petId: string, serviceId: string) => {
    setSelectedPetServices((prev) => {
      const current = prev[petId] || [];
      const exists = current.includes(serviceId);
      return {
        ...prev,
        [petId]: exists
          ? current.filter((id) => id !== serviceId)
          : [...current, serviceId],
      };
    });
  };

  const handleSubmitMemberBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBkError(null);

    const tickedPetIds = Object.keys(selectedPetServices);
    if (tickedPetIds.length === 0) {
      setBkError("Vui lòng tick chọn ít nhất 1 thú cưng để đặt lịch.");
      return;
    }
    for (const pid of tickedPetIds) {
      if (!selectedPetServices[pid] || selectedPetServices[pid].length === 0) {
        const petName = alivePets.find((p) => p.id === pid)?.name || "Thú cưng";
        setBkError(`Vui lòng chọn ít nhất 1 dịch vụ cho bé ${petName}.`);
        return;
      }
    }
    if (!bkTime) {
      setBkError("Vui lòng chọn một khung giờ còn trống.");
      return;
    }

    setBkSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceGuest: false,
          bookingDate: bkDate,
          startTime: bkTime,
          doctorId: bkDoctorId,
          notes: bkNotes,
          pets: tickedPetIds.map((pid) => ({
            petId: pid,
            serviceIds: selectedPetServices[pid],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBkError(data.error || "Không thể đặt lịch. Vui lòng thử lại.");
        return;
      }
      setBkConfirmed({
        bookingCode: data.booking.bookingCode,
        bookingDate: data.booking.bookingDate,
        startTime: data.booking.startTime,
        endTime: data.booking.endTime,
        doctorName: data.booking.doctor?.fullName || "Bác sĩ trực phòng khám",
        autoAssigned: Boolean(data.booking.autoAssigned),
        emailSimulation: data.emailSimulation,
      });
      await loadData();
    } catch {
      setBkError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setBkSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      showToast("Đã cập nhật hồ sơ cá nhân thành công!");
      router.refresh();
    } else {
      showToast(data.error || "Không thể cập nhật hồ sơ cá nhân", "err");
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
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setPetFormOpen(false);
      await loadData();
      showToast(editingPetId ? "Đã cập nhật hồ sơ thú cưng!" : "Đã thêm thú cưng mới vào sổ!");
    } else {
      showToast(data.error || "Không thể lưu hồ sơ thú cưng", "err");
    }
  };

  const handleTogglePetDeceased = async (pet: PetItem) => {
    const nextStatus = pet.status === "DECEASED" ? "ALIVE" : "DECEASED";
    const res = await fetch(`/api/customer/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadData();
      showToast(
        nextStatus === "DECEASED"
          ? `Đã đánh dấu bé ${pet.name} là "Đã mất". Toàn bộ lịch sử khám vẫn được giữ nguyên và hệ thống đã tự động ngắt mọi email nhắc hẹn.`
          : `Đã khôi phục trạng thái chăm sóc cho bé ${pet.name}.`
      );
    } else {
      showToast("Không thể cập nhật trạng thái thú cưng", "err");
    }
  };

  const handleViewPetHistory = (petId: string) => {
    setSelectedPetFilter(petId);
    setTab("HISTORY");
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        cancelReason: "Khách hàng thành viên tự hủy lịch",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      await loadData();
      showToast(data.message || "Đã hủy lịch hẹn!");
    } else {
      showToast(data.error || "Không thể hủy lịch", "err");
    }
  };

  const filteredRecords =
    selectedPetFilter === "ALL"
      ? records
      : records.filter((r) => r.pet?.id === selectedPetFilter);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold ${
            toast.type === "err"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.type === "err" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Thanh tab + nút Đặt lịch trực tiếp ngay trong giao diện khách hàng */}
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

        <button
          type="button"
          onClick={openMemberBookingModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#F97316]/25 transition hover:bg-[#EA580C]"
        >
          <CalendarPlus className="h-4 w-4" />
          + Đặt lịch khám / Spa
        </button>
      </div>

      {/* =====================================================================
          MODAL ĐẶT LỊCH MỚI CHO THÀNH VIÊN (TICK CHỌN 1 HOẶC NHIỀU THÚ CƯNG)
         ===================================================================== */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316]/12 px-3 py-1 text-xs font-bold text-[#F97316]">
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Đặt lịch Thành viên • Không cần đặt cọc
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-[#132A2E]">
                  Đặt lịch Khám bệnh & Spa cho Thú cưng của bạn
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="rounded-xl p-2 text-[#476268] hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bkConfirmed ? (
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8 shrink-0" />
                  <div>
                    <h3 className="text-xl font-extrabold text-[#132A2E]">
                      Đặt lịch thành công! Mã đặt lịch:{" "}
                      <span className="font-mono text-[#0F766E]">
                        {bkConfirmed.bookingCode}
                      </span>
                    </h3>
                    <p className="text-sm text-[#476268]">
                      Ngày {bkConfirmed.bookingDate} • {bkConfirmed.startTime} –{" "}
                      {bkConfirmed.endTime} • BS: {bkConfirmed.doctorName}
                      {bkConfirmed.autoAssigned ? " (Phòng khám tự phân công)" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{bkConfirmed.emailSimulation}</span>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalOpen(false);
                      setTab("BOOKINGS");
                    }}
                    className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Xem trong Lịch hẹn của tôi
                  </button>
                </div>
              </div>
            ) : alivePets.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-bold text-amber-900">
                  Bạn chưa có thú cưng đang chăm sóc nào trong sổ hồ sơ.
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Hãy thêm ít nhất 1 thú cưng mới để đặt lịch bằng tài khoản thành viên.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBookingModalOpen(false);
                    setTab("PETS");
                    openAddPet();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Thêm thú cưng mới ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitMemberBooking} className="mt-5 space-y-6">
                {/* Bước 1: Tick chọn 1 hoặc nhiều thú cưng + dịch vụ */}
                <div>
                  <h3 className="text-sm font-extrabold text-[#132A2E]">
                    1. Tick chọn 1 hoặc nhiều thú cưng & Chọn dịch vụ (giá cố định)
                  </h3>
                  <div className="mt-3 space-y-4">
                    {alivePets.map((pet) => {
                      const isTicked = Boolean(selectedPetServices[pet.id]);
                      const chosenServices = selectedPetServices[pet.id] || [];
                      return (
                        <div
                          key={pet.id}
                          className={`rounded-2xl border p-4 transition ${
                            isTicked
                              ? "border-[#0F766E] bg-[#0F766E]/4"
                              : "border-[#132A2E]/12 bg-[#FAF9F6]"
                          }`}
                        >
                          <label className="flex cursor-pointer items-center justify-between">
                            <span className="inline-flex items-center gap-2.5 text-sm font-extrabold text-[#132A2E]">
                              <input
                                type="checkbox"
                                checked={isTicked}
                                onChange={() => togglePetForBooking(pet.id)}
                                className="h-4 w-4 accent-[#0F766E]"
                              />
                              🐾 {pet.name} ({formatSpecies(pet.species)}
                              {pet.breed ? ` • ${pet.breed}` : ""})
                            </span>
                            {isTicked && (
                              <span className="rounded-full bg-[#0F766E] px-2.5 py-0.5 text-[11px] font-bold text-white">
                                Đã chọn {chosenServices.length} dịch vụ
                              </span>
                            )}
                          </label>

                          {isTicked && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {services.map((srv) => {
                                const checked = chosenServices.includes(srv.id);
                                return (
                                  <button
                                    key={srv.id}
                                    type="button"
                                    onClick={() =>
                                      toggleServiceForMemberPet(pet.id, srv.id)
                                    }
                                    className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                                      checked
                                        ? "border-[#0F766E] bg-white shadow-xs"
                                        : "border-[#132A2E]/10 bg-white/70 hover:border-[#0F766E]/40"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="flex items-center gap-1 font-bold text-[#132A2E]">
                                        {srv.category === "MEDICAL" ? (
                                          <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                                        ) : (
                                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F97316]" />
                                        )}
                                        <span className="truncate">{srv.name}</span>
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-[#476268]">
                                        {srv.durationMinutes}p • {formatVnd(srv.price)}
                                      </p>
                                    </div>
                                    <span
                                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                                        checked
                                          ? "border-[#0F766E] bg-[#0F766E] text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    >
                                      {checked ? "✓" : ""}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bước 2: Chọn ngày, bác sĩ & khung giờ 30 phút */}
                <div>
                  <h3 className="text-sm font-extrabold text-[#132A2E]">
                    2. Chọn Ngày, Bác sĩ & Khung giờ còn trống (tự khóa {bkLockedDuration}{" "}
                    phút liên tiếp)
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold">Ngày hẹn</label>
                      <input
                        type="date"
                        min={getTodayLocal()}
                        value={bkDate}
                        onChange={(e) => setBkDate(e.target.value)}
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold">Bác sĩ phụ trách</label>
                      <select
                        value={bkDoctorId}
                        onChange={(e) => setBkDoctorId(e.target.value)}
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
                      >
                        <option value="AUTO">
                          Phòng khám tự phân công (bác sĩ ít lịch nhất)
                        </option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {bkLunchEnabled && (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800">
                      Phòng khám đang bật giờ nghỉ trưa (12:00 – 13:30), các ô giờ trưa đã được tạm khóa.
                    </p>
                  )}

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#132A2E]">Khung giờ 30 phút:</span>
                      <span className="text-[#476268]">
                        {bkLoadingSlots
                          ? "Đang kiểm tra lịch trực & lịch nghỉ bác sĩ..."
                          : "Bấm chọn khung giờ trống"}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {bkSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          title={slot.reason || "Còn trống"}
                          onClick={() => setBkTime(slot.time)}
                          className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                            bkTime === slot.time
                              ? "border-[#F97316] bg-[#F97316] text-white shadow-sm"
                              : slot.available
                              ? "border-[#0F766E]/25 bg-white text-[#132A2E] hover:border-[#0F766E] hover:bg-[#0F766E]/8"
                              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-bold">
                      Ghi chú triệu chứng / yêu cầu (tùy chọn)
                    </label>
                    <input
                      value={bkNotes}
                      onChange={(e) => setBkNotes(e.target.value)}
                      placeholder="VD: Bé hơi gãi tai 2 ngày nay..."
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {bkError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{bkError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#132A2E]/10 pt-4">
                  <div className="text-xs text-[#476268]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#0F766E]">
                      <Clock className="h-3.5 w-3.5" />
                      {bkLockedDuration} phút ({bkLockedDuration / 30} ô liên tiếp, ước tính{" "}
                      {bkTotalDuration}p)
                    </span>
                    <p className="mt-0.5 text-sm font-extrabold text-[#132A2E]">
                      Tạm tính: <span className="text-[#0F766E]">{formatVnd(bkTotalPrice)}</span>{" "}
                      (Không đặt cọc)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingModalOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={bkSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-[#EA580C] disabled:opacity-60"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      {bkSubmitting ? "Đang xác nhận..." : "Xác nhận Đặt lịch"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL XEM CHI TIẾT BỆNH ÁN S.O.A.P
         ===================================================================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-8 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-4">
              <div>
                <span className="font-mono text-lg font-extrabold text-[#0F766E]">
                  Bệnh án S.O.A.P — {viewingRecord.recordCode}
                </span>
                <p className="mt-1 text-xs text-[#476268]">
                  Thú cưng: <strong>{viewingRecord.pet?.name}</strong> • Ngày khám:{" "}
                  <strong>{formatDateVn(viewingRecord.createdAt)}</strong> • Bác sĩ:{" "}
                  <strong>{viewingRecord.doctor.fullName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="rounded-xl p-2 text-[#476268] hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 rounded-2xl bg-[#FAF9F6] p-4 text-xs">
              <div>
                <p className="text-[#476268]">Cân nặng</p>
                <p className="font-extrabold text-[#132A2E]">
                  {viewingRecord.weightKg ? `${viewingRecord.weightKg} kg` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[#476268]">Nhiệt độ</p>
                <p className="font-extrabold text-[#132A2E]">
                  {viewingRecord.temperatureC ? `${viewingRecord.temperatureC} °C` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[#476268]">Nhịp tim</p>
                <p className="font-extrabold text-[#132A2E]">
                  {viewingRecord.heartRate ? `${viewingRecord.heartRate} lần/ph` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[#476268]">Nhịp thở</p>
                <p className="font-extrabold text-[#132A2E]">
                  {viewingRecord.respiratoryRate
                    ? `${viewingRecord.respiratoryRate} lần/ph`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              <div className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4">
                <p className="text-xs font-extrabold text-[#0F766E]">
                  S (Subjective) — Triệu chứng ghi nhận
                </p>
                <p className="mt-1">{viewingRecord.subjective || "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4">
                <p className="text-xs font-extrabold text-[#0F766E]">
                  O (Objective) — Khám lâm sàng
                </p>
                <p className="mt-1">{viewingRecord.objective || "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4">
                <p className="text-xs font-extrabold text-[#0F766E]">
                  A (Assessment) — Chẩn đoán
                </p>
                <p className="mt-1 font-bold">{viewingRecord.assessment || "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4">
                <p className="text-xs font-extrabold text-[#0F766E]">
                  P (Plan) — Phác đồ điều trị & Lời dặn
                </p>
                <p className="mt-1 whitespace-pre-line">{viewingRecord.plan || "—"}</p>
              </div>
            </div>

            {viewingRecord.followUpDate && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-extrabold">
                  📅 Ngày hẹn tái khám / tiêm nhắc: {formatDateVn(viewingRecord.followUpDate)}
                </p>
                {viewingRecord.followUpNote && (
                  <p className="mt-1">{viewingRecord.followUpNote}</p>
                )}
              </div>
            )}

            {viewingRecord.invoice && viewingRecord.invoice.items?.length > 0 && (
              <div className="rounded-2xl border border-[#0F766E]/15 bg-white p-4">
                <p className="text-xs font-extrabold text-[#132A2E]">
                  Dịch vụ & Đơn thuốc kèm theo ({viewingRecord.invoice.invoiceCode} —{" "}
                  {formatVnd(viewingRecord.invoice.totalAmount)})
                </p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {viewingRecord.invoice.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <div>
                        <span className="font-bold">{it.name}</span> ({it.quantity} {it.unit})
                        {it.dosageInstruction && (
                          <p className="text-[11px] text-[#476268]">
                            Hướng dẫn: {it.dosageInstruction}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-[#0F766E]">
                        {formatVnd(it.totalPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {viewingRecord.addendums.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs font-extrabold text-amber-900">
                  Ghi chú bổ sung từ bác sĩ:
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  {viewingRecord.addendums.map((ad) => (
                    <div key={ad.id} className="rounded-xl bg-white p-3">
                      <p className="font-bold text-[#0F766E]">
                        {ad.authorName} • {new Date(ad.createdAt).toLocaleString("vi-VN")}
                      </p>
                      <p className="mt-1">{ad.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              + Thêm thú cưng mới
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
                    placeholder="VD: Bơ, Mochi, Đậu..."
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
                  <label className="mb-1 block text-xs font-bold">
                    Ngày sinh{" "}
                    {petForm.birthDate && calculatePetAge(petForm.birthDate) && (
                      <span className="font-normal text-[#0F766E]">
                        ({calculatePetAge(petForm.birthDate)})
                      </span>
                    )}
                  </label>
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
                    placeholder="VD: Vàng trắng, lông dày 2 lớp"
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Số Microchip</label>
                  <input
                    value={petForm.microchipCode}
                    onChange={(e) =>
                      setPetForm({ ...petForm, microchipCode: e.target.value })
                    }
                    placeholder="VD: 90011800..."
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

          {pets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#0F766E]/25 bg-white p-12 text-center">
              <p className="text-base font-bold text-[#132A2E]">
                Bạn chưa thêm thú cưng nào vào sổ hồ sơ.
              </p>
              <button
                onClick={openAddPet}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                + Thêm thú cưng đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {pets.map((pet) => {
                const ageText = calculatePetAge(pet.birthDate);
                const petRecordsCount = records.filter((r) => r.pet?.id === pet.id).length;
                return (
                  <div
                    key={pet.id}
                    className={`rounded-3xl border p-6 shadow-sm ${
                      pet.status === "DECEASED"
                        ? "border-slate-300 bg-slate-50/80"
                        : "border-[#0F766E]/15 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-extrabold text-[#132A2E]">{pet.name}</h3>
                          <span className="rounded-full bg-[#0F766E]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F766E]">
                            {formatSpecies(pet.species)}
                          </span>
                          {pet.status === "DECEASED" && (
                            <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-white">
                              Đã mất • Đã ngắt nhắc hẹn
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#476268]">
                          {pet.breed || "Chưa rõ giống"} • {formatGender(pet.gender)} •{" "}
                          {pet.isNeutered ? "Đã triệt sản" : "Chưa triệt sản"} • Sinh:{" "}
                          {formatDateVn(pet.birthDate)}
                          {ageText ? ` (${ageText})` : ""}
                        </p>
                      </div>
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

                    {/* 3 nút bắt buộc trên mỗi thẻ thú cưng: Chỉnh sửa, Xem lịch sử bệnh án, Đánh dấu Đã mất */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#132A2E]/8 pt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPet(pet)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/25 bg-white px-3 py-1.5 text-xs font-bold text-[#0F766E] transition hover:bg-[#0F766E]/8"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewPetHistory(pet.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E]/10 px-3 py-1.5 text-xs font-bold text-[#0F766E] transition hover:bg-[#0F766E] hover:text-white"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Xem lịch sử bệnh án ({petRecordsCount})
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePetDeceased(pet)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          pet.status === "DECEASED"
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {pet.status === "DECEASED" ? (
                          <>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Khôi phục
                          </>
                        ) : (
                          <>
                            <HeartOff className="h-3.5 w-3.5" />
                            Đánh dấu Đã mất
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LỊCH HẸN CỦA TÔI */}
      {tab === "BOOKINGS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                Lịch hẹn khám & Spa của tôi
              </h2>
              <p className="text-xs text-[#476268]">
                Bạn có thể tự hủy lịch bất cứ lúc nào miễn chưa vào phòng khám (không giới hạn thời gian).
              </p>
            </div>
            <button
              type="button"
              onClick={openMemberBookingModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#EA580C]"
            >
              <Plus className="h-4 w-4" />
              Đặt lịch mới
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {bookings.length === 0 && (
              <p className="text-sm text-[#476268]">Bạn chưa có lịch hẹn nào.</p>
            )}
            {bookings.map((b) => {
              const st = formatBookingStatus(b.status);
              const totalEstimate = b.pets.reduce(
                (acc, p) => acc + p.services.reduce((s, srv) => s + srv.price, 0),
                0
              );
              return (
                <div
                  key={b.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-base font-extrabold text-[#0F766E]">
                        {b.bookingCode}
                      </span>
                      <span className="rounded-full border border-[#132A2E]/10 bg-white px-2.5 py-0.5 text-xs font-bold text-[#132A2E]">
                        {b.bookingDate} • {b.startTime} – {b.endTime} ({b.totalDurationMinutes}p)
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.colorClass}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#476268]">
                      Bác sĩ: <strong className="text-[#132A2E]">{b.doctor?.fullName || "Phòng khám phân công"}</strong>{" "}
                      • Tạm tính: <strong className="text-[#0F766E]">{formatVnd(totalEstimate)}</strong>
                    </p>
                    <div className="space-y-1 pt-1 text-xs text-[#132A2E]">
                      {b.pets.map((p) => (
                        <p key={p.id}>
                          🐾 <strong>{p.pet?.name || "Thú cưng"}</strong>:{" "}
                          {p.services.map((s) => s.serviceName).join(", ")}
                        </p>
                      ))}
                    </div>
                    {b.status === "CANCELLED" && b.cancelReason && (
                      <p className="text-xs text-rose-700">Lý do hủy: {b.cancelReason}</p>
                    )}
                  </div>

                  {(b.status === "CONFIRMED" || b.status === "CHECKED_IN") && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <XCircle className="h-4 w-4" />
                      Tự hủy lịch
                    </button>
                  )}
                </div>
              );
            })}
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
                  <div className="flex items-center gap-2">
                    {rec.invoice && (
                      <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#132A2E]">
                        Hóa đơn {rec.invoice.invoiceCode}: {formatVnd(rec.invoice.totalAmount)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingRecord(rec)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0B5D56]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem chi tiết S.O.A.P
                    </button>
                  </div>
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
                    {rec.followUpNote ? ` — ${rec.followUpNote}` : ""}
                  </p>
                )}

                {rec.addendums.length > 0 && (
                  <div className="mt-3 border-t border-[#132A2E]/10 pt-3">
                    <p className="text-xs font-bold text-[#476268]">
                      Ghi chú bổ sung từ bác sĩ:
                    </p>
                    {rec.addendums.map((ad) => (
                      <p key={ad.id} className="mt-1 text-xs text-[#132A2E]">
                        • [{new Date(ad.createdAt).toLocaleString("vi-VN")} - {ad.authorName}]:{" "}
                        {ad.content}
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
