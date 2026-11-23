"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  UserCheck,
  UserRound,
  Sparkles,
  Stethoscope,
  AlertCircle,
  Mail,
} from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { formatSpecies, formatVnd } from "@/lib/format";

interface PetOption {
  id: string;
  name: string;
  species: string;
  breed: string | null;
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
  workStatus: string;
}

interface SlotItem {
  time: string;
  available: boolean;
  availableDoctorIds: string[];
  reason?: string;
}

interface PetDraft {
  key: string;
  petId?: string;
  guestPetName: string;
  guestPetSpecies: string;
  guestPetBreed: string;
  guestPetNote: string;
  serviceIds: string[];
}

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function BookingClient({
  session,
  customerInfo,
  customerPets,
  services,
  doctors,
  initialServiceId,
}: {
  session: SessionPayload | null;
  customerInfo: { fullName: string; phone: string | null; email: string } | null;
  customerPets: PetOption[];
  services: ServiceOption[];
  doctors: DoctorOption[];
  initialServiceId?: string;
}) {
  const defaultServiceId = initialServiceId || services[0]?.id;
  const [mode, setMode] = useState<"MEMBER" | "GUEST">(
    session && customerPets.length > 0 ? "MEMBER" : "GUEST"
  );
  const [bookingDate, setBookingDate] = useState(getTodayLocal());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("AUTO");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Thông tin khách vãng lai (Rule 3: không lưu vào bảng User/Pet)
  const [guestName, setGuestName] = useState(customerInfo?.fullName || "");
  const [guestPhone, setGuestPhone] = useState(customerInfo?.phone || "");
  const [guestEmail, setGuestEmail] = useState(customerInfo?.email || "");

  // Danh sách thú cưng đặt trong cùng 1 phiếu (cho phép nhiều thú cưng)
  const [petDrafts, setPetDrafts] = useState<PetDraft[]>(() => {
    if (session && customerPets.length > 0) {
      return [
        {
          key: "pet-1",
          petId: customerPets[0].id,
          guestPetName: "",
          guestPetSpecies: "DOG",
          guestPetBreed: "",
          guestPetNote: "",
          serviceIds: defaultServiceId ? [defaultServiceId] : [],
        },
      ];
    }
    return [
      {
        key: "pet-1",
        guestPetName: "",
        guestPetSpecies: "DOG",
        guestPetBreed: "",
        guestPetNote: "",
        serviceIds: defaultServiceId ? [defaultServiceId] : [],
      },
    ];
  });

  const handleSwitchMode = (nextMode: "MEMBER" | "GUEST") => {
    setMode(nextMode);
    if (nextMode === "MEMBER" && customerPets.length > 0) {
      setPetDrafts((prev) =>
        prev.map((d, idx) => ({
          ...d,
          petId: d.petId || customerPets[idx % customerPets.length].id,
        }))
      );
    }
  };

  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    bookingCode: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    doctorName: string;
    autoAssigned: boolean;
    emailSimulation: string;
    isGuest: boolean;
  } | null>(null);

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services]
  );

  // Tổng thời lượng ước tính cộng dồn để khóa kín các ô 30 phút liên tiếp
  const { totalDuration, lockedDuration, totalEstimatedPrice } = useMemo(() => {
    let dur = 0;
    let price = 0;
    for (const p of petDrafts) {
      for (const sid of p.serviceIds) {
        const srv = serviceById.get(sid);
        if (srv) {
          dur += srv.durationMinutes;
          price += srv.price;
        }
      }
    }
    const locked = Math.max(30, Math.ceil((dur || 30) / 30) * 30);
    return {
      totalDuration: dur,
      lockedDuration: locked,
      totalEstimatedPrice: price,
    };
  }, [petDrafts, serviceById]);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(
      `/api/booking/availability?date=${encodeURIComponent(
        bookingDate
      )}&duration=${lockedDuration}&doctorId=${encodeURIComponent(selectedDoctorId)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setSlots(data.slots || []);
        setLunchEnabled(Boolean(data.lunchBreakEnabled));
      })
      .catch(() => {
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [bookingDate, lockedDuration, selectedDoctorId]);

  const addPetRow = () => {
    const nextIdx = petDrafts.length + 1;
    const unusedPet = customerPets.find(
      (cp) => !petDrafts.some((d) => d.petId === cp.id)
    );
    setPetDrafts((prev) => [
      ...prev,
      {
        key: `pet-${Date.now()}-${nextIdx}`,
        petId: mode === "MEMBER" ? unusedPet?.id || customerPets[0]?.id : undefined,
        guestPetName: "",
        guestPetSpecies: "CAT",
        guestPetBreed: "",
        guestPetNote: "",
        serviceIds: services[0] ? [services[0].id] : [],
      },
    ]);
  };

  const removePetRow = (key: string) => {
    if (petDrafts.length <= 1) return;
    setPetDrafts((prev) => prev.filter((p) => p.key !== key));
  };

  const toggleServiceForPet = (petKey: string, serviceId: string) => {
    setPetDrafts((prev) =>
      prev.map((p) => {
        if (p.key !== petKey) return p;
        const exists = p.serviceIds.includes(serviceId);
        return {
          ...p,
          serviceIds: exists
            ? p.serviceIds.filter((id) => id !== serviceId)
            : [...p.serviceIds, serviceId],
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTime) {
      setError("Vui lòng chọn một khung giờ còn trống.");
      return;
    }

    if (mode === "GUEST" && (!guestName.trim() || !guestPhone.trim())) {
      setError("Vui lòng nhập Họ tên và Số điện thoại liên hệ.");
      return;
    }

    for (const p of petDrafts) {
      if (p.serviceIds.length === 0) {
        setError("Mỗi thú cưng cần chọn ít nhất 1 dịch vụ.");
        return;
      }
      if (mode === "GUEST" && !p.guestPetName.trim()) {
        setError("Vui lòng nhập tên thú cưng cho từng bé.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceGuest: mode === "GUEST",
          bookingDate,
          startTime: selectedTime,
          doctorId: selectedDoctorId,
          notes,
          guestName,
          guestPhone,
          guestEmail,
          pets: petDrafts.map((p) => ({
            petId: mode === "MEMBER" ? p.petId : undefined,
            guestPetName: mode === "GUEST" ? p.guestPetName : undefined,
            guestPetSpecies: mode === "GUEST" ? p.guestPetSpecies : undefined,
            guestPetBreed: mode === "GUEST" ? p.guestPetBreed : undefined,
            guestPetNote: mode === "GUEST" ? p.guestPetNote : undefined,
            serviceIds: p.serviceIds,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể đặt lịch. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }

      setConfirmed({
        bookingCode: data.booking.bookingCode,
        bookingDate: data.booking.bookingDate,
        startTime: data.booking.startTime,
        endTime: data.booking.endTime,
        doctorName: data.booking.doctor?.fullName || "Bác sĩ trực phòng khám",
        autoAssigned: Boolean(data.booking.autoAssigned),
        emailSimulation: data.emailSimulation,
        isGuest: Boolean(data.booking.isGuest),
      });
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#0F766E]/20 bg-white p-10 shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-[#132A2E]">
          Đặt lịch thành công! (Không cần đặt cọc)
        </h1>
        <p className="mt-2 text-sm text-[#476268]">
          Phòng khám Thú y ANIMORA đã khóa kín khung giờ liên tiếp cho thú cưng của bạn.
        </p>

        <div className="mt-6 rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-6">
          <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#476268]">
              Mã đặt lịch của bạn
            </span>
            <span className="rounded-xl bg-[#0F766E] px-4 py-1.5 font-mono text-xl font-extrabold text-white">
              {confirmed.bookingCode}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#476268]">Ngày & Khung giờ</p>
              <p className="font-bold text-[#132A2E]">
                {confirmed.bookingDate} • {confirmed.startTime} – {confirmed.endTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#476268]">Bác sĩ phụ trách</p>
              <p className="font-bold text-[#0F766E]">
                {confirmed.doctorName}{" "}
                {confirmed.autoAssigned && (
                  <span className="text-xs font-normal text-[#476268]">
                    (Tự động phân công)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-bold">Thông báo xác nhận Email (Mô phỏng)</p>
            <p className="mt-0.5 text-xs leading-relaxed">{confirmed.emailSimulation}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/tra-cuu?code=${confirmed.bookingCode}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B5D56]"
          >
            Tra cứu / Hủy lịch với mã này
          </Link>
          {session && (
            <Link
              href="/tai-khoan"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/25 bg-white px-5 py-3 text-sm font-bold text-[#0F766E] transition hover:bg-[#0F766E]/5"
            >
              Về khu vực Khách hàng
            </Link>
          )}
          <button
            onClick={() => setConfirmed(null)}
            className="rounded-xl border border-[#132A2E]/15 px-5 py-3 text-sm font-semibold text-[#476268] hover:bg-slate-50"
          >
            Đặt thêm lịch mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
      {/* Cột trái 8 cột: Biểu mẫu đặt lịch */}
      <div className="col-span-8 space-y-6">
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316]/12 px-3 py-1 text-xs font-bold text-[#F97316]">
                <CalendarPlus className="h-3.5 w-3.5" />
                Đặt lịch trực tuyến • Miễn phí • Không đặt cọc
              </span>
              <h1 className="mt-2.5 text-3xl font-extrabold text-[#132A2E]">
                Đặt lịch Khám bệnh & Spa Thú cưng
              </h1>
              <p className="mt-1 text-sm text-[#476268]">
                Mở cửa 07:00 – 20:00 mỗi ngày. Hỗ trợ đặt nhiều thú cưng trong cùng 1 phiếu và tự động cộng dồn thời lượng.
              </p>
            </div>
          </div>

          {/* Chế độ Thành viên / Khách vãng lai */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#FAF9F6] p-1.5">
            <button
              type="button"
              onClick={() => handleSwitchMode("MEMBER")}
              disabled={!session || customerPets.length === 0}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                mode === "MEMBER"
                  ? "bg-[#0F766E] text-white shadow-sm"
                  : "text-[#476268] hover:text-[#132A2E] disabled:opacity-45"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              {session
                ? customerPets.length > 0
                  ? `Đặt bằng hồ sơ thành viên (${customerPets.length} bé)`
                  : "Thành viên (chưa có thú cưng trong sổ)"
                : "Khách thành viên (vui lòng đăng nhập)"}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("GUEST")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                mode === "GUEST"
                  ? "bg-[#F97316] text-white shadow-sm"
                  : "text-[#476268] hover:text-[#132A2E]"
              }`}
            >
              <UserRound className="h-4 w-4" />
              Đặt nhanh Khách vãng lai (Không cần tài khoản)
            </button>
          </div>

          {session && customerPets.length === 0 && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#0F766E]/20 bg-[#0F766E]/6 px-4 py-3 text-xs text-[#132A2E]">
              <span>
                Tài khoản của bạn chưa có hồ sơ thú cưng. Thêm thú cưng để lưu sổ bệnh án điện tử tự động!
              </span>
              <Link
                href="/tai-khoan"
                className="shrink-0 rounded-lg bg-[#0F766E] px-3 py-1.5 font-bold text-white hover:bg-[#0B5D56]"
              >
                + Thêm thú cưng ngay
              </Link>
            </div>
          )}

          {mode === "GUEST" && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <strong>Chính sách Khách vãng lai:</strong> Thông tin của bạn chỉ đính kèm tạm thời trên Phiếu đặt lịch và Hóa đơn lượt này, <strong>không</strong> lưu vào sổ Hồ sơ Khách hàng cố định. Đặt xong bạn sẽ nhận Mã đặt lịch (ví dụ <code className="font-bold">ANM-8492</code>) để tự hủy bất cứ lúc nào.
            </div>
          )}

          {mode === "GUEST" && (
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
                  Họ tên chủ nuôi *
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
                  Số điện thoại (để tra cứu/hủy) *
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="VD: 0909888777"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
                  Email nhận xác nhận (không bắt buộc)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bước 2: Chọn 1 hoặc nhiều thú cưng & Dịch vụ */}
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                1. Chọn Thú cưng & Dịch vụ (1 giá cố định)
              </h2>
              <p className="text-xs text-[#476268]">
                Có thể thêm nhiều thú cưng trong cùng 1 phiếu đặt lịch. Hệ thống tự cộng dồn thời lượng.
              </p>
            </div>
            <button
              type="button"
              onClick={addPetRow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/5 px-4 py-2 text-xs font-bold text-[#0F766E] transition hover:bg-[#0F766E] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Thêm thú cưng vào phiếu
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {petDrafts.map((draft, idx) => (
              <div
                key={draft.key}
                className="rounded-2xl border border-[#132A2E]/12 bg-[#FAF9F6] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#0F766E]">
                    Thú cưng #{idx + 1}
                  </span>
                  {petDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePetRow(draft.key)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Bỏ bé này
                    </button>
                  )}
                </div>

                {mode === "MEMBER" ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                      Chọn bé từ hồ sơ của bạn
                    </label>
                    <select
                      value={draft.petId || ""}
                      onChange={(e) =>
                        setPetDrafts((prev) =>
                          prev.map((p) =>
                            p.key === draft.key ? { ...p, petId: e.target.value } : p
                          )
                        )
                      }
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#0F766E]"
                    >
                      {customerPets.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name} ({formatSpecies(cp.species)}
                          {cp.breed ? ` • ${cp.breed}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                        Tên thú cưng *
                      </label>
                      <input
                        type="text"
                        required
                        value={draft.guestPetName}
                        onChange={(e) =>
                          setPetDrafts((prev) =>
                            prev.map((p) =>
                              p.key === draft.key
                                ? { ...p, guestPetName: e.target.value }
                                : p
                            )
                          )
                        }
                        placeholder="VD: Cà Phê"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                        Loài
                      </label>
                      <select
                        value={draft.guestPetSpecies}
                        onChange={(e) =>
                          setPetDrafts((prev) =>
                            prev.map((p) =>
                              p.key === draft.key
                                ? { ...p, guestPetSpecies: e.target.value }
                                : p
                            )
                          )
                        }
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
                      >
                        <option value="DOG">Chó</option>
                        <option value="CAT">Mèo</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                        Giống (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={draft.guestPetBreed}
                        onChange={(e) =>
                          setPetDrafts((prev) =>
                            prev.map((p) =>
                              p.key === draft.key
                                ? { ...p, guestPetBreed: e.target.value }
                                : p
                            )
                          )
                        }
                        placeholder="VD: Poodle / Mèo Anh"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                        Ghi chú tình trạng / tuổi bé (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={draft.guestPetNote}
                        onChange={(e) =>
                          setPetDrafts((prev) =>
                            prev.map((p) =>
                              p.key === draft.key
                                ? { ...p, guestPetNote: e.target.value }
                                : p
                            )
                          )
                        }
                        placeholder="VD: 2 tuổi, nặng khoảng 4kg, hơi nhát người lạ..."
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>
                )}

                {/* Chọn dịch vụ cho thú cưng này */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold text-[#132A2E]">
                    Chọn dịch vụ cho bé này:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {services.map((srv) => {
                      const checked = draft.serviceIds.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleServiceForPet(draft.key, srv.id)}
                          className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition ${
                            checked
                              ? "border-[#0F766E] bg-[#0F766E]/8"
                              : "border-[#132A2E]/10 bg-white hover:border-[#0F766E]/40"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {srv.category === "MEDICAL" ? (
                                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F97316]" />
                              )}
                              <span className="truncate text-xs font-bold text-[#132A2E]">
                                {srv.name}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#476268]">
                              {srv.durationMinutes} phút • {formatVnd(srv.price)}
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bước 3: Chọn Ngày, Bác sĩ & Khung giờ 30 phút */}
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#132A2E]">
            2. Chọn Ngày, Bác sĩ & Khung giờ (07:00 – 20:00)
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
                Ngày hẹn khám
              </label>
              <input
                type="date"
                value={bookingDate}
                min={getTodayLocal()}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
                Chọn Bác sĩ (hoặc để Phòng khám tự phân công)
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#0F766E]"
              >
                <option value="AUTO">
                  Phòng khám tự phân công (ưu tiên bác sĩ ít lịch nhất)
                </option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {lunchEnabled && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
              Lưu ý: Phòng khám hiện đang bật khung giờ nghỉ trưa (12:00 – 13:30), các ô giờ trưa được tạm khóa.
            </div>
          )}

          <div className="mt-5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#132A2E]">
                Chọn khung giờ bắt đầu (hệ thống tự khóa kín {lockedDuration} phút liên tiếp):
              </span>
              <span className="text-xs text-[#476268]">
                {loadingSlots ? "Đang kiểm tra lịch trống..." : "Màu xanh = Còn trống"}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2.5">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    title={slot.reason || "Còn trống"}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      isSelected
                        ? "border-[#F97316] bg-[#F97316] text-white shadow-md"
                        : slot.available
                        ? "border-[#0F766E]/25 bg-white text-[#132A2E] hover:border-[#0F766E] hover:bg-[#0F766E]/8"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
              Ghi chú triệu chứng hoặc yêu cầu đặc biệt (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Bé hơi nhát người lạ, hoặc bé bị ho nhẹ 2 ngày nay..."
              className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>
      </div>

      {/* Cột phải 4 cột: Tóm tắt phiếu đặt lịch */}
      <div className="col-span-4">
        <div className="sticky top-28 rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-lg">
          <h3 className="text-lg font-extrabold text-[#132A2E]">
            Tóm tắt Phiếu đặt lịch
          </h3>

          <div className="mt-4 space-y-3 border-y border-[#132A2E]/10 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[#476268]">Số lượng thú cưng</span>
              <span className="font-bold">{petDrafts.length} bé</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#476268]">Tổng thời lượng khóa lịch</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0F766E]">
                <Clock className="h-4 w-4" />
                {lockedDuration} phút ({lockedDuration / 30} ô liên tiếp)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#476268]">Ngày & Giờ chọn</span>
              <span className="font-bold">
                {bookingDate} • {selectedTime || "Chưa chọn"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#476268]">Bác sĩ</span>
              <span className="font-bold text-right">
                {selectedDoctorId === "AUTO"
                  ? "Phòng khám tự phân công"
                  : doctors.find((d) => d.id === selectedDoctorId)?.fullName}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#476268]">Tạm tính (giá niêm yết)</span>
            <span className="text-2xl font-extrabold text-[#0F766E]">
              {formatVnd(totalEstimatedPrice)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#476268]">
            * Không thu tiền đặt cọc. Thanh toán trực tiếp tại quầy sau khi khám/spa ({totalDuration} phút ước tính).
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-4 text-base font-extrabold text-white shadow-lg shadow-[#F97316]/25 transition hover:bg-[#EA580C] disabled:opacity-60"
          >
            <CalendarPlus className="h-5 w-5" />
            {submitting ? "Đang xác nhận lịch..." : "Xác nhận Đặt lịch ngay"}
          </button>

          <Link
            href="/tra-cuu"
            className="mt-3 block text-center text-xs font-bold text-[#0F766E] hover:underline"
          >
            Đã có mã đặt lịch? Tra cứu / Hủy lịch tại đây →
          </Link>
        </div>
      </div>
    </form>
  );
}
