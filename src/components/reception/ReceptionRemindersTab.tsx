"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing,
  PhoneCall,
  Mail,
  CheckCircle2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatDateTimeVn, formatDateVn, formatSpecies } from "@/lib/format";

interface ReminderRow {
  id: string;
  recordCode: string;
  followUpDate: string;
  followUpNote: string | null;
  reminderCalledAt: string | null;
  reminderCalledBy: string | null;
  guestOwnerName: string | null;
  guestOwnerPhone: string | null;
  guestPetName: string | null;
  guestPetSpecies: string | null;
  daysUntil: number;
  isUrgent: boolean;
  isOverdue: boolean;
  customer: { id: string; fullName: string; phone: string | null; email: string } | null;
  pet: { id: string; name: string; species: string; breed: string | null; status: string } | null;
  doctor: { fullName: string };
  emailLogs: { id: string; createdAt: string; recipientEmail: string }[];
}

interface EmailLogItem {
  id: string;
  recipientEmail: string;
  recipientName: string;
  petName: string | null;
  subject: string;
  body: string;
  sentByName: string | null;
  createdAt: string;
}

export function ReceptionRemindersTab({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reception/reminders");
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
        setEmailLogs(data.emailLogs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleMarkCalled = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reception/reminders/${id}/call`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Không thể đánh dấu đã gọi", "err");
      else {
        notify(data.message);
        await loadReminders();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSendEmail = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reception/reminders/${id}/email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Không thể gửi Email nhắc hẹn", "err");
      else {
        notify(data.message);
        await loadReminders();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Danh sách Cần nhắc hẹn tái khám / tiêm phòng */}
      <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
              <BellRing className="h-5 w-5 text-[#F97316]" />
              Danh sách Cần nhắc hẹn Tái khám / Tiêm phòng ({reminders.length})
            </h2>
            <p className="text-xs text-[#476268]">
              Tự tổng hợp từ bệnh án S.O.A.P có &quot;Ngày hẹn tái khám&quot; (ưu tiên sắp đến trong 1–2 ngày tới).{" "}
              <strong className="text-rose-700">
                TUYỆT ĐỐI tự động loại bỏ toàn bộ thú cưng ở trạng thái Đã mất.
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={loadReminders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-[#FAF9F6] px-4 py-2 text-xs font-bold text-[#0F766E]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        <div className="space-y-3">
          {reminders.map((r) => {
            const petName = r.pet?.name || r.guestPetName || "Thú cưng";
            const ownerName = r.customer?.fullName || r.guestOwnerName || "Khách vãng lai";
            const ownerPhone = r.customer?.phone || r.guestOwnerPhone || "—";
            const ownerEmail = r.customer?.email || null;

            return (
              <div
                key={r.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 text-xs ${
                  r.isUrgent
                    ? "border-[#F97316] bg-[#F97316]/6"
                    : r.isOverdue
                    ? "border-rose-300 bg-rose-50/60"
                    : "border-[#132A2E]/10 bg-[#FAF9F6]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-[#0F766E]">{r.recordCode}</span>
                    {r.isUrgent && (
                      <span className="rounded-full bg-[#F97316] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        ƯU TIÊN — CÒN {r.daysUntil === 0 ? "HÔM NAY" : `${r.daysUntil} NGÀY`}
                      </span>
                    )}
                    {r.isOverdue && (
                      <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        QUÁ HẸN {Math.abs(r.daysUntil)} NGÀY
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-bold text-[#132A2E]">
                      <Clock className="h-3.5 w-3.5 text-[#0F766E]" />
                      Hẹn ngày: {formatDateVn(r.followUpDate)}
                    </span>
                  </div>

                  <p className="text-sm font-extrabold text-[#132A2E]">
                    🐾 {petName} ({formatSpecies(r.pet?.species || r.guestPetSpecies || "DOG")}) — Chủ nuôi:{" "}
                    {ownerName}
                  </p>
                  <p className="text-[#476268]">
                    SĐT: <strong>{ownerPhone}</strong> • Email:{" "}
                    <strong>{ownerEmail || "Không có email (Vãng lai)"}</strong> • BS: {r.doctor.fullName}
                  </p>
                  <p className="text-[#132A2E]">
                    Dặn dò: <em>{r.followUpNote || "Tái khám / Tiêm nhắc định kỳ"}</em>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {r.reminderCalledAt && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã gọi nhắc bởi {r.reminderCalledBy} ({formatDateTimeVn(r.reminderCalledAt)})
                      </span>
                    )}
                    {r.emailLogs.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-teal-100 px-2.5 py-1 font-bold text-[#0F766E]">
                        <Mail className="h-3.5 w-3.5" />
                        Đã gửi {r.emailLogs.length} Email (gần nhất: {formatDateTimeVn(r.emailLogs[0].createdAt)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => handleMarkCalled(r.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-extrabold transition ${
                      r.reminderCalledAt
                        ? "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                        : "bg-[#0F766E] text-white hover:bg-[#0B5D56]"
                    }`}
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    {r.reminderCalledAt ? "Gọi nhắc lại" : "Đã gọi nhắc"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === r.id || !ownerEmail}
                    onClick={() => handleSendEmail(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 font-extrabold text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Gửi Email nhắc hẹn
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && reminders.length === 0 && (
            <p className="py-8 text-center text-sm text-[#476268]">
              Hiện chưa có lịch hẹn tái khám / tiêm phòng nào cần nhắc.
            </p>
          )}
        </div>
      </div>

      {/* Nhật ký Email nhắc hẹn đã gửi (EmailLog) */}
      <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-[#132A2E]">
          <Mail className="h-5 w-5 text-[#0F766E]" />
          Nhật ký Email nhắc hẹn đã gửi ({emailLogs.length})
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                <th className="py-2.5">Thời gian gửi</th>
                <th className="py-2.5">Người nhận</th>
                <th className="py-2.5">Thú cưng</th>
                <th className="py-2.5">Tiêu đề Email</th>
                <th className="py-2.5">Nhân viên gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132A2E]/8">
              {emailLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 text-[#476268]">{formatDateTimeVn(log.createdAt)}</td>
                  <td className="py-3">
                    <p className="font-bold text-[#132A2E]">{log.recipientName}</p>
                    <p className="font-mono text-[11px] text-[#0F766E]">{log.recipientEmail}</p>
                  </td>
                  <td className="py-3 font-bold">{log.petName || "—"}</td>
                  <td className="py-3 max-w-md">
                    <p className="font-bold text-[#132A2E]">{log.subject}</p>
                    <p className="line-clamp-1 text-[11px] text-[#476268]">{log.body}</p>
                  </td>
                  <td className="py-3 text-[#476268]">{log.sentByName || "Hệ thống"}</td>
                </tr>
              ))}
              {emailLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#476268]">
                    Chưa có Email nhắc hẹn nào được gửi. Bấm &quot;Gửi Email nhắc hẹn&quot; phía trên để thử ngay.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
