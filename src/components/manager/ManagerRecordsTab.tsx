"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  PawPrint,
  FileText,
  Printer,
  Eye,
  X,
  Lock,
} from "lucide-react";
import { formatDateTimeVn, formatDateVn, formatSpecies } from "@/lib/format";

export interface ManagerCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    pets: number;
    customerBookings: number;
    customerInvoices: number;
  };
}

export interface ManagerPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  status: string;
  allergies: string | null;
  vaccinationHistory: string | null;
  owner: { id: string; fullName: string; phone: string | null; email: string };
  _count: { medicalRecords: number; bookingPets: number };
}

export interface ManagerMedicalRecord {
  id: string;
  recordCode: string;
  status: string;
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
  guestOwnerName: string | null;
  guestOwnerPhone: string | null;
  guestPetName: string | null;
  guestPetSpecies: string | null;
  doctor: { fullName: string };
  customer: { fullName: string; phone: string | null } | null;
  pet: { name: string; species: string; status: string } | null;
  addendums: { id: string; authorName: string; content: string; createdAt: string }[];
  invoice: {
    id: string;
    invoiceCode: string;
    status: string;
    totalAmount: number;
    items: { id: string; name: string; quantity: number; unit: string; itemType: string }[];
  } | null;
}

export function ManagerRecordsTab({
  customers,
  pets,
  records,
  onReload,
  notify,
}: {
  customers: ManagerCustomer[];
  pets: ManagerPet[];
  records: ManagerMedicalRecord[];
  onReload: () => Promise<void>;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<"RECORDS" | "PETS" | "CUSTOMERS">("RECORDS");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ManagerMedicalRecord | null>(null);

  const handleTogglePetStatus = async (pet: ManagerPet, nextStatus: "ALIVE" | "DECEASED") => {
    const res = await fetch(`/api/manager/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể đổi trạng thái thú cưng", "err");
    } else {
      notify(data.message);
      await onReload();
    }
  };

  const q = search.trim().toLowerCase();

  const filteredRecords = records.filter((r) => {
    if (!q) return true;
    const hay = `${r.recordCode} ${r.pet?.name || r.guestPetName || ""} ${
      r.customer?.fullName || r.guestOwnerName || ""
    } ${r.doctor.fullName} ${r.assessment}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredPets = pets.filter((p) => {
    if (!q) return true;
    const hay = `${p.name} ${p.breed || ""} ${p.owner.fullName} ${p.owner.phone || ""}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredCustomers = customers.filter((c) => {
    if (!q) return true;
    const hay = `${c.fullName} ${c.email} ${c.phone || ""} ${c.address || ""}`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setSubTab("RECORDS")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
              subTab === "RECORDS" ? "bg-[#0F766E] text-white" : "text-[#476268]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Hồ sơ ca khám S.O.A.P ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("PETS")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
              subTab === "PETS" ? "bg-[#F97316] text-white" : "text-[#476268]"
            }`}
          >
            <PawPrint className="h-3.5 w-3.5" />
            Toàn bộ Thú cưng ({pets.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("CUSTOMERS")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
              subTab === "CUSTOMERS" ? "bg-[#132A2E] text-white" : "text-[#476268]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Khách hàng thành viên ({customers.length})
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm hồ sơ theo tên, SĐT, mã bệnh án, bác sĩ..."
          className="w-80 rounded-xl border border-[#132A2E]/15 bg-white px-4 py-2 text-xs"
        />
      </div>

      {/* Modal xem chi tiết Bệnh án S.O.A.P */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F766E]">
                  Chi tiết Bệnh án {selectedRecord.recordCode}
                </h3>
                <p className="text-[#476268]">
                  Thú cưng: <strong>{selectedRecord.pet?.name || selectedRecord.guestPetName}</strong> • Chủ nuôi:{" "}
                  <strong>
                    {selectedRecord.customer?.fullName || `${selectedRecord.guestOwnerName} (Khách vãng lai)`}
                  </strong>{" "}
                  • BS: <strong>{selectedRecord.doctor.fullName}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/in/phieu-kham/${selectedRecord.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-xl bg-[#0F766E] px-3 py-1.5 font-bold text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  In Phiếu khám A4
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-lg p-1.5 text-[#476268] hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[10px] text-[#476268]">Cân nặng</p>
                <p className="font-bold">{selectedRecord.weightKg || "—"} kg</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[10px] text-[#476268]">Nhiệt độ</p>
                <p className="font-bold">{selectedRecord.temperatureC || "—"} °C</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[10px] text-[#476268]">Nhịp tim</p>
                <p className="font-bold">{selectedRecord.heartRate || "—"}</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[10px] text-[#476268]">Nhịp thở</p>
                <p className="font-bold">{selectedRecord.respiratoryRate || "—"}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-xl bg-[#FAF9F6] p-3">
                <p className="font-extrabold text-[#0F766E]">S (Triệu chứng):</p>
                <p className="mt-1 whitespace-pre-line">{selectedRecord.subjective || "—"}</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-3">
                <p className="font-extrabold text-[#0F766E]">O (Khám lâm sàng):</p>
                <p className="mt-1 whitespace-pre-line">{selectedRecord.objective || "—"}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="font-extrabold text-[#0F766E]">A (Chẩn đoán):</p>
                <p className="mt-1 whitespace-pre-line font-bold">{selectedRecord.assessment || "—"}</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-3">
                <p className="font-extrabold text-[#0F766E]">P (Phác đồ &amp; Dặn dò):</p>
                <p className="mt-1 whitespace-pre-line">{selectedRecord.plan || "—"}</p>
              </div>
            </div>

            {selectedRecord.addendums.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="font-extrabold text-amber-900">Ghi chú bổ sung:</p>
                {selectedRecord.addendums.map((a) => (
                  <p key={a.id} className="mt-1">
                    • <strong>{a.authorName}</strong> ({formatDateTimeVn(a.createdAt)}): {a.content}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "RECORDS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            Toàn bộ Hồ sơ ca khám S.O.A.P (Bao gồm Thành viên &amp; Khách vãng lai)
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Mã BA / Ngày</th>
                  <th className="py-2.5">Thú cưng &amp; Chủ nuôi</th>
                  <th className="py-2.5">Bác sĩ</th>
                  <th className="py-2.5">Chẩn đoán (A)</th>
                  <th className="py-2.5">Trạng thái</th>
                  <th className="py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3">
                      <p className="font-mono font-extrabold text-[#0F766E]">{r.recordCode}</p>
                      <p className="text-[11px] text-[#476268]">{formatDateTimeVn(r.createdAt)}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-[#132A2E]">
                        {r.pet ? r.pet.name : r.guestPetName}{" "}
                        {r.pet?.status === "DECEASED" && (
                          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-white">
                            Đã mất
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#476268]">
                        {r.customer
                          ? `${r.customer.fullName} (Thành viên)`
                          : `${r.guestOwnerName || "Khách lẻ"} (Vãng lai)`}
                      </p>
                    </td>
                    <td className="py-3 font-semibold">{r.doctor.fullName}</td>
                    <td className="py-3 max-w-xs truncate">{r.assessment || "—"}</td>
                    <td className="py-3">
                      {r.status === "LOCKED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                          <Lock className="h-3 w-3" />
                          Đã khóa cứng
                        </span>
                      ) : r.status === "SENT_TO_POS" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                          Chờ thanh toán
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-800">
                          Đang khám
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </button>
                        <Link
                          href={`/in/phieu-kham/${r.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0F766E]/25 bg-white px-2.5 py-1 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          In A4
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "PETS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            Toàn bộ Hồ sơ Thú cưng (Quản lý trạng thái Đang chăm sóc / Đã mất)
          </h3>
          <p className="text-xs text-[#476268]">
            Khi đổi trạng thái thú cưng sang <strong>Đã mất</strong>, hệ thống giữ nguyên lịch sử khám nhưng TỰ ĐỘNG NGẮT toàn bộ danh sách nhắc hẹn &amp; email tự động.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Thú cưng</th>
                  <th className="py-2.5">Chủ nuôi</th>
                  <th className="py-2.5">Tiêm phòng / Dị ứng</th>
                  <th className="py-2.5 text-center">Số lần khám</th>
                  <th className="py-2.5 text-center">Trạng thái</th>
                  <th className="py-2.5 text-right">Đổi trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {filteredPets.map((pet) => (
                  <tr
                    key={pet.id}
                    className={pet.status === "DECEASED" ? "bg-slate-100/70" : "hover:bg-[#FAF9F6]"}
                  >
                    <td className="py-3">
                      <p className="font-extrabold text-[#132A2E]">{pet.name}</p>
                      <p className="text-[11px] text-[#476268]">
                        {formatSpecies(pet.species)} {pet.breed ? `• ${pet.breed}` : ""}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="font-bold">{pet.owner.fullName}</p>
                      <p className="text-[11px] text-[#476268]">{pet.owner.phone || pet.owner.email}</p>
                    </td>
                    <td className="py-3 max-w-xs text-[11px] text-[#476268]">
                      <div>Tiêm: {pet.vaccinationHistory || "—"}</div>
                      <div>Dị ứng: {pet.allergies || "Không"}</div>
                    </td>
                    <td className="py-3 text-center font-bold">{pet._count.medicalRecords} lần</td>
                    <td className="py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                          pet.status === "DECEASED"
                            ? "bg-slate-700 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {pet.status === "DECEASED" ? "Đã mất" : "Đang chăm sóc"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {pet.status === "ALIVE" ? (
                        <button
                          type="button"
                          onClick={() => handleTogglePetStatus(pet, "DECEASED")}
                          className="rounded-lg border border-slate-400 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                        >
                          Đánh dấu Đã mất
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePetStatus(pet, "ALIVE")}
                          className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0B5D56]"
                        >
                          Khôi phục Đang chăm sóc
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "CUSTOMERS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#132A2E]">
            Danh sách Khách hàng Thành viên ({filteredCustomers.length})
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Họ tên</th>
                  <th className="py-2.5">Email &amp; SĐT</th>
                  <th className="py-2.5">Địa chỉ</th>
                  <th className="py-2.5 text-center">Thú cưng</th>
                  <th className="py-2.5 text-center">Lịch đặt / Hóa đơn</th>
                  <th className="py-2.5 text-right">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 font-extrabold text-[#132A2E]">{c.fullName}</td>
                    <td className="py-3">
                      <p className="font-semibold">{c.phone || "—"}</p>
                      <p className="text-[11px] text-[#476268]">{c.email}</p>
                    </td>
                    <td className="py-3 text-[#476268]">{c.address || "—"}</td>
                    <td className="py-3 text-center font-extrabold text-[#0F766E]">
                      {c._count.pets} bé
                    </td>
                    <td className="py-3 text-center font-bold">
                      {c._count.customerBookings} lịch • {c._count.customerInvoices} HĐ
                    </td>
                    <td className="py-3 text-right text-[#476268]">{formatDateVn(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
