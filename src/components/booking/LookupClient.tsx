"use client";

import React, { useState } from "react";
import { Search, Calendar, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatSpecies, formatVnd } from "@/lib/format";

interface LookupBooking {
  id: string;
  bookingCode: string;
  isGuest: boolean;
  guestName: string | null;
  guestPhone: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  status: string;
  notes: string | null;
  customer: { fullName: string; phone: string | null } | null;
  doctor: { fullName: string; title: string | null } | null;
  pets: {
    id: string;
    guestPetName: string | null;
    guestPetSpecies: string | null;
    pet: { name: string; species: string; breed: string | null } | null;
    services: { id: string; serviceName: string; price: number }[];
  }[];
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-emerald-100 text-emerald-800" },
  CHECKED_IN: { label: "Đã Check-in tại quầy", cls: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "Đang khám bệnh", cls: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Đã hoàn tất", cls: "bg-slate-200 text-slate-700" },
  CANCELLED: { label: "Đã hủy lịch", cls: "bg-rose-100 text-rose-800" },
};

export function LookupClient({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode || "ANM-8492");
  const [phone, setPhone] = useState(initialCode ? "" : "0909888777");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [booking, setBooking] = useState<LookupBooking | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings/lookup?code=${encodeURIComponent(
          code.trim()
        )}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setBooking(null);
        setError(data.error || "Không tìm thấy phiếu đặt lịch");
      } else {
        setBooking(data.booking);
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: booking.bookingCode,
          phone: phone.trim(),
          cancelReason: "Khách tự hủy tại trang Tra cứu lịch",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể hủy lịch");
      } else {
        setMessage(data.message);
        setBooking({ ...booking, status: "CANCELLED" });
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    booking && (booking.status === "CONFIRMED" || booking.status === "CHECKED_IN");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-bold text-[#0F766E]">
          <Search className="h-3.5 w-3.5" />
          Tra cứu & Tự hủy lịch không giới hạn thời gian
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
          Tra cứu / Hủy lịch hẹn ANIMORA
        </h1>
        <p className="mt-1 text-sm text-[#476268]">
          Dành cho Khách vãng lai và Thành viên. Nhập Mã đặt lịch (mẫu thử sẵn: <strong>ANM-8492</strong>, SĐT: <strong>0909888777</strong>) để xem chi tiết hoặc hủy lịch miễn chưa vào khám.
        </p>

        <form onSubmit={handleLookup} className="mt-6 grid grid-cols-12 gap-4">
          <div className="col-span-5">
            <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
              Mã đặt lịch *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: ANM-8492"
              className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-3 font-mono text-sm font-bold uppercase outline-none focus:border-[#0F766E]"
            />
          </div>
          <div className="col-span-5">
            <label className="mb-1.5 block text-xs font-bold text-[#132A2E]">
              Số điện thoại đặt lịch *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0909888777"
              className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-3 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] py-3 text-sm font-bold text-white transition hover:bg-[#0B5D56] disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {booking && (
        <div className="rounded-3xl border border-[#0F766E]/20 bg-white p-8 shadow-md">
          <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-[#0F766E]">
                  {booking.bookingCode}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_LABEL[booking.status]?.cls || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {STATUS_LABEL[booking.status]?.label || booking.status}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[#476268]">
                Chủ nuôi:{" "}
                <strong className="text-[#132A2E]">
                  {booking.isGuest ? booking.guestName : booking.customer?.fullName}
                </strong>{" "}
                • SĐT:{" "}
                <strong>
                  {booking.isGuest ? booking.guestPhone : booking.customer?.phone}
                </strong>
              </p>
            </div>

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? "Đang hủy..." : "Hủy lịch hẹn này"}
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 rounded-2xl bg-[#FAF9F6] p-4 text-sm">
            <div>
              <p className="text-xs text-[#476268]">Ngày hẹn</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-bold">
                <Calendar className="h-4 w-4 text-[#0F766E]" />
                {booking.bookingDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#476268]">Khung giờ giữ chỗ</p>
              <p className="mt-0.5 font-bold">
                {booking.startTime} – {booking.endTime} ({booking.totalDurationMinutes} phút)
              </p>
            </div>
            <div>
              <p className="text-xs text-[#476268]">Bác sĩ phụ trách</p>
              <p className="mt-0.5 font-bold text-[#0F766E]">
                {booking.doctor?.fullName || "Đang phân công"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-extrabold text-[#132A2E]">
              Danh sách Thú cưng & Dịch vụ đã đặt
            </h3>
            {booking.pets.map((bp) => (
              <div
                key={bp.id}
                className="rounded-2xl border border-[#132A2E]/10 bg-white p-4"
              >
                <p className="text-sm font-bold text-[#132A2E]">
                  🐾 {bp.pet ? bp.pet.name : bp.guestPetName} (
                  {formatSpecies(bp.pet ? bp.pet.species : bp.guestPetSpecies || "DOG")})
                </p>
                <ul className="mt-2 space-y-1 text-xs text-[#476268]">
                  {bp.services.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>• {s.serviceName}</span>
                      <span className="font-bold text-[#132A2E]">
                        {formatVnd(s.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
