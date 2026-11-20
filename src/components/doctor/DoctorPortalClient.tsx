"use client";

import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  FileText,
  CalendarOff,
  AlertTriangle,
  CheckCircle2,
  Play,
  Plus,
  Send,
  Lock,
  Save,
  Trash2,
  PackageMinus,
  UserPlus,
} from "lucide-react";
import { formatDateVn, formatGender, formatSpecies, formatVnd, formatWorkStatus } from "@/lib/format";

interface DoctorSelf {
  id: string;
  fullName: string;
  title: string | null;
  workStatus: string;
}

interface QueueBooking {
  id: string;
  bookingCode: string;
  isGuest: boolean;
  guestName: string | null;
  guestPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  isEmergency: boolean;
  notes: string | null;
  customer: { fullName: string; phone: string | null } | null;
  pets: {
    id: string;
    guestPetName: string | null;
    guestPetSpecies: string | null;
    pet: { id: string; name: string; species: string; breed: string | null } | null;
    services: { id: string; serviceId: string; serviceName: string; price: number }[];
  }[];
  medicalRecords: { id: string; recordCode: string; status: string; bookingPetId: string | null }[];
}

interface MedicalRecordSummary {
  id: string;
  recordCode: string;
  status: string;
  createdAt: string;
  guestOwnerName: string | null;
  guestPetName: string | null;
  guestPetSpecies: string | null;
  assessment: string;
  customer: { fullName: string; phone: string | null } | null;
  pet: { id: string; name: string; species: string; breed: string | null } | null;
  invoice: { invoiceCode: string; status: string; totalAmount: number } | null;
}

interface FullMedicalRecord {
  id: string;
  recordCode: string;
  status: string;
  lockedAt: string | null;
  createdAt: string;
  guestOwnerName: string | null;
  guestOwnerPhone: string | null;
  guestPetName: string | null;
  guestPetSpecies: string | null;
  guestPetBreed: string | null;
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
  customer: { fullName: string; phone: string | null; email: string } | null;
  pet: {
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
  } | null;
  bookingPet: {
    services: { serviceId: string; serviceName: string; price: number }[];
  } | null;
  addendums: { id: string; authorName: string; content: string; createdAt: string }[];
  invoice: {
    invoiceCode: string;
    status: string;
    items: {
      itemType: string;
      serviceId: string | null;
      productId: string | null;
      name: string;
      quantity: number;
      unitPrice: number;
      dosageInstruction: string | null;
    }[];
  } | null;
}

interface PreviousRecord {
  id: string;
  recordCode: string;
  createdAt: string;
  assessment: string;
  plan: string;
  weightKg: string | null;
  temperatureC: string | null;
  doctor: { fullName: string };
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  group: string;
  price: number;
  retailUnit: string;
  stockQuantity: number;
}

interface LeaveItem {
  id: string;
  leaveDate: string;
  shift: string;
  isEmergency: boolean;
  reason: string;
  resolvedByReceptionist: boolean;
}

interface PosDraftItem {
  key: string;
  itemType: "SERVICE" | "MEDICINE";
  serviceId?: string;
  productId?: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  stockQuantity?: number;
  dosageInstruction: string;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function DoctorPortalClient() {
  const [tab, setTab] = useState<"QUEUE" | "SOAP" | "LEAVE">("QUEUE");
  const [doctor, setDoctor] = useState<DoctorSelf | null>(null);
  const [queueBookings, setQueueBookings] = useState<QueueBooking[]>([]);
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Direct walk-in modal
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    guestOwnerName: "",
    guestOwnerPhone: "",
    guestPetName: "",
    guestPetSpecies: "DOG",
    guestPetBreed: "",
    subjective: "",
  });

  // Active SOAP state
  const [activeRecord, setActiveRecord] = useState<FullMedicalRecord | null>(null);
  const [previousRecords, setPreviousRecords] = useState<PreviousRecord[]>([]);
  const [soapForm, setSoapForm] = useState({
    subjective: "",
    objective: "",
    weightKg: "",
    temperatureC: "",
    heartRate: "",
    respiratoryRate: "",
    assessment: "",
    plan: "",
    followUpDate: "",
    followUpNote: "",
  });
  const [posItems, setPosItems] = useState<PosDraftItem[]>([]);
  const [addServiceId, setAddServiceId] = useState("");
  const [addMedicineId, setAddMedicineId] = useState("");
  const [addendumText, setAddendumText] = useState("");
  const [savingSoap, setSavingSoap] = useState(false);

  // Leave & Internal Usage Slip
  const [leaveForm, setLeaveForm] = useState({
    leaveDate: getTodayStr(),
    shift: "AFTERNOON",
    reason: "",
  });
  const [internalSlipForm, setInternalSlipForm] = useState({
    productId: "",
    quantity: 5,
    department: "Phòng khám",
    reason: "Xuất vật tư tiêu hao phục vụ ca khám trong ngày",
  });

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadWorkspace = async () => {
    const res = await fetch("/api/doctor/workspace");
    if (!res.ok) return;
    const data = await res.json();
    setDoctor(data.doctor);
    setQueueBookings(data.queueBookings || []);
    setRecords(data.medicalRecords || []);
    setLeaves(data.leaves || []);
    setServices(data.services || []);
    setProducts(data.products || []);

    if (data.services?.length && !addServiceId) setAddServiceId(data.services[0].id);
    const meds = (data.products || []).filter((p: ProductItem) => p.group === "MEDICINE");
    if (meds.length && !addMedicineId) setAddMedicineId(meds[0].id);
    const supplies = (data.products || []).filter((p: ProductItem) => p.group === "SUPPLY");
    if (supplies.length && !internalSlipForm.productId) {
      setInternalSlipForm((f) => ({ ...f, productId: supplies[0].id }));
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeStatus = async (workStatus: "AVAILABLE" | "IN_EXAM" | "OFF_DUTY") => {
    const res = await fetch("/api/doctor/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workStatus, doctorId: doctor?.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setDoctor((prev) => (prev ? { ...prev, workStatus: data.doctor.workStatus } : prev));
      notify(`Đã cập nhật trạng thái làm việc sang: ${formatWorkStatus(workStatus).label}`);
    }
  };

  const openMedicalRecord = async (recordId: string) => {
    const res = await fetch(`/api/medical-records/${recordId}`);
    if (!res.ok) return;
    const data = await res.json();
    const rec: FullMedicalRecord = data.record;
    setActiveRecord(rec);
    setPreviousRecords(data.previousRecords || []);
    setSoapForm({
      subjective: rec.subjective || "",
      objective: rec.objective || "",
      weightKg: rec.weightKg || "",
      temperatureC: rec.temperatureC || "",
      heartRate: rec.heartRate || "",
      respiratoryRate: rec.respiratoryRate || "",
      assessment: rec.assessment || "",
      plan: rec.plan || "",
      followUpDate: rec.followUpDate ? rec.followUpDate.slice(0, 10) : "",
      followUpNote: rec.followUpNote || "",
    });

    // Nạp sẵn danh sách dịch vụ/thuốc từ hóa đơn cũ hoặc dịch vụ đã đặt
    if (rec.invoice?.items?.length) {
      setPosItems(
        rec.invoice.items.map((it, idx) => ({
          key: `inv-${idx}`,
          itemType: it.itemType === "SERVICE" ? "SERVICE" : "MEDICINE",
          serviceId: it.serviceId || undefined,
          productId: it.productId || undefined,
          name: it.name,
          unit: it.itemType === "SERVICE" ? "Lần" : "ĐV",
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          dosageInstruction: it.dosageInstruction || "",
        }))
      );
    } else if (rec.bookingPet?.services?.length) {
      setPosItems(
        rec.bookingPet.services.map((s, idx) => ({
          key: `srv-${idx}`,
          itemType: "SERVICE",
          serviceId: s.serviceId,
          name: s.serviceName,
          unit: "Lần",
          unitPrice: s.price,
          quantity: 1,
          dosageInstruction: "",
        }))
      );
    } else {
      setPosItems([]);
    }
    setTab("SOAP");
  };

  const handleStartExamFromBooking = async (bookingId: string, bookingPetId?: string) => {
    const res = await fetch("/api/doctor/start-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, bookingPetId, doctorId: doctor?.id }),
    });
    const data = await res.json();
    if (res.ok) {
      notify("Đã bắt đầu khám! Trạng thái Bác sĩ tự động chuyển sang Đang khám.");
      await loadWorkspace();
      await openMedicalRecord(data.medicalRecord.id);
    }
  };

  const handleStartWalkInExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/doctor/start-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...walkInForm, doctorId: doctor?.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể tạo ca khám", "err");
      return;
    }
    setWalkInOpen(false);
    setWalkInForm({
      guestOwnerName: "",
      guestOwnerPhone: "",
      guestPetName: "",
      guestPetSpecies: "DOG",
      guestPetBreed: "",
      subjective: "",
    });
    await loadWorkspace();
    await openMedicalRecord(data.medicalRecord.id);
  };

  const handleAddServiceToPos = () => {
    const srv = services.find((s) => s.id === addServiceId);
    if (!srv) return;
    setPosItems((prev) => [
      ...prev,
      {
        key: `s-${Date.now()}`,
        itemType: "SERVICE",
        serviceId: srv.id,
        name: srv.name,
        unit: "Lần",
        unitPrice: srv.price,
        quantity: 1,
        dosageInstruction: "",
      },
    ]);
  };

  const handleAddMedicineToPos = () => {
    const prod = products.find((p) => p.id === addMedicineId);
    if (!prod) return;
    setPosItems((prev) => [
      ...prev,
      {
        key: `m-${Date.now()}`,
        itemType: "MEDICINE",
        productId: prod.id,
        name: prod.name,
        unit: prod.retailUnit,
        unitPrice: prod.price,
        quantity: 1,
        stockQuantity: prod.stockQuantity,
        dosageInstruction: "Uống sau ăn theo hướng dẫn bác sĩ",
      },
    ]);
  };

  const handleSaveSoapDraft = async () => {
    if (!activeRecord) return;
    setSavingSoap(true);
    const res = await fetch(`/api/medical-records/${activeRecord.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(soapForm),
    });
    const data = await res.json();
    setSavingSoap(false);
    if (!res.ok) {
      notify(data.error || "Không thể lưu bệnh án", "err");
    } else {
      notify("Đã lưu bản nháp bệnh án S.O.A.P!");
    }
  };

  const handleSendToPos = async () => {
    if (!activeRecord) return;
    if (posItems.length === 0) {
      notify("Vui lòng thêm ít nhất 1 dịch vụ hoặc thuốc trước khi gửi Lễ tân", "err");
      return;
    }
    setSavingSoap(true);
    const res = await fetch(`/api/medical-records/${activeRecord.id}/send-to-pos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...soapForm,
        items: posItems.map((it) => ({
          itemType: it.itemType,
          serviceId: it.serviceId,
          productId: it.productId,
          quantity: it.quantity,
          dosageInstruction: it.dosageInstruction,
        })),
      }),
    });
    const data = await res.json();
    setSavingSoap(false);
    if (!res.ok) {
      notify(data.error || "Lỗi gửi phiếu", "err");
    } else {
      notify(data.message);
      await loadWorkspace();
      await openMedicalRecord(activeRecord.id);
    }
  };

  const handleAddAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord || !addendumText.trim()) return;
    const res = await fetch(`/api/medical-records/${activeRecord.id}/addendum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: addendumText }),
    });
    if (res.ok) {
      setAddendumText("");
      notify("Đã thêm ghi chú bổ sung (tự lưu thời gian & tên bác sĩ)!");
      await openMedicalRecord(activeRecord.id);
    }
  };

  const handleSubmitLeave = async (isEmergency: boolean) => {
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leaveForm,
        doctorId: doctor?.id,
        isEmergency,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể đăng ký nghỉ", "err");
    } else {
      notify(data.message);
      setLeaveForm((f) => ({ ...f, reason: "" }));
      await loadWorkspace();
    }
  };

  const handleCreateInternalSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory/internal-use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(internalSlipForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Lỗi lập phiếu xuất nội bộ", "err");
    } else {
      notify(data.message);
      await loadWorkspace();
    }
  };

  const medicinesAndShared = products.filter((p) => p.group === "MEDICINE" || p.group === "SHOP");
  const supplies = products.filter((p) => p.group === "SUPPLY");

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold ${
            toast.type === "err"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.type === "err" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Thanh trạng thái Bác sĩ trực tiếp (Đang trống / Đang khám / Nghỉ) */}
      <div className="flex items-center justify-between rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F766E]/10 text-[#0F766E]">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#132A2E]">
              {doctor?.fullName || "Bác sĩ Thú y"}
            </p>
            <p className="text-xs text-[#476268]">
              Bấm nút bên phải để cập nhật trạng thái trực tiếp cho Lễ tân điều phối:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { key: "AVAILABLE", label: "Đang trống", activeCls: "bg-emerald-600 text-white" },
              { key: "IN_EXAM", label: "Đang khám", activeCls: "bg-amber-500 text-white" },
              { key: "OFF_DUTY", label: "Đang nghỉ", activeCls: "bg-slate-600 text-white" },
            ] as const
          ).map((st) => (
            <button
              key={st.key}
              onClick={() => handleChangeStatus(st.key)}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                doctor?.workStatus === st.key
                  ? `${st.activeCls} shadow-sm`
                  : "border border-slate-200 bg-[#FAF9F6] text-[#476268] hover:bg-slate-100"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
          <button
            onClick={() => setTab("QUEUE")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "QUEUE" ? "bg-[#0F766E] text-white" : "text-[#476268]"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Hàng chờ khám ({queueBookings.length})
          </button>
          <button
            onClick={() => setTab("SOAP")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "SOAP" ? "bg-[#F97316] text-white" : "text-[#476268]"
            }`}
          >
            <FileText className="h-4 w-4" />
            Khám bệnh S.O.A.P {activeRecord ? `(${activeRecord.recordCode})` : ""}
          </button>
          <button
            onClick={() => setTab("LEAVE")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "LEAVE" ? "bg-[#132A2E] text-white" : "text-[#476268]"
            }`}
          >
            <CalendarOff className="h-4 w-4" />
            Đăng ký nghỉ / Nghỉ đột xuất & Xuất vật tư
          </button>
        </div>

        <button
          onClick={() => setWalkInOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#EA580C]"
        >
          <UserPlus className="h-4 w-4" />
          Tạo ca khám khách lẻ
        </button>
      </div>

      {/* Form Tạo ca khám khách lẻ trực tiếp */}
      {walkInOpen && (
        <form
          onSubmit={handleStartWalkInExam}
          className="rounded-3xl border-2 border-[#F97316]/40 bg-white p-6 shadow-md"
        >
          <h3 className="text-base font-extrabold text-[#F97316]">
            Tạo ca khám khách lẻ trực tiếp (Không lưu vào sổ Hồ sơ Khách hàng cố định)
          </h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold">Tên chủ nuôi *</label>
              <input
                required
                value={walkInForm.guestOwnerName}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, guestOwnerName: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">SĐT chủ nuôi</label>
              <input
                value={walkInForm.guestOwnerPhone}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, guestOwnerPhone: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Tên thú cưng *</label>
              <input
                required
                value={walkInForm.guestPetName}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, guestPetName: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Loài</label>
              <select
                value={walkInForm.guestPetSpecies}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, guestPetSpecies: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              >
                <option value="DOG">Chó</option>
                <option value="CAT">Mèo</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Giống</label>
              <input
                value={walkInForm.guestPetBreed}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, guestPetBreed: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Triệu chứng ban đầu</label>
              <input
                value={walkInForm.subjective}
                onChange={(e) =>
                  setWalkInForm({ ...walkInForm, subjective: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setWalkInOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#F97316] px-5 py-2 text-xs font-bold text-white"
            >
              Mở bệnh án S.O.A.P ngay
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: HÀNG CHỜ KHÁM & DANH SÁCH BỆNH ÁN GẦN ĐÂY */}
      {tab === "QUEUE" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#132A2E]">
              Hàng chờ khám hôm nay (từ Lễ tân đẩy vào)
            </h2>
            <div className="mt-4 space-y-3">
              {queueBookings.length === 0 && (
                <p className="text-sm text-[#476268]">
                  Chưa có ca nào trong hàng chờ hôm nay.
                </p>
              )}
              {queueBookings.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-4 ${
                    b.isEmergency
                      ? "border-rose-400 bg-rose-50/70"
                      : b.status === "CHECKED_IN"
                      ? "border-[#0F766E]/30 bg-[#0F766E]/5"
                      : "border-[#132A2E]/10 bg-[#FAF9F6]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                        {b.bookingCode}
                      </span>{" "}
                      • <strong>{b.startTime}–{b.endTime}</strong>{" "}
                      <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold">
                        {b.status === "CHECKED_IN"
                          ? "Khách đã đến quầy"
                          : b.status === "IN_PROGRESS"
                          ? "Đang khám"
                          : "Chờ đến"}
                      </span>
                      {b.isEmergency && (
                        <span className="ml-1 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                          CẤP CỨU
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[#476268]">
                    Chủ nuôi:{" "}
                    <strong className="text-[#132A2E]">
                      {b.isGuest ? `${b.guestName} (Vãng lai)` : b.customer?.fullName}
                    </strong>
                    {b.notes ? ` • Ghi chú: ${b.notes}` : ""}
                  </p>
                  <div className="mt-3 space-y-2">
                    {b.pets.map((bp) => (
                      <div
                        key={bp.id}
                        className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-xs border border-[#132A2E]/8"
                      >
                        <div>
                          <strong className="text-[#132A2E]">
                            🐾 {bp.pet ? bp.pet.name : bp.guestPetName} (
                            {formatSpecies(bp.pet ? bp.pet.species : bp.guestPetSpecies || "DOG")})
                          </strong>
                          <span className="ml-2 text-[#476268]">
                            {bp.services.map((s) => s.serviceName).join(", ")}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStartExamFromBooking(b.id, bp.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 font-bold text-white hover:bg-[#0B5D56]"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Bắt đầu khám
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#132A2E]">
              Bệnh án S.O.A.P gần đây của tôi
            </h2>
            <div className="mt-4 space-y-2.5">
              {records.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => openMedicalRecord(rec.id)}
                  className="w-full rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4 text-left transition hover:border-[#0F766E]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-[#0F766E]">
                      {rec.recordCode}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        rec.status === "LOCKED"
                          ? "bg-slate-200 text-slate-700"
                          : rec.status === "SENT_TO_POS"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {rec.status === "LOCKED"
                        ? "🔒 ĐÃ KHÓA CỨNG"
                        : rec.status === "SENT_TO_POS"
                        ? "Đã gửi POS"
                        : "Đang khám"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#132A2E]">
                    {rec.pet ? rec.pet.name : `${rec.guestPetName} (Vãng lai)`} —{" "}
                    {rec.customer ? rec.customer.fullName : rec.guestOwnerName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#476268]">
                    Chẩn đoán: {rec.assessment || "Đang cập nhật..."}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GIAO DIỆN KHÁM S.O.A.P 2 CỘT DESKTOP */}
      {tab === "SOAP" && (
        !activeRecord ? (
          <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-12 text-center text-sm text-[#476268]">
            Vui lòng chọn một bệnh án hoặc bấm <strong>Bắt đầu khám</strong> ở tab Hàng chờ khám.
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* CỘT TRÁI (4 CỘT): Hồ sơ cố định + Lịch sử khám trước đó của thú cưng */}
            <div className="col-span-4 space-y-5">
              <div className="rounded-3xl border border-[#0F766E]/20 bg-white p-6 shadow-sm">
                <span className="rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-bold text-[#0F766E]">
                  Hồ sơ Thú cưng cố định
                </span>
                <h3 className="mt-3 text-xl font-extrabold text-[#132A2E]">
                  🐾 {activeRecord.pet ? activeRecord.pet.name : activeRecord.guestPetName}
                </h3>
                <p className="text-xs text-[#476268]">
                  Chủ nuôi:{" "}
                  <strong>
                    {activeRecord.customer
                      ? `${activeRecord.customer.fullName} (${activeRecord.customer.phone})`
                      : `${activeRecord.guestOwnerName} (${activeRecord.guestOwnerPhone || "Khách vãng lai"})`}
                  </strong>
                </p>

                {activeRecord.pet ? (
                  <div className="mt-4 space-y-2 rounded-2xl bg-[#FAF9F6] p-4 text-xs">
                    <p>
                      <strong>Loài / Giống:</strong> {formatSpecies(activeRecord.pet.species)} •{" "}
                      {activeRecord.pet.breed || "—"}
                    </p>
                    <p>
                      <strong>Giới tính / Triệt sản:</strong>{" "}
                      {formatGender(activeRecord.pet.gender)} •{" "}
                      {activeRecord.pet.isNeutered ? "Đã triệt sản" : "Chưa triệt sản"}
                    </p>
                    <p>
                      <strong>Ngày sinh:</strong> {formatDateVn(activeRecord.pet.birthDate)}
                    </p>
                    <p className="text-rose-700">
                      <strong>⚠ Tiền sử dị ứng:</strong>{" "}
                      {activeRecord.pet.allergies || "Không ghi nhận"}
                    </p>
                    <p>
                      <strong>Tiêm phòng:</strong>{" "}
                      {activeRecord.pet.vaccinationHistory || "—"}
                    </p>
                    <p>
                      <strong>Tẩy giun:</strong> {activeRecord.pet.dewormingHistory || "—"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900">
                    Ca khám Khách vãng lai (chỉ lưu bệnh án vào danh mục Hồ sơ ca khám, không lưu vào sổ Khách hàng cố định).
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#132A2E]">
                  Lịch sử khám các lần trước ({previousRecords.length})
                </h4>
                <div className="mt-3 space-y-3">
                  {previousRecords.length === 0 && (
                    <p className="text-xs text-[#476268]">Chưa có lần khám nào trước đây.</p>
                  )}
                  {previousRecords.map((pr) => (
                    <div
                      key={pr.id}
                      className="rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-3.5 text-xs"
                    >
                      <div className="flex justify-between font-bold text-[#0F766E]">
                        <span>{pr.recordCode}</span>
                        <span>{formatDateVn(pr.createdAt)}</span>
                      </div>
                      <p className="mt-1 font-bold text-[#132A2E]">A: {pr.assessment}</p>
                      <p className="mt-1 whitespace-pre-line text-[#476268]">P: {pr.plan}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (8 CỘT): Biểu mẫu S.O.A.P thuần văn bản + Kê đơn từ kho */}
            <div className="col-span-8 space-y-5">
              <div className="rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-4">
                  <div>
                    <span className="font-mono text-xl font-extrabold text-[#0F766E]">
                      Bệnh án S.O.A.P — {activeRecord.recordCode}
                    </span>
                    <p className="text-xs text-[#476268]">
                      Chuẩn thuần văn bản thú y (không tải ảnh/file)
                    </p>
                  </div>
                  {activeRecord.status === "LOCKED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-extrabold text-white">
                      <Lock className="h-4 w-4" />
                      ĐÃ KHÓA CỨNG (Đã thanh toán)
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveSoapDraft}
                      disabled={savingSoap}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E] px-4 py-2 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/8"
                    >
                      <Save className="h-4 w-4" />
                      Lưu nháp S.O.A.P
                    </button>
                  )}
                </div>

                {/* S - O - A - P Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      S (Subjective) — Triệu chứng chủ nuôi mô tả
                    </label>
                    <textarea
                      rows={2}
                      disabled={activeRecord.status === "LOCKED"}
                      value={soapForm.subjective}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, subjective: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      O (Objective) — Chỉ số lâm sàng & Khám thực thể
                    </label>
                    <div className="mb-2 grid grid-cols-4 gap-3">
                      <input
                        disabled={activeRecord.status === "LOCKED"}
                        placeholder="Cân nặng (kg)"
                        value={soapForm.weightKg}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, weightKg: e.target.value })
                        }
                        className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                      />
                      <input
                        disabled={activeRecord.status === "LOCKED"}
                        placeholder="Nhiệt độ (°C)"
                        value={soapForm.temperatureC}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, temperatureC: e.target.value })
                        }
                        className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                      />
                      <input
                        disabled={activeRecord.status === "LOCKED"}
                        placeholder="Nhịp tim (lần/ph)"
                        value={soapForm.heartRate}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, heartRate: e.target.value })
                        }
                        className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                      />
                      <input
                        disabled={activeRecord.status === "LOCKED"}
                        placeholder="Nhịp thở (lần/ph)"
                        value={soapForm.respiratoryRate}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, respiratoryRate: e.target.value })
                        }
                        className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
                      />
                    </div>
                    <textarea
                      rows={2}
                      disabled={activeRecord.status === "LOCKED"}
                      value={soapForm.objective}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, objective: e.target.value })
                      }
                      placeholder="Ghi nhận niêm mạc, tim phổi, ổ bụng, da lông, tai..."
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      A (Assessment) — Chẩn đoán lâm sàng
                    </label>
                    <textarea
                      rows={2}
                      disabled={activeRecord.status === "LOCKED"}
                      value={soapForm.assessment}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, assessment: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      P (Plan) — Phác đồ điều trị, Đơn thuốc & Hướng dẫn sử dụng
                    </label>
                    <textarea
                      rows={3}
                      disabled={activeRecord.status === "LOCKED"}
                      value={soapForm.plan}
                      onChange={(e) => setSoapForm({ ...soapForm, plan: e.target.value })}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-sm disabled:opacity-70"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold">
                        Ngày hẹn tái khám / Mũi tiêm nhắc lại
                      </label>
                      <input
                        type="date"
                        disabled={activeRecord.status === "LOCKED"}
                        value={soapForm.followUpDate}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, followUpDate: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold">
                        Nội dung nhắc tái khám
                      </label>
                      <input
                        disabled={activeRecord.status === "LOCKED"}
                        value={soapForm.followUpNote}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, followUpNote: e.target.value })
                        }
                        placeholder="VD: Soi lại tai sau 7 ngày"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* NẾU BỆNH ÁN ĐÃ KHÓA CỨNG -> CHỈ CHO THÊM GHI CHÚ BỔ SUNG */}
                {activeRecord.status === "LOCKED" ? (
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5">
                    <h4 className="text-sm font-extrabold text-amber-900">
                      Ghi chú bổ sung (Addendum) — Bệnh án gốc đã khóa cứng không cho sửa đè
                    </h4>
                    <div className="mt-3 space-y-2">
                      {activeRecord.addendums.map((ad) => (
                        <div
                          key={ad.id}
                          className="rounded-xl bg-white p-3 text-xs border border-amber-200"
                        >
                          <p className="font-bold text-[#0F766E]">
                            {ad.authorName} • {new Date(ad.createdAt).toLocaleString("vi-VN")}
                          </p>
                          <p className="mt-1 text-[#132A2E]">{ad.content}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddAddendum} className="mt-3 flex gap-2">
                      <input
                        required
                        value={addendumText}
                        onChange={(e) => setAddendumText(e.target.value)}
                        placeholder="Nhập nội dung đính chính hoặc bổ sung kết quả xét nghiệm..."
                        className="flex-1 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white"
                      >
                        + Thêm ghi chú bổ sung
                      </button>
                    </form>
                  </div>
                ) : (
                  /* CHƯA KHÓA -> KÊ DỊCH VỤ PHÁT SINH & ĐƠN THUỐC TỪ KHO -> GỬI LỄ TÂN */
                  <div className="rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-5 space-y-4">
                    <h4 className="text-sm font-extrabold text-[#132A2E]">
                      Dịch vụ phát sinh & Kê đơn thuốc từ kho (Hiển thị tồn kho hiện tại)
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-2">
                        <select
                          value={addServiceId}
                          onChange={(e) => setAddServiceId(e.target.value)}
                          className="flex-1 rounded-xl border border-[#132A2E]/15 bg-white px-2.5 py-2 text-xs font-semibold"
                        >
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              [DV] {s.name} ({formatVnd(s.price)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddServiceToPos}
                          className="rounded-xl bg-[#0F766E] px-3 py-2 text-xs font-bold text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={addMedicineId}
                          onChange={(e) => setAddMedicineId(e.target.value)}
                          className="flex-1 rounded-xl border border-[#132A2E]/15 bg-white px-2.5 py-2 text-xs font-semibold"
                        >
                          {medicinesAndShared.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.group === "MEDICINE" ? "THUỐC" : "SHOP"}] {p.name} — Tồn:{" "}
                              {p.stockQuantity} {p.retailUnit} ({formatVnd(p.price)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddMedicineToPos}
                          className="rounded-xl bg-[#F97316] px-3 py-2 text-xs font-bold text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {posItems.map((it) => (
                        <div
                          key={it.key}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-xs border border-[#132A2E]/10"
                        >
                          <div className="flex-1">
                            <p className="font-bold text-[#132A2E]">{it.name}</p>
                            {it.itemType === "MEDICINE" && (
                              <input
                                value={it.dosageInstruction}
                                onChange={(e) =>
                                  setPosItems((prev) =>
                                    prev.map((row) =>
                                      row.key === it.key
                                        ? { ...row, dosageInstruction: e.target.value }
                                        : row
                                    )
                                  )
                                }
                                placeholder="Hướng dẫn liều dùng..."
                                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                              />
                            )}
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) =>
                              setPosItems((prev) =>
                                prev.map((row) =>
                                  row.key === it.key
                                    ? { ...row, quantity: Math.max(1, Number(e.target.value) || 1) }
                                    : row
                                )
                              )
                            }
                            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold"
                          />
                          <span className="w-24 text-right font-bold text-[#0F766E]">
                            {formatVnd(it.unitPrice * it.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPosItems((prev) => prev.filter((row) => row.key !== it.key))
                            }
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-extrabold text-[#132A2E]">
                        Tạm tính hóa đơn:{" "}
                        <span className="text-[#0F766E]">
                          {formatVnd(
                            posItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                          )}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSendToPos}
                        disabled={savingSoap}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#EA580C]"
                      >
                        <Send className="h-4 w-4" />
                        Gửi Lễ tân thanh toán & Về Đang trống
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* TAB 3: ĐĂNG KÝ NGHỈ / BÁO SỰ CỐ NGHỈ ĐỘT XUẤT & PHIẾU XUẤT KHO NỘI BỘ */}
      {tab === "LEAVE" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6 rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Đăng ký Nghỉ phép / Báo sự cố nghỉ đột xuất
              </h2>
              <p className="text-xs text-[#476268]">
                Bác sĩ tự đăng ký nghỉ KHÔNG cần Quản lý duyệt, hệ thống khóa ngay khung giờ đặt lịch. Nếu bấm <strong>Báo sự cố nghỉ đột xuất</strong> trùng lịch khách → màn hình Lễ tân lập tức hiện <strong>Cảnh báo đỏ</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold">Ngày nghỉ</label>
                <input
                  type="date"
                  value={leaveForm.leaveDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, leaveDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Ca nghỉ</label>
                <select
                  value={leaveForm.shift}
                  onChange={(e) => setLeaveForm({ ...leaveForm, shift: e.target.value })}
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
                >
                  <option value="MORNING">Ca sáng (07:00 – 13:30)</option>
                  <option value="AFTERNOON">Ca chiều (13:30 – 20:00)</option>
                  <option value="FULL_DAY">Cả ngày</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">Lý do nghỉ</label>
              <input
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="VD: Việc gia đình đột xuất / Nghỉ phép năm..."
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSubmitLeave(false)}
                className="rounded-xl bg-[#0F766E] py-3 text-sm font-bold text-white hover:bg-[#0B5D56]"
              >
                Đăng ký nghỉ bình thường
              </button>
              <button
                type="button"
                onClick={() => handleSubmitLeave(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 text-sm font-extrabold text-white hover:bg-rose-700"
              >
                <AlertTriangle className="h-4 w-4" />
                Báo sự cố nghỉ đột xuất
              </button>
            </div>

            <div className="border-t border-[#132A2E]/10 pt-4">
              <h3 className="text-xs font-extrabold uppercase text-[#476268]">
                Lịch nghỉ đã đăng ký ({leaves.length})
              </h3>
              <div className="mt-2 space-y-2">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className={`rounded-xl px-3.5 py-2.5 text-xs ${
                      l.isEmergency ? "bg-rose-50 text-rose-900" : "bg-[#FAF9F6]"
                    }`}
                  >
                    <strong>{l.leaveDate}</strong> ({l.shift}) — {l.reason}{" "}
                    {l.isEmergency && (
                      <span className="ml-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ĐỘT XUẤT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCreateInternalSlip}
            className="col-span-6 rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-[#0F766E]">
              <PackageMinus className="h-5 w-5" />
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Lập Phiếu xuất kho nội bộ (Vật tư tiêu hao)
              </h2>
            </div>
            <p className="text-xs text-[#476268]">
              Xuất kim tiêm, bông, cồn, găng tay ra phòng khám (tự động trừ kho FEFO).
            </p>

            <div>
              <label className="mb-1 block text-xs font-bold">Vật tư tiêu hao</label>
              <select
                value={internalSlipForm.productId}
                onChange={(e) =>
                  setInternalSlipForm({ ...internalSlipForm, productId: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold"
              >
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Tồn: {s.stockQuantity} {s.retailUnit})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold">Số lượng xuất</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={internalSlipForm.quantity}
                  onChange={(e) =>
                    setInternalSlipForm({
                      ...internalSlipForm,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Bộ phận sử dụng</label>
                <input
                  value={internalSlipForm.department}
                  onChange={(e) =>
                    setInternalSlipForm({ ...internalSlipForm, department: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Lý do xuất nội bộ *</label>
              <input
                required
                value={internalSlipForm.reason}
                onChange={(e) =>
                  setInternalSlipForm({ ...internalSlipForm, reason: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0F766E] py-3 text-sm font-extrabold text-white hover:bg-[#0B5D56]"
            >
              Xác nhận lập Phiếu xuất kho nội bộ
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
