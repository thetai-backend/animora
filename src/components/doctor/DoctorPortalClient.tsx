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
  FolderHeart,
  Eye,
  X,
} from "lucide-react";
import {
  calculatePetAge,
  formatDateTimeVn,
  formatDateVn,
  formatGender,
  formatShift,
  formatSpecies,
  formatVnd,
  formatWorkStatus,
} from "@/lib/format";

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
  isLocked?: boolean;
  createdAt: string;
  guestOwnerName: string | null;
  guestPetName: string | null;
  guestPetSpecies: string | null;
  assessment: string;
  doctor?: { id: string; fullName: string } | null;
  customer: { fullName: string; phone: string | null } | null;
  pet: { id: string; name: string; species: string; breed: string | null } | null;
  addendums?: { id: string; authorName: string; content: string; createdAt: string }[];
  invoice: { invoiceCode: string; status: string; totalAmount: number } | null;
}

interface FullMedicalRecord {
  id: string;
  recordCode: string;
  status: string;
  isLocked?: boolean;
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
  status?: string;
  subjective?: string;
  objective?: string;
  assessment: string;
  plan: string;
  weightKg: string | null;
  temperatureC: string | null;
  heartRate?: string | null;
  respiratoryRate?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  doctor: { fullName: string };
  addendums?: { id: string; authorName: string; content: string; createdAt: string }[];
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

interface InternalSlipItem {
  id: string;
  slipCode: string;
  quantity: number;
  department: string;
  reason: string;
  createdAt: string;
  product: { name: string; retailUnit: string };
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
  const [tab, setTab] = useState<"QUEUE" | "SOAP" | "RECORDS" | "LEAVE">("QUEUE");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [doctor, setDoctor] = useState<DoctorSelf | null>(null);
  const [queueBookings, setQueueBookings] = useState<QueueBooking[]>([]);
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [allRecords, setAllRecords] = useState<MedicalRecordSummary[]>([]);
  const [recordSearch, setRecordSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState<
    "ALL" | "LOCKED" | "SENT_TO_POS" | "IN_PROGRESS" | "GUEST"
  >("ALL");
  const [quickViewPrevRecord, setQuickViewPrevRecord] = useState<PreviousRecord | null>(null);
  const [medSearch, setMedSearch] = useState("");
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [internalSlips, setInternalSlips] = useState<InternalSlipItem[]>([]);
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

  const loadWorkspace = async (targetDate = selectedDate) => {
    const res = await fetch(
      `/api/doctor/workspace?date=${encodeURIComponent(targetDate)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setDoctor(data.doctor);
    setQueueBookings(data.queueBookings || []);
    setRecords(data.medicalRecords || []);
    setAllRecords(data.allRecords || data.medicalRecords || []);
    setLeaves(data.leaves || []);
    setInternalSlips(data.internalSlips || []);
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
    loadWorkspace(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
        rec.invoice.items.map((it, idx) => {
          const prod = it.productId
            ? products.find((p) => p.id === it.productId)
            : undefined;
          return {
            key: `inv-${idx}`,
            itemType: it.itemType === "SERVICE" ? "SERVICE" : "MEDICINE",
            serviceId: it.serviceId || undefined,
            productId: it.productId || undefined,
            name: it.name,
            unit: prod?.retailUnit || (it.itemType === "SERVICE" ? "Lần" : "ĐV"),
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            stockQuantity: prod?.stockQuantity,
            dosageInstruction: it.dosageInstruction || "",
          };
        })
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
    const prod = products.find((p) => p.id === effectiveAddMedicineId);
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
        dosageInstruction: "Sáng 1 lần – Chiều 1 lần sau ăn trong 5 ngày",
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

  const medicinesAndShared = products
    .filter((p) => p.group === "MEDICINE" || p.group === "SHARED" || p.group === "SHOP")
    .sort((a, b) => {
      const order: Record<string, number> = { MEDICINE: 0, SHARED: 1, SHOP: 2 };
      return (order[a.group] ?? 9) - (order[b.group] ?? 9);
    });
  const filteredMedicinesAndShared = medicinesAndShared.filter((p) => {
    if (!medSearch.trim()) return true;
    return `${p.name} ${p.sku}`.toLowerCase().includes(medSearch.trim().toLowerCase());
  });
  const internalUseCandidates = products
    .filter((p) => p.group === "SUPPLY" || p.group === "MEDICINE" || p.group === "SHARED")
    .sort((a, b) => {
      const order: Record<string, number> = { SUPPLY: 0, MEDICINE: 1, SHARED: 2 };
      return (order[a.group] ?? 9) - (order[b.group] ?? 9);
    });
  const isLocked = Boolean(
    activeRecord &&
      (activeRecord.isLocked ||
        activeRecord.status === "LOCKED" ||
        activeRecord.invoice?.status === "PAID")
  );
  const effectiveAddMedicineId =
    filteredMedicinesAndShared.find((p) => p.id === addMedicineId)?.id ||
    filteredMedicinesAndShared[0]?.id ||
    "";
  const selectedMedicineObj = medicinesAndShared.find((p) => p.id === effectiveAddMedicineId);
  const filteredAllRecords = allRecords.filter((r) => {
    if (recordFilter === "LOCKED" && !(r.isLocked || r.status === "LOCKED")) return false;
    if (recordFilter === "SENT_TO_POS" && r.status !== "SENT_TO_POS") return false;
    if (recordFilter === "IN_PROGRESS" && r.status !== "IN_PROGRESS") return false;
    if (recordFilter === "GUEST" && r.customer) return false;
    if (recordSearch.trim()) {
      const hay = `${r.recordCode} ${r.pet?.name || r.guestPetName || ""} ${
        r.customer?.fullName || r.guestOwnerName || ""
      } ${r.doctor?.fullName || ""} ${r.assessment}`.toLowerCase();
      if (!hay.includes(recordSearch.trim().toLowerCase())) return false;
    }
    return true;
  });
  const lowOrZeroStockDrafts = posItems.filter((it) => {
    if (it.itemType !== "MEDICINE" || !it.productId) return false;
    const prod = products.find((p) => p.id === it.productId);
    const stock = prod ? prod.stockQuantity : it.stockQuantity;
    return stock !== undefined && (stock <= 0 || it.quantity > stock);
  });

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
            onClick={() => setTab("RECORDS")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "RECORDS" ? "bg-[#0D9488] text-white" : "text-[#476268]"
            }`}
          >
            <FolderHeart className="h-4 w-4" />
            Hồ sơ ca khám ({allRecords.length})
          </button>
          <button
            onClick={() => setTab("LEAVE")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "LEAVE" ? "bg-[#132A2E] text-white" : "text-[#476268]"
            }`}
          >
            <CalendarOff className="h-4 w-4" />
            Nghỉ phép &amp; Xuất vật tư
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#132A2E]">
                  Lịch khám cá nhân & Hàng chờ ({selectedDate})
                </h2>
                <p className="text-xs text-[#476268]">
                  Các ca đã Check-in từ Lễ tân sẽ nổi bật màu xanh để bác sĩ bấm Bắt đầu khám.
                </p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div className="mt-4 space-y-3">
              {queueBookings.length === 0 && (
                <p className="text-sm text-[#476268]">
                  Chưa có lịch hẹn hoặc ca chờ nào trong ngày {selectedDate}.
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
                          ? "Đã Check-in (Trong hàng chờ)"
                          : b.status === "IN_PROGRESS"
                          ? "Đang khám"
                          : "Đã đặt lịch (Chờ đến)"}
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
                    {b.pets.map((bp) => {
                      const petRec = b.medicalRecords?.find(
                        (mr) => mr.bookingPetId === bp.id
                      );
                      return (
                        <div
                          key={bp.id}
                          className="flex items-center justify-between rounded-xl border border-[#132A2E]/8 bg-white px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <strong className="text-[#132A2E]">
                              🐾 {bp.pet ? bp.pet.name : bp.guestPetName} (
                              {formatSpecies(
                                bp.pet ? bp.pet.species : bp.guestPetSpecies || "DOG"
                              )}
                              )
                            </strong>
                            <span className="ml-2 text-[#476268]">
                              {bp.services.map((s) => s.serviceName).join(", ")}
                            </span>
                          </div>
                          {petRec ? (
                            <button
                              onClick={() => openMedicalRecord(petRec.id)}
                              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold ${
                                petRec.status === "SENT_TO_POS" ||
                                petRec.status === "LOCKED"
                                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {petRec.status === "LOCKED"
                                ? "Đã khóa (Xem)"
                                : petRec.status === "SENT_TO_POS"
                                ? "Đã gửi POS"
                                : "Tiếp tục khám"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartExamFromBooking(b.id, bp.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 font-bold text-white hover:bg-[#0B5D56]"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Bắt đầu khám
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-bold text-[#0F766E]">
                    Hồ sơ Thú cưng cố định
                  </span>
                  <a
                    href={`/in/phieu-kham/${activeRecord.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#0F766E]/25 bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-extrabold text-[#0F766E] hover:bg-[#0F766E]/10"
                  >
                    In Phiếu khám A4
                  </a>
                </div>
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
                      <strong>Ngày sinh / Tuổi:</strong> {formatDateVn(activeRecord.pet.birthDate)}
                      {calculatePetAge(activeRecord.pet.birthDate)
                        ? ` (${calculatePetAge(activeRecord.pet.birthDate)})`
                        : ""}
                    </p>
                    <p>
                      <strong>Màu lông / Đặc điểm:</strong>{" "}
                      {activeRecord.pet.coatDescription || "—"}
                    </p>
                    <p>
                      <strong>Số Microchip:</strong>{" "}
                      <span className="font-mono">{activeRecord.pet.microchipCode || "—"}</span>
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
                  <div className="mt-4 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                    <span className="inline-block rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-extrabold text-white">
                      Khách vãng lai - Không lưu sổ hồ sơ
                    </span>
                    <p>
                      <strong>Thú cưng:</strong> {activeRecord.guestPetName} (
                      {formatSpecies(activeRecord.guestPetSpecies || "DOG")}
                      {activeRecord.guestPetBreed ? ` • ${activeRecord.guestPetBreed}` : ""})
                    </p>
                    <p>
                      Nội dung bệnh án S.O.A.P lượt này vẫn được lưu đầy đủ trong mục Hồ sơ ca khám để Quản lý tra cứu.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#132A2E]">
                  Lịch sử khám các lần trước ({previousRecords.length})
                </h4>
                <p className="mt-0.5 text-[11px] text-[#476268]">
                  Bấm vào từng lần khám để mở xem nhanh đầy đủ S.O.A.P &amp; ghi chú bổ sung.
                </p>
                <div className="mt-3 space-y-3">
                  {previousRecords.length === 0 && (
                    <p className="text-xs text-[#476268]">Chưa có lần khám nào trước đây.</p>
                  )}
                  {previousRecords.map((pr) => (
                    <button
                      type="button"
                      key={pr.id}
                      onClick={() => setQuickViewPrevRecord(pr)}
                      className="w-full rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-3.5 text-left text-xs transition hover:border-[#0F766E] hover:bg-emerald-50/40"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0F766E]">
                        <span>{pr.recordCode}</span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          {formatDateVn(pr.createdAt)}
                          <Eye className="h-3 w-3" />
                        </span>
                      </div>
                      <p className="mt-1 font-bold text-[#132A2E]">A: {pr.assessment || "—"}</p>
                      <p className="mt-1 line-clamp-2 whitespace-pre-line text-[#476268]">
                        P: {pr.plan || "—"}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-[#476268]">
                        BS: {pr.doctor.fullName}
                        {pr.addendums && pr.addendums.length > 0
                          ? ` • ${pr.addendums.length} ghi chú bổ sung`
                          : ""}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal xem nhanh Bệnh án lần khám trước */}
              {quickViewPrevRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/60 p-6 backdrop-blur-xs">
                  <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-2xl space-y-4 text-xs">
                    <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-3">
                      <div>
                        <h3 className="font-mono text-lg font-extrabold text-[#0F766E]">
                          Bệnh án lần trước — {quickViewPrevRecord.recordCode}
                        </h3>
                        <p className="text-[#476268]">
                          Ngày khám: <strong>{formatDateTimeVn(quickViewPrevRecord.createdAt)}</strong>{" "}
                          • Bác sĩ: <strong>{quickViewPrevRecord.doctor.fullName}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickViewPrevRecord(null)}
                        className="rounded-lg p-1.5 text-[#476268] hover:bg-slate-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                        <p className="text-[10px] text-[#476268]">Cân nặng</p>
                        <p className="font-bold">{quickViewPrevRecord.weightKg || "—"} kg</p>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                        <p className="text-[10px] text-[#476268]">Thân nhiệt</p>
                        <p className="font-bold">{quickViewPrevRecord.temperatureC || "—"} °C</p>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                        <p className="text-[10px] text-[#476268]">Nhịp tim</p>
                        <p className="font-bold">{quickViewPrevRecord.heartRate || "—"} l/p</p>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                        <p className="text-[10px] text-[#476268]">Nhịp thở</p>
                        <p className="font-bold">{quickViewPrevRecord.respiratoryRate || "—"} l/p</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="rounded-xl bg-[#FAF9F6] p-3">
                        <p className="font-extrabold text-[#0F766E]">S — Triệu chứng:</p>
                        <p className="mt-1 whitespace-pre-line">
                          {quickViewPrevRecord.subjective || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] p-3">
                        <p className="font-extrabold text-[#0F766E]">O — Khám lâm sàng:</p>
                        <p className="mt-1 whitespace-pre-line">
                          {quickViewPrevRecord.objective || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="font-extrabold text-[#0F766E]">A — Chẩn đoán:</p>
                        <p className="mt-1 whitespace-pre-line font-bold">
                          {quickViewPrevRecord.assessment || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] p-3">
                        <p className="font-extrabold text-[#0F766E]">P — Phác đồ &amp; Lời dặn:</p>
                        <p className="mt-1 whitespace-pre-line">
                          {quickViewPrevRecord.plan || "—"}
                        </p>
                      </div>
                    </div>
                    {quickViewPrevRecord.addendums && quickViewPrevRecord.addendums.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="font-extrabold text-amber-900">Ghi chú bổ sung:</p>
                        {quickViewPrevRecord.addendums.map((ad) => (
                          <p key={ad.id} className="mt-1">
                            • <strong>{ad.authorName}</strong> ({formatDateTimeVn(ad.createdAt)}):{" "}
                            {ad.content}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-extrabold text-white">
                      <Lock className="h-4 w-4" />
                      ĐÃ KHÓA CỨNG CHỈ ĐỌC (Đã thanh toán)
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
                      readOnly={isLocked}
                      value={soapForm.subjective}
                      onChange={(e) =>
                        !isLocked && setSoapForm({ ...soapForm, subjective: e.target.value })
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm ${
                        isLocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                          : "border-[#132A2E]/15 bg-[#FAF9F6]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      O (Objective) — Chỉ số lâm sàng & Khám thực thể
                    </label>
                    <div className="mb-2 grid grid-cols-4 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#476268]">
                          Cân nặng (kg)
                        </label>
                        <input
                          readOnly={isLocked}
                          placeholder="VD: 11.4"
                          value={soapForm.weightKg}
                          onChange={(e) =>
                            !isLocked && setSoapForm({ ...soapForm, weightKg: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                            isLocked
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                              : "border-[#132A2E]/15 bg-[#FAF9F6]"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#476268]">
                          Thân nhiệt (°C)
                        </label>
                        <input
                          readOnly={isLocked}
                          placeholder="VD: 38.5"
                          value={soapForm.temperatureC}
                          onChange={(e) =>
                            !isLocked &&
                            setSoapForm({ ...soapForm, temperatureC: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                            isLocked
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                              : "border-[#132A2E]/15 bg-[#FAF9F6]"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#476268]">
                          Nhịp tim (lần/phút)
                        </label>
                        <input
                          readOnly={isLocked}
                          placeholder="VD: 110"
                          value={soapForm.heartRate}
                          onChange={(e) =>
                            !isLocked && setSoapForm({ ...soapForm, heartRate: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                            isLocked
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                              : "border-[#132A2E]/15 bg-[#FAF9F6]"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#476268]">
                          Nhịp thở (lần/phút)
                        </label>
                        <input
                          readOnly={isLocked}
                          placeholder="VD: 28"
                          value={soapForm.respiratoryRate}
                          onChange={(e) =>
                            !isLocked &&
                            setSoapForm({ ...soapForm, respiratoryRate: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${
                            isLocked
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                              : "border-[#132A2E]/15 bg-[#FAF9F6]"
                          }`}
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      readOnly={isLocked}
                      value={soapForm.objective}
                      onChange={(e) =>
                        !isLocked && setSoapForm({ ...soapForm, objective: e.target.value })
                      }
                      placeholder="Ghi nhận niêm mạc, tim phổi, ổ bụng, da lông, tai..."
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm ${
                        isLocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                          : "border-[#132A2E]/15 bg-[#FAF9F6]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      A (Assessment) — Chẩn đoán lâm sàng
                    </label>
                    <textarea
                      rows={2}
                      readOnly={isLocked}
                      value={soapForm.assessment}
                      onChange={(e) =>
                        !isLocked && setSoapForm({ ...soapForm, assessment: e.target.value })
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm ${
                        isLocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                          : "border-[#132A2E]/15 bg-[#FAF9F6]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-[#0F766E]">
                      P (Plan) — Phác đồ điều trị, Đơn thuốc & Hướng dẫn sử dụng
                    </label>
                    <textarea
                      rows={3}
                      readOnly={isLocked}
                      value={soapForm.plan}
                      onChange={(e) =>
                        !isLocked && setSoapForm({ ...soapForm, plan: e.target.value })
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm ${
                        isLocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                          : "border-[#132A2E]/15 bg-[#FAF9F6]"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold">
                        Ngày hẹn tái khám / Mũi tiêm nhắc lại
                      </label>
                      <input
                        type="date"
                        readOnly={isLocked}
                        value={soapForm.followUpDate}
                        onChange={(e) =>
                          !isLocked &&
                          setSoapForm({ ...soapForm, followUpDate: e.target.value })
                        }
                        className={`w-full rounded-xl border px-3.5 py-2 text-sm ${
                          isLocked
                            ? "pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                            : "border-[#132A2E]/15 bg-[#FAF9F6]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold">
                        Nội dung nhắc tái khám
                      </label>
                      <input
                        readOnly={isLocked}
                        value={soapForm.followUpNote}
                        onChange={(e) =>
                          !isLocked &&
                          setSoapForm({ ...soapForm, followUpNote: e.target.value })
                        }
                        placeholder="VD: Soi lại tai sau 7 ngày"
                        className={`w-full rounded-xl border px-3.5 py-2 text-sm ${
                          isLocked
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
                            : "border-[#132A2E]/15 bg-[#FAF9F6]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* NẾU BỆNH ÁN ĐÃ KHÓA CỨNG -> CHỈ CHO THÊM GHI CHÚ BỔ SUNG */}
                {isLocked ? (
                  <div className="space-y-4">
                    {activeRecord.invoice && activeRecord.invoice.items?.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                        <p className="font-extrabold text-[#132A2E]">
                          Dịch vụ & Đơn thuốc đã chốt ({activeRecord.invoice.invoiceCode}):
                        </p>
                        <ul className="mt-2 space-y-1">
                          {activeRecord.invoice.items.map((it, idx) => (
                            <li key={idx} className="flex justify-between text-[#476268]">
                              <span>
                                • <strong>{it.name}</strong> (SL: {it.quantity})
                                {it.dosageInstruction ? ` — ${it.dosageInstruction}` : ""}
                              </span>
                              <span className="font-bold text-[#132A2E]">
                                {formatVnd(it.unitPrice * it.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5">
                      <h4 className="text-sm font-extrabold text-amber-900">
                        Ghi chú bổ sung (Addendum) — Bệnh án gốc đã khóa chỉ đọc, không cho sửa đè
                      </h4>
                      <div className="mt-3 space-y-2">
                        {activeRecord.addendums.length === 0 && (
                          <p className="text-xs text-amber-800">
                            Chưa có ghi chú bổ sung nào cho bệnh án này.
                          </p>
                        )}
                        {activeRecord.addendums.map((ad) => (
                          <div
                            key={ad.id}
                            className="rounded-xl border border-amber-200 bg-white p-3 text-xs"
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
                          className="rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B5D56]"
                        >
                          + Thêm ghi chú bổ sung
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  /* CHƯA KHÓA -> KÊ DỊCH VỤ PHÁT SINH & ĐƠN THUỐC TỪ KHO -> GỬI LỄ TÂN */
                  <div className="rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-5 space-y-4">
                    <h4 className="text-sm font-extrabold text-[#132A2E]">
                      Dịch vụ phát sinh & Kê đơn thuốc từ kho (Hiển thị tồn kho hiện tại)
                    </h4>

                    {(lowOrZeroStockDrafts.length > 0 ||
                      (selectedMedicineObj && selectedMedicineObj.stockQuantity <= 0)) && (
                      <div className="flex items-start gap-2.5 rounded-xl border-2 border-rose-500 bg-rose-50 p-3.5 text-xs text-rose-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <div>
                          <p className="font-extrabold">
                            CẢNH BÁO TỒN KHO ≤ 0 / KHÔNG ĐỦ TRÊN HỆ THỐNG!
                          </p>
                          <p className="mt-0.5">
                            Mặt hàng tồn kho bằng 0 hoặc thấp hơn số lượng kê — hệ thống{" "}
                            <strong>vẫn cho phép kê đơn</strong> (tồn kho âm tạm thời khi Lễ tân thu tiền) để không làm gián đoạn điều trị.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        <select
                          value={addServiceId}
                          onChange={(e) => setAddServiceId(e.target.value)}
                          className="flex-1 rounded-xl border border-[#132A2E]/15 bg-white px-2.5 py-2 text-xs font-semibold"
                        >
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              [DV {s.category === "SPA" ? "SPA" : "Y TẾ"}] {s.name} (
                              {formatVnd(s.price)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddServiceToPos}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0B5D56]"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm dịch vụ
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <input
                          value={medSearch}
                          onChange={(e) => setMedSearch(e.target.value)}
                          placeholder="Tìm thuốc / hàng dùng chung..."
                          className="w-48 rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-xs"
                        />
                        <select
                          value={effectiveAddMedicineId}
                          onChange={(e) => setAddMedicineId(e.target.value)}
                          className={`flex-1 min-w-60 rounded-xl border bg-white px-2.5 py-2 text-xs font-semibold ${
                            selectedMedicineObj && selectedMedicineObj.stockQuantity <= 0
                              ? "border-rose-500 text-rose-700"
                              : "border-[#132A2E]/15"
                          }`}
                        >
                          {filteredMedicinesAndShared.map((p) => (
                            <option key={p.id} value={p.id}>
                              [
                              {p.group === "MEDICINE"
                                ? "THUỐC"
                                : p.group === "SHARED"
                                ? "DÙNG CHUNG"
                                : "SHOP"}
                              ] {p.name} — Còn {p.stockQuantity} {p.retailUnit}
                              {p.stockQuantity <= 0 ? " (⚠ HẾT TỒN)" : ""} ({formatVnd(p.price)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddMedicineToPos}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#F97316] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#EA580C]"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm thuốc / sản phẩm kê đơn
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {posItems.map((it) => {
                        const prod = it.productId
                          ? products.find((p) => p.id === it.productId)
                          : undefined;
                        const liveStock = prod ? prod.stockQuantity : it.stockQuantity;
                        const isOutOrLow =
                          it.itemType === "MEDICINE" &&
                          liveStock !== undefined &&
                          (liveStock <= 0 || it.quantity > liveStock);
                        return (
                          <div
                            key={it.key}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                              isOutOrLow
                                ? "border-rose-400 bg-rose-50/70"
                                : "border-[#132A2E]/10 bg-white"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-[#132A2E]">{it.name}</p>
                                {it.itemType === "MEDICINE" && liveStock !== undefined && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                      isOutOrLow
                                        ? "bg-rose-600 text-white"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {isOutOrLow
                                      ? `⚠ Tồn: ${liveStock} ${it.unit} (Vẫn cho kê)`
                                      : `Tồn: ${liveStock} ${it.unit}`}
                                  </span>
                                )}
                              </div>
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
                                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
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
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold"
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
                        );
                      })}
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
                        Hoàn tất khám & Gửi Lễ tân thanh toán
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* TAB 3: DANH SÁCH HỒ SƠ CA KHÁM (THÀNH VIÊN & KHÁCH VÃNG LAI) */}
      {tab === "RECORDS" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Danh sách Hồ sơ ca khám S.O.A.P ({filteredAllRecords.length})
              </h2>
              <p className="text-xs text-[#476268]">
                Tra cứu toàn bộ ca khám đã thực hiện (bao gồm cả khách thành viên và khách vãng
                lai). Bấm vào bất kỳ bệnh án nào để xem chi tiết S.O.A.P &amp; thêm ghi chú bổ sung.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "ALL", label: "Tất cả" },
                  { key: "LOCKED", label: "Đã khóa cứng" },
                  { key: "SENT_TO_POS", label: "Chờ thanh toán" },
                  { key: "IN_PROGRESS", label: "Đang khám" },
                  { key: "GUEST", label: "Khách vãng lai" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRecordFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    recordFilter === f.key
                      ? "bg-[#0F766E] text-white"
                      : "bg-[#FAF9F6] text-[#476268] hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={recordSearch}
            onChange={(e) => setRecordSearch(e.target.value)}
            placeholder="Tìm theo mã bệnh án, tên thú cưng, tên chủ nuôi, bác sĩ hoặc chẩn đoán..."
            className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2.5 text-xs"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                  <th className="py-2.5">Mã BA / Thời gian</th>
                  <th className="py-2.5">Thú cưng &amp; Chủ nuôi</th>
                  <th className="py-2.5">Bác sĩ khám</th>
                  <th className="py-2.5">Chẩn đoán (A)</th>
                  <th className="py-2.5">Trạng thái</th>
                  <th className="py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/8">
                {filteredAllRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#476268]">
                      Không tìm thấy hồ sơ ca khám nào phù hợp.
                    </td>
                  </tr>
                )}
                {filteredAllRecords.map((rec) => {
                  const locked = rec.isLocked || rec.status === "LOCKED";
                  return (
                    <tr key={rec.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 pr-3">
                        <p className="font-mono font-extrabold text-[#0F766E]">{rec.recordCode}</p>
                        <p className="text-[11px] text-[#476268]">
                          {formatDateTimeVn(rec.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-bold text-[#132A2E]">
                          🐾 {rec.pet ? rec.pet.name : rec.guestPetName}
                        </p>
                        <p className="text-[11px] text-[#476268]">
                          {rec.customer
                            ? `${rec.customer.fullName} (Thành viên)`
                            : `${rec.guestOwnerName || "Khách lẻ"} (Khách vãng lai)`}
                        </p>
                      </td>
                      <td className="py-3 pr-3 font-semibold">
                        {rec.doctor?.fullName || doctor?.fullName || "—"}
                      </td>
                      <td className="py-3 pr-3 max-w-xs">
                        <p className="truncate">{rec.assessment || "Đang cập nhật..."}</p>
                        {rec.addendums && rec.addendums.length > 0 && (
                          <p className="text-[10px] font-bold text-amber-700">
                            +{rec.addendums.length} ghi chú bổ sung
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            locked
                              ? "bg-slate-800 text-white"
                              : rec.status === "SENT_TO_POS"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {locked ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Bệnh án đã khóa
                            </>
                          ) : rec.status === "SENT_TO_POS" ? (
                            "Chờ thanh toán"
                          ) : (
                            "Đang khám"
                          )}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openMedicalRecord(rec.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0B5D56]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Mở chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ĐĂNG KÝ NGHỈ / BÁO SỰ CỐ NGHỈ ĐỘT XUẤT & PHIẾU XUẤT KHO NỘI BỘ */}
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
                    <strong>{l.leaveDate}</strong> ({formatShift(l.shift)}) — {l.reason}{" "}
                    {l.isEmergency && (
                      <span className="ml-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {l.resolvedByReceptionist ? "ĐỘT XUẤT (Đã xử lý)" : "ĐỘT XUẤT (Cảnh báo Lễ tân)"}
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
              <label className="mb-1 block text-xs font-bold">
                Vật tư tiêu hao / Thuốc dùng nội bộ
              </label>
              <select
                value={internalSlipForm.productId}
                onChange={(e) =>
                  setInternalSlipForm({ ...internalSlipForm, productId: e.target.value })
                }
                className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold"
              >
                {internalUseCandidates.map((s) => (
                  <option key={s.id} value={s.id}>
                    [
                    {s.group === "SUPPLY"
                      ? "VẬT TƯ"
                      : s.group === "MEDICINE"
                      ? "THUỐC"
                      : "DÙNG CHUNG"}
                    ] {s.name} (Tồn: {s.stockQuantity} {s.retailUnit})
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

            <div className="border-t border-[#132A2E]/10 pt-4">
              <h3 className="text-xs font-extrabold uppercase text-[#476268]">
                Phiếu xuất kho nội bộ gần đây ({internalSlips.length})
              </h3>
              <div className="mt-2 space-y-2">
                {internalSlips.length === 0 && (
                  <p className="text-xs text-[#476268]">Chưa có phiếu xuất vật tư nào.</p>
                )}
                {internalSlips.map((sl) => (
                  <div
                    key={sl.id}
                    className="flex items-center justify-between rounded-xl bg-[#FAF9F6] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#0F766E]">
                        {sl.slipCode}
                      </span>{" "}
                      • <strong>{sl.product.name}</strong> ({sl.quantity}{" "}
                      {sl.product.retailUnit})
                      <p className="text-[11px] text-[#476268]">
                        {sl.department} — {sl.reason}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-[#476268]">
                      {formatDateVn(sl.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
