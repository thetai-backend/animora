"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  QrCode,
  Banknote,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  ShieldAlert,
  Save,
  History,
} from "lucide-react";
import { formatDateVn, formatSpecies, formatVnd, formatWorkStatus } from "@/lib/format";
import { buildVietQrUrl, calculateInvoiceTotals } from "@/lib/pricing-utils";

interface DoctorInfo {
  id: string;
  fullName: string;
  title: string | null;
  workStatus: string;
}

interface BookingRow {
  id: string;
  bookingCode: string;
  isGuest: boolean;
  guestName: string | null;
  guestPhone: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isWalkIn: boolean;
  isEmergency: boolean;
  isLate20Min: boolean;
  notes: string | null;
  doctorId: string | null;
  customer: { fullName: string; phone: string | null } | null;
  doctor: { id: string; fullName: string; workStatus: string } | null;
  pets: {
    id: string;
    guestPetName: string | null;
    guestPetSpecies: string | null;
    pet: { name: string; species: string } | null;
    services: { id: string; serviceName: string; price: number }[];
  }[];
}

interface EmergencyAlert {
  id: string;
  doctorId: string;
  leaveDate: string;
  shift: string;
  reason: string;
  doctor: { id: string; fullName: string };
  affectedBookings: {
    id: string;
    bookingCode: string;
    startTime: string;
    endTime: string;
    isGuest: boolean;
    guestName: string | null;
    guestPhone: string | null;
    customer: { fullName: string; phone: string | null } | null;
  }[];
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface PosProduct {
  id: string;
  sku: string;
  name: string;
  group: string;
  price: number;
  retailUnit: string;
  stockQuantity: number;
}

interface PosPromotion {
  id: string;
  code: string | null;
  title: string;
  discountType: string;
  discountValue: number;
  applicableScope: string;
}

interface PosInvoice {
  id: string;
  invoiceCode: string;
  type: string;
  status: string;
  subtotal: number;
  eventDiscountAmount: number;
  couponDiscountAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  guestName: string | null;
  guestPhone: string | null;
  petSummary: string | null;
  customer: { fullName: string; phone: string | null } | null;
  doctor: { fullName: string } | null;
  medicalRecord: { id: string; recordCode: string; status: string } | null;
  items: {
    id: string;
    itemType: string;
    productId: string | null;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addedByRole: string;
    product?: { id: string; stockQuantity: number; retailUnit: string } | null;
  }[];
  auditLogs: {
    id: string;
    actorName: string;
    action: string;
    itemName: string;
    detail: string;
    createdAt: string;
  }[];
}

interface ScheduleRow {
  doctorId: string;
  dayOfWeek: number;
  morningShift: boolean;
  afternoonShift: boolean;
}

const DAYS_VN = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ReceptionPortalClient() {
  const [tab, setTab] = useState<"DISPATCH" | "POS" | "SCHEDULE">("DISPATCH");
  const [date, setDate] = useState(getTodayStr());
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Dispatch state
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    doctorId: "",
    guestName: "",
    guestPhone: "",
    guestPetName: "",
    guestPetSpecies: "DOG",
    guestPetBreed: "",
    serviceId: "",
    isEmergency: false,
    notes: "",
  });

  // POS state
  const [pendingInvoices, setPendingInvoices] = useState<PosInvoice[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<PosInvoice[]>([]);
  const [promotions, setPromotions] = useState<PosPromotion[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [bankInfo, setBankInfo] = useState({
    bankCode: "MB",
    bankAccountNumber: "08889992468",
    bankAccountName: "PHONG KHAM THU Y ANIMORA",
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [shopProductToAdd, setShopProductToAdd] = useState<string>("");
  const [selectedEventPromoId, setSelectedEventPromoId] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "VIETQR">("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [retailModalOpen, setRetailModalOpen] = useState(false);
  const [retailGuestName, setRetailGuestName] = useState("Khách mua lẻ tại quầy");
  const [retailCart, setRetailCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [paying, setPaying] = useState(false);

  // Schedule state
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadDispatch = async (targetDate = date) => {
    const res = await fetch(`/api/reception/dispatch?date=${targetDate}`);
    if (!res.ok) return;
    const data = await res.json();
    setDoctors(data.doctors || []);
    setBookings(data.bookings || []);
    setEmergencyAlerts(data.emergencyAlerts || []);
    setServices(data.services || []);
    if (data.services?.length && !walkInForm.serviceId) {
      setWalkInForm((f) => ({ ...f, serviceId: data.services[0].id }));
    }
  };

  const loadPos = async () => {
    const res = await fetch("/api/pos/invoices");
    if (!res.ok) return;
    const data = await res.json();
    setPendingInvoices(data.pendingInvoices || []);
    setPaidInvoices(data.paidInvoices || []);
    setPromotions(data.promotions || []);
    setProducts(data.products || []);
    if (data.bankInfo) setBankInfo(data.bankInfo);
    if (data.pendingInvoices?.length && !selectedInvoiceId) {
      setSelectedInvoiceId(data.pendingInvoices[0].id);
    }
    const shopProds = (data.products || []).filter((p: PosProduct) => p.group === "SHOP");
    if (shopProds.length && !shopProductToAdd) {
      setShopProductToAdd(shopProds[0].id);
    }
  };

  const loadSchedules = async () => {
    const res = await fetch("/api/schedules");
    if (!res.ok) return;
    const data = await res.json();
    setLunchBreakEnabled(Boolean(data.lunchBreakEnabled));
    setSchedules(data.schedules || []);
    if (data.doctors) setDoctors(data.doctors);
  };

  useEffect(() => {
    loadDispatch(date);
    loadPos();
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const availableDoctors = doctors.filter((d) => d.workStatus === "AVAILABLE");

  // --- DISPATCH ACTIONS ---
  const handleCheckIn = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CHECKED_IN" }),
    });
    if (res.ok) {
      notify("Đã Check-in! Ca khám đã được đẩy vào Hàng chờ của Bác sĩ.");
      await loadDispatch();
    }
  };

  const handleReassignDoctor = async (bookingId: string, newDoctorId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId: newDoctorId }),
    });
    if (res.ok) {
      notify("Đã chuyển lịch hẹn sang bác sĩ mới!");
      await loadDispatch();
    }
  };

  const handleRescheduleTime = async (bookingId: string) => {
    const newTime = window.prompt("Nhập giờ mới muốn dời (định dạng HH:mm, VD: 17:00):", "17:00");
    if (!newTime || !/^\d{2}:\d{2}$/.test(newTime.trim())) return;
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: newTime.trim() }),
    });
    if (res.ok) {
      notify(`Đã dời lịch sang khung giờ ${newTime.trim()}!`);
      await loadDispatch();
    }
  };

  const handleResolveEmergency = async (leaveId: string) => {
    await fetch(`/api/leaves/${leaveId}/resolve`, { method: "PATCH" });
    notify("Đã đánh dấu xử lý xong cảnh báo nghỉ đột xuất.");
    await loadDispatch();
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/reception/walk-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(walkInForm),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Không thể tạo phiếu tiếp nhận", "err");
      return;
    }
    setWalkInOpen(false);
    setWalkInForm({
      doctorId: "",
      guestName: "",
      guestPhone: "",
      guestPetName: "",
      guestPetSpecies: "DOG",
      guestPetBreed: "",
      serviceId: services[0]?.id || "",
      isEmergency: false,
      notes: "",
    });
    notify(data.message);
    await loadDispatch();
  };

  // --- POS ACTIONS ---
  const activeInvoice = useMemo(
    () => pendingInvoices.find((inv) => inv.id === selectedInvoiceId) || null,
    [pendingInvoices, selectedInvoiceId]
  );

  const selectedEventPromo = useMemo(
    () => promotions.find((p) => p.id === selectedEventPromoId) || null,
    [promotions, selectedEventPromoId]
  );

  const matchedCouponPromo = useMemo(() => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return null;
    return promotions.find((p) => p.code?.toUpperCase() === clean) || null;
  }, [promotions, couponCode]);

  const posTotals = useMemo(() => {
    if (!activeInvoice) {
      return { subtotal: 0, eventDiscountAmount: 0, couponDiscountAmount: 0, totalAmount: 0 };
    }
    return calculateInvoiceTotals(
      activeInvoice.items.map((i) => ({ category: i.category, totalPrice: i.totalPrice })),
      selectedEventPromo,
      matchedCouponPromo && matchedCouponPromo.id !== selectedEventPromo?.id
        ? matchedCouponPromo
        : null
    );
  }, [activeInvoice, selectedEventPromo, matchedCouponPromo]);

  const zeroStockItemsInInvoice = useMemo(() => {
    if (!activeInvoice) return [];
    return activeInvoice.items.filter(
      (i) => i.product && i.product.stockQuantity < i.quantity
    );
  }, [activeInvoice]);

  const handleAddShopToInvoice = async () => {
    if (!activeInvoice || !shopProductToAdd) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_SHOP_PRODUCT",
        productId: shopProductToAdd,
        quantity: 1,
      }),
    });
    if (res.ok) {
      notify("Đã gộp thêm sản phẩm Shop vào hóa đơn (đã ghi Audit Log).");
      await loadPos();
    }
  };

  const handleUpdateInvoiceItemQty = async (itemId: string, quantity: number) => {
    if (!activeInvoice) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_QTY", itemId, quantity }),
    });
    if (res.ok) {
      notify("Đã cập nhật số lượng và lưu vết vào Lịch sử chỉnh sửa (Audit Log).");
      await loadPos();
    }
  };

  const handleRemoveInvoiceItem = async (itemId: string) => {
    if (!activeInvoice) return;
    const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REMOVE_ITEM", itemId }),
    });
    if (res.ok) {
      notify("Đã bỏ mục khỏi hóa đơn và ghi nhận vào Audit Log.");
      await loadPos();
    }
  };

  const handlePayInvoice = async () => {
    if (!activeInvoice) return;
    setPaying(true);
    try {
      const cashVal =
        paymentMethod === "CASH"
          ? Number(cashReceived || posTotals.totalAmount)
          : undefined;
      const res = await fetch(`/api/pos/invoices/${activeInvoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          eventPromoId: selectedEventPromoId || null,
          couponCode: couponCode.trim() || null,
          cashReceived: cashVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Thanh toán thất bại", "err");
      } else {
        notify(data.message);
        setSelectedInvoiceId(null);
        setSelectedEventPromoId("");
        setCouponCode("");
        setCashReceived("");
        await loadPos();
      }
    } finally {
      setPaying(false);
    }
  };

  const handleCreateRetailInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retailCart.length === 0) {
      notify("Vui lòng chọn ít nhất 1 sản phẩm Shop", "err");
      return;
    }
    const res = await fetch("/api/pos/retail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: retailGuestName, items: retailCart }),
    });
    const data = await res.json();
    if (res.ok) {
      setRetailModalOpen(false);
      setRetailCart([]);
      await loadPos();
      setSelectedInvoiceId(data.invoice.id);
      notify(`Đã tạo hóa đơn bán lẻ ${data.invoice.invoiceCode}!`);
    }
  };

  // --- SCHEDULE ACTIONS ---
  const toggleShift = (doctorId: string, dayOfWeek: number, field: "morningShift" | "afternoonShift") => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek);
      if (idx === -1) {
        return [
          ...prev,
          {
            doctorId,
            dayOfWeek,
            morningShift: field === "morningShift" ? false : true,
            afternoonShift: field === "afternoonShift" ? false : true,
          },
        ];
      }
      return prev.map((s, i) => (i === idx ? { ...s, [field]: !s[field] } : s));
    });
  };

  const handleSaveSchedules = async () => {
    setSavingSchedule(true);
    const res = await fetch("/api/schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lunchBreakEnabled, schedules }),
    });
    setSavingSchedule(false);
    if (res.ok) {
      notify("Đã lưu lịch trực tuần và cài đặt nghỉ trưa (12:00–13:30)!");
    }
  };

  const shopProducts = products.filter((p) => p.group === "SHOP");

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

      {/* Thanh chuyển tab nghiệp vụ Lễ tân */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
          <button
            onClick={() => setTab("DISPATCH")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "DISPATCH"
                ? "bg-[#0F766E] text-white"
                : "text-[#476268] hover:text-[#132A2E]"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            Điều phối & Check-in ({bookings.length})
            {emergencyAlerts.length > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white">
                {emergencyAlerts.length} KHẨN
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("POS")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "POS"
                ? "bg-[#F97316] text-white"
                : "text-[#476268] hover:text-[#132A2E]"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Thu ngân POS & Bán lẻ ({pendingInvoices.length} chờ thu)
          </button>

          <button
            onClick={() => setTab("SCHEDULE")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "SCHEDULE"
                ? "bg-[#132A2E] text-white"
                : "text-[#476268] hover:text-[#132A2E]"
            }`}
          >
            <Clock className="h-4 w-4" />
            Lịch trực tuần & Nghỉ trưa
          </button>
        </div>

        <button
          onClick={() => {
            loadDispatch();
            loadPos();
            loadSchedules();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới dữ liệu
        </button>
      </div>

      {/* =====================================================================
          TAB 1: ĐIỀU PHỐI, CẢNH BÁO NGHỈ ĐỘT XUẤT, QUÁ 20 PHÚT & WALK-IN
         ===================================================================== */}
      {tab === "DISPATCH" && (
        <div className="space-y-6">
          {/* CẢNH BÁO KHẨN MÀU ĐỎ — BÁC SĨ NGHỈ ĐỘT XUẤT */}
          {emergencyAlerts.length > 0 && (
            <div className="rounded-3xl border-2 border-rose-500 bg-rose-50 p-6 shadow-md">
              <div className="flex items-center gap-2.5 text-rose-800">
                <ShieldAlert className="h-6 w-6 animate-pulse text-rose-600" />
                <h2 className="text-lg font-extrabold">
                  CẢNH BÁO KHẨN: Bác sĩ báo sự cố nghỉ đột xuất trùng lịch khách!
                </h2>
              </div>

              <div className="mt-4 space-y-4">
                {emergencyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-rose-200 bg-white p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-rose-700">
                          {alert.doctor.fullName} — Nghỉ đột xuất ngày {alert.leaveDate} (
                          {alert.shift === "MORNING"
                            ? "Ca sáng"
                            : alert.shift === "AFTERNOON"
                            ? "Ca chiều"
                            : "Cả ngày"}
                          )
                        </p>
                        <p className="text-xs text-[#476268]">Lý do: {alert.reason}</p>
                      </div>
                      <button
                        onClick={() => handleResolveEmergency(alert.id)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                      >
                        Đã xử lý xong
                      </button>
                    </div>

                    {alert.affectedBookings.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold text-rose-800">
                          Các lịch hẹn bị ảnh hưởng ({alert.affectedBookings.length}):
                        </p>
                        {alert.affectedBookings.map((ab) => (
                          <div
                            key={ab.id}
                            className="flex items-center justify-between rounded-xl bg-rose-50/70 px-4 py-2.5 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-rose-700">
                                {ab.bookingCode}
                              </span>{" "}
                              • {ab.startTime}–{ab.endTime} •{" "}
                              <strong>
                                {ab.isGuest ? ab.guestName : ab.customer?.fullName}
                              </strong>{" "}
                              ({ab.isGuest ? ab.guestPhone : ab.customer?.phone})
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleReassignDoctor(ab.id, e.target.value);
                                  }
                                }}
                                className="rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-bold text-[#132A2E]"
                              >
                                <option value="" disabled>
                                  Chuyển bác sĩ khác...
                                </option>
                                {doctors
                                  .filter((d) => d.id !== alert.doctorId)
                                  .map((d) => (
                                    <option key={d.id} value={d.id}>
                                      Chuyển → {d.fullName}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleRescheduleTime(ab.id)}
                                className="rounded-lg border border-[#0F766E] bg-white px-3 py-1.5 font-bold text-[#0F766E] hover:bg-[#0F766E]/10"
                              >
                                Dời lịch
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-emerald-700 font-semibold">
                        Không còn lịch hẹn nào trùng ca nghỉ này.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BẢNG TRẠNG THÁI BÁC SĨ TRỰC TIẾP + NÚT WALK-IN/CẤP CỨU */}
          <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#132A2E]">
                  Bảng trạng thái Bác sĩ trực tiếp (Live Status)
                </h2>
                <p className="text-xs text-[#476268]">
                  Hệ thống CHỈ cho phép đẩy ca Walk-in / Cấp cứu vào bác sĩ đang ở trạng thái{" "}
                  <strong className="text-emerald-700">Đang trống</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  setWalkInForm((f) => ({
                    ...f,
                    doctorId: availableDoctors[0]?.id || "",
                  }));
                  setWalkInOpen(true);
                }}
                disabled={availableDoctors.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Tạo phiếu tiếp nhận nhanh (Walk-in / Cấp cứu)
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              {doctors.map((doc) => {
                const st = formatWorkStatus(doc.workStatus);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-2xl border border-[#132A2E]/10 bg-[#FAF9F6] p-4"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#132A2E]">{doc.fullName}</p>
                      <p className="text-xs text-[#476268]">{doc.title || "Bác sĩ Thú y"}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-extrabold ${st.colorClass}`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORM TẠO PHIẾU WALK-IN / CẤP CỨU */}
          {walkInOpen && (
            <form
              onSubmit={handleCreateWalkIn}
              className="rounded-3xl border-2 border-[#F97316]/40 bg-white p-7 shadow-lg"
            >
              <h3 className="text-lg font-extrabold text-[#F97316]">
                Phiếu tiếp nhận nhanh (Walk-in / Cấp cứu) — Chống trùng phiếu
              </h3>
              <p className="text-xs text-[#476268]">
                Chỉ hiển thị các bác sĩ đang ở trạng thái <strong>Đang trống</strong>. Phiếu tạo xong sẽ đẩy thẳng vào Hàng chờ khám của bác sĩ.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Bác sĩ tiếp nhận (chỉ Đang trống) *
                  </label>
                  <select
                    required
                    value={walkInForm.doctorId}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, doctorId: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm font-bold"
                  >
                    {availableDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (Đang trống)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Tên chủ nuôi *</label>
                  <input
                    required
                    value={walkInForm.guestName}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, guestName: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Số điện thoại *</label>
                  <input
                    required
                    value={walkInForm.guestPhone}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, guestPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm"
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
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Loài</label>
                  <select
                    value={walkInForm.guestPetSpecies}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, guestPetSpecies: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm"
                  >
                    <option value="DOG">Chó</option>
                    <option value="CAT">Mèo</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Dịch vụ ban đầu *</label>
                  <select
                    required
                    value={walkInForm.serviceId}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, serviceId: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatVnd(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">
                  <input
                    type="checkbox"
                    checked={walkInForm.isEmergency}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, isEmergency: e.target.checked })
                    }
                    className="h-4 w-4 accent-rose-600"
                  />
                  Đánh dấu ca CẤP CỨU ưu tiên
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F97316] px-5 py-2 text-sm font-bold text-white"
                  >
                    Đẩy vào phòng Bác sĩ
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* DANH SÁCH LỊCH HẸN TRONG NGÀY (TÔ ĐỎ QUÁ 20 PHÚT) */}
          <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#132A2E]">
                  Lịch hẹn trong ngày ({date})
                </h2>
                <p className="text-xs text-[#476268]">
                  Dòng tô <strong className="text-rose-600">Màu Đỏ</strong> là lịch hẹn đã quá 20 phút mà khách chưa Check-in.
                </p>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm font-bold"
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#132A2E]/10 text-xs uppercase text-[#476268]">
                    <th className="py-3 pr-3">Mã / Giờ</th>
                    <th className="py-3 pr-3">Khách hàng</th>
                    <th className="py-3 pr-3">Thú cưng & Dịch vụ</th>
                    <th className="py-3 pr-3">Bác sĩ</th>
                    <th className="py-3 pr-3">Trạng thái</th>
                    <th className="py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A2E]/8">
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className={
                        b.isLate20Min
                          ? "bg-rose-50 text-rose-950"
                          : "hover:bg-[#FAF9F6]"
                      }
                    >
                      <td className="py-3.5 pr-3">
                        <span className="font-mono font-extrabold text-[#0F766E]">
                          {b.bookingCode}
                        </span>
                        <p className="text-xs font-bold">
                          {b.startTime} – {b.endTime}
                        </p>
                        {b.isLate20Min && (
                          <span className="mt-1 inline-block rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            TRỄ QUÁ 20 PHÚT
                          </span>
                        )}
                        {b.isEmergency && (
                          <span className="mt-1 inline-block rounded bg-rose-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            CẤP CỨU
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-3">
                        <p className="font-bold">
                          {b.isGuest ? b.guestName : b.customer?.fullName}
                        </p>
                        <p className="text-xs text-[#476268]">
                          {b.isGuest ? `${b.guestPhone} (Vãng lai)` : b.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3.5 pr-3 text-xs">
                        {b.pets.map((p) => (
                          <div key={p.id} className="mb-1">
                            <strong>
                              {p.pet ? p.pet.name : p.guestPetName} (
                              {formatSpecies(p.pet ? p.pet.species : p.guestPetSpecies || "DOG")})
                            </strong>
                            :{" "}
                            {p.services.map((s) => s.serviceName).join(", ")}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 pr-3 text-xs font-bold">
                        {b.doctor?.fullName || "Chưa gán"}
                      </td>
                      <td className="py-3.5 pr-3 text-xs font-bold">{b.status}</td>
                      <td className="py-3.5 text-right">
                        {b.status === "CONFIRMED" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0B5D56]"
                            >
                              Khách đã đến
                            </button>
                            <button
                              onClick={() => handleRescheduleTime(b.id)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                            >
                              Dời giờ
                            </button>
                          </div>
                        )}
                        {b.status === "CHECKED_IN" && (
                          <span className="text-xs font-bold text-blue-700">
                            Đã vào hàng chờ BS
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-[#476268]">
                        Chưa có lịch hẹn nào trong ngày {date}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: THU NGÂN POS, BÁN LẺ SHOP, AUDIT LOG, MULTI-PROMO, VIETQR/CASH
         ===================================================================== */}
      {tab === "POS" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Cột trái 4 cột: Danh sách phiếu chờ thanh toán + Nút Bán lẻ Shop */}
          <div className="col-span-4 space-y-4">
            <button
              onClick={() => setRetailModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#0B5D56]"
            >
              <ShoppingBag className="h-4 w-4" />
              + Tạo phiếu Bán lẻ Shop nhanh
            </button>

            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#476268]">
                Phiếu chờ thanh toán ({pendingInvoices.length})
              </h3>
              <div className="mt-3 space-y-2.5">
                {pendingInvoices.length === 0 && (
                  <p className="text-xs text-[#476268]">
                    Hiện không có phiếu nào chờ thu tiền.
                  </p>
                )}
                {pendingInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setCashReceived("");
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedInvoiceId === inv.id
                        ? "border-[#F97316] bg-[#F97316]/8 shadow-xs"
                        : "border-[#132A2E]/10 bg-[#FAF9F6] hover:border-[#0F766E]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-extrabold text-[#0F766E]">
                        {inv.invoiceCode}
                      </span>
                      <span className="text-sm font-extrabold text-[#F97316]">
                        {formatVnd(inv.subtotal)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#132A2E]">
                      {inv.customer ? inv.customer.fullName : inv.guestName}
                    </p>
                    <p className="text-[11px] text-[#476268]">
                      {inv.petSummary || "Mua lẻ Shop"} •{" "}
                      {inv.doctor ? `BS: ${inv.doctor.fullName}` : "Bán lẻ tại quầy"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách hóa đơn đã thu gần đây */}
            <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#476268]">
                Đã thu gần đây ({paidInvoices.length})
              </h3>
              <div className="mt-3 space-y-2">
                {paidInvoices.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl bg-[#FAF9F6] px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#0F766E]">
                        {inv.invoiceCode}
                      </span>{" "}
                      • {inv.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
                    </div>
                    <span className="font-extrabold text-[#132A2E]">
                      {formatVnd(inv.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải 8 cột: Chi tiết thu ngân POS */}
          <div className="col-span-8">
            {retailModalOpen && (
              <form
                onSubmit={handleCreateRetailInvoice}
                className="mb-6 rounded-3xl border-2 border-[#0F766E]/40 bg-white p-6 shadow-md"
              >
                <h3 className="text-lg font-extrabold text-[#0F766E]">
                  Bán lẻ Shop nhanh (Không khám bệnh)
                </h3>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-bold">Tên khách mua lẻ</label>
                  <input
                    value={retailGuestName}
                    onChange={(e) => setRetailGuestName(e.target.value)}
                    className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {shopProducts.map((p) => {
                    const inCart = retailCart.find((c) => c.productId === p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-[#132A2E]/10 bg-[#FAF9F6] p-3 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-bold">{p.name}</p>
                          <p className="text-[#476268]">
                            {formatVnd(p.price)} •{" "}
                            <span
                              className={
                                p.stockQuantity <= 0
                                  ? "font-bold text-rose-600"
                                  : "text-emerald-700"
                              }
                            >
                              Tồn: {p.stockQuantity} {p.retailUnit}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setRetailCart((prev) =>
                              inCart
                                ? prev.map((c) =>
                                    c.productId === p.id
                                      ? { ...c, quantity: c.quantity + 1 }
                                      : c
                                  )
                                : [...prev, { productId: p.id, quantity: 1 }]
                            )
                          }
                          className="shrink-0 rounded-lg bg-[#0F766E] px-2.5 py-1.5 font-bold text-white"
                        >
                          {inCart ? `+1 (${inCart.quantity})` : "Thêm"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRetailModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F97316] px-5 py-2 text-xs font-bold text-white"
                  >
                    Tạo phiếu thu ngân ({retailCart.reduce((s, c) => s + c.quantity, 0)} món)
                  </button>
                </div>
              </form>
            )}

            {!activeInvoice ? (
              <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-12 text-center text-sm text-[#476268]">
                Chọn một phiếu chờ thanh toán bên trái hoặc tạo phiếu Bán lẻ Shop mới.
              </div>
            ) : (
              <div className="rounded-3xl border border-[#0F766E]/20 bg-white p-7 shadow-md space-y-6">
                {/* Header hóa đơn */}
                <div className="flex items-start justify-between border-b border-[#132A2E]/10 pb-4">
                  <div>
                    <span className="font-mono text-2xl font-extrabold text-[#0F766E]">
                      {activeInvoice.invoiceCode}
                    </span>
                    <p className="mt-1 text-sm text-[#476268]">
                      Khách:{" "}
                      <strong className="text-[#132A2E]">
                        {activeInvoice.customer
                          ? activeInvoice.customer.fullName
                          : activeInvoice.guestName}
                      </strong>{" "}
                      • {activeInvoice.petSummary}
                    </p>
                  </div>
                  {activeInvoice.medicalRecord && (
                    <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200">
                      Bệnh án {activeInvoice.medicalRecord.recordCode} sẽ KHÓA CỨNG khi thu tiền
                    </span>
                  )}
                </div>

                {/* CẢNH BÁO ĐỎ TỒN KHO = 0 (VẪN CHO PHÉP THANH TOÁN - TỒN ÂM TẠM THỜI) */}
                {zeroStockItemsInInvoice.length > 0 && (
                  <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div>
                      <p className="text-sm font-extrabold">
                        CẢNH BÁO TỒN KHO BẰNG 0 / KHÔNG ĐỦ TRÊN HỆ THỐNG!
                      </p>
                      <p className="mt-0.5 font-normal">
                        Mặt hàng:{" "}
                        {zeroStockItemsInInvoice
                          .map(
                            (i) =>
                              `${i.name} (tồn hiện tại: ${i.product?.stockQuantity ?? 0}, cần: ${i.quantity})`
                          )
                          .join("; ")}
                        . Hệ thống VẪN CHO PHÉP thanh toán (chấp nhận tồn kho âm tạm thời) để không làm gián đoạn khách.
                      </p>
                    </div>
                  </div>
                )}

                {/* Gộp thêm hàng Shop vào hóa đơn khám */}
                <div className="flex items-center gap-2 rounded-2xl bg-[#FAF9F6] p-3.5">
                  <select
                    value={shopProductToAdd}
                    onChange={(e) => setShopProductToAdd(e.target.value)}
                    className="flex-1 rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    {shopProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        [SHOP] {p.name} — {formatVnd(p.price)} (Tồn: {p.stockQuantity}{" "}
                        {p.retailUnit})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddShopToInvoice}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B5D56]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Gộp hàng Shop
                  </button>
                </div>

                {/* Bảng chi tiết món (Cho phép sửa/bỏ thuốc -> ghi Audit Log) */}
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#132A2E]/10 uppercase text-[#476268]">
                      <th className="py-2">Hạng mục</th>
                      <th className="py-2">Đơn giá</th>
                      <th className="py-2">Số lượng</th>
                      <th className="py-2 text-right">Thành tiền</th>
                      <th className="py-2 text-right">Sửa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A2E]/8">
                    {activeInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-[#132A2E]">{item.name}</p>
                          <p className="text-[11px] text-[#476268]">
                            {item.itemType === "SERVICE"
                              ? "Dịch vụ"
                              : item.itemType === "MEDICINE"
                              ? "Thuốc kê đơn"
                              : "Sản phẩm Shop"}
                            {item.product && (
                              <span
                                className={
                                  item.product.stockQuantity <= 0
                                    ? " ml-2 font-bold text-rose-600"
                                    : " ml-2 text-emerald-700"
                                }
                              >
                                (Tồn kho: {item.product.stockQuantity} {item.unit})
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="py-2.5">{formatVnd(item.unitPrice)}</td>
                        <td className="py-2.5">
                          {item.itemType !== "SERVICE" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleUpdateInvoiceItemQty(item.id, item.quantity - 1)
                                }
                                className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateInvoiceItemQty(item.id, item.quantity + 1)
                                }
                                className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-bold">
                          {formatVnd(item.totalPrice)}
                        </td>
                        <td className="py-2.5 text-right">
                          {item.itemType !== "SERVICE" && (
                            <button
                              onClick={() => handleRemoveInvoiceItem(item.id)}
                              title="Bỏ thuốc/sản phẩm (lưu Audit Log)"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* LỊCH SỬ CHỈNH SỬA (AUDIT LOG) */}
                {activeInvoice.auditLogs.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                      <History className="h-4 w-4" />
                      Lịch sử chỉnh sửa tại quầy (Audit Log):
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-950">
                      {activeInvoice.auditLogs.map((log) => (
                        <li key={log.id}>
                          • <strong>{log.actorName}</strong> ({formatDateVn(log.createdAt)}):{" "}
                          <strong>{log.action}</strong> — {log.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ÁP DỤNG ĐA KHUYẾN MÃI (SỰ KIỆN TRƯỚC -> MÃ GIẢM GIÁ SAU) */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF9F6] p-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                      1. Ưu đãi Sự kiện / Dịch vụ (trừ trước)
                    </label>
                    <select
                      value={selectedEventPromoId}
                      onChange={(e) => setSelectedEventPromoId(e.target.value)}
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 text-xs font-semibold"
                    >
                      <option value="">Không áp dụng sự kiện</option>
                      {promotions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (
                          {p.discountType === "PERCENT"
                            ? `-${p.discountValue}%`
                            : `-${formatVnd(p.discountValue)}`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#132A2E]">
                      2. Mã giảm giá cộng dồn (trừ sau, VD: MEMBER10)
                    </label>
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã VD: MEMBER10"
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3 py-2 font-mono text-xs font-bold uppercase"
                    />
                  </div>
                </div>

                {/* BẢNG TỔNG KẾT TIỀN */}
                <div className="space-y-1.5 rounded-2xl border border-[#0F766E]/15 bg-white p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#476268]">Tạm tính</span>
                    <span className="font-bold">{formatVnd(posTotals.subtotal)}</span>
                  </div>
                  {posTotals.eventDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm ưu đãi sự kiện (bước 1)</span>
                      <span className="font-bold">
                        -{formatVnd(posTotals.eventDiscountAmount)}
                      </span>
                    </div>
                  )}
                  {posTotals.couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm mã ưu đãi cộng dồn (bước 2)</span>
                      <span className="font-bold">
                        -{formatVnd(posTotals.couponDiscountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#132A2E]/10 pt-2 text-lg font-extrabold text-[#0F766E]">
                    <span>Tổng khách phải thanh toán</span>
                    <span>{formatVnd(posTotals.totalAmount)}</span>
                  </div>
                </div>

                {/* CHỌN 1 TRONG 2 PHƯƠNG THỨC: TIỀN MẶT HOẶC VIETQR */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                        paymentMethod === "CASH"
                          ? "border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]"
                          : "border-slate-200 text-[#476268]"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                      Tiền mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VIETQR")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                        paymentMethod === "VIETQR"
                          ? "border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]"
                          : "border-slate-200 text-[#476268]"
                      }`}
                    >
                      <QrCode className="h-5 w-5" />
                      Chuyển khoản VietQR tĩnh
                    </button>
                  </div>

                  {paymentMethod === "CASH" ? (
                    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF9F6] p-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold">
                          Tiền khách đưa (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder={String(posTotals.totalAmount)}
                          className="w-full rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2.5 text-sm font-bold"
                        />
                      </div>
                      <div className="flex flex-col justify-center rounded-xl bg-white px-4 py-2 border border-[#132A2E]/10">
                        <span className="text-xs text-[#476268]">Tiền thối lại khách</span>
                        <span className="text-xl font-extrabold text-[#F97316]">
                          {formatVnd(
                            Math.max(
                              0,
                              Number(cashReceived || posTotals.totalAmount) -
                                posTotals.totalAmount
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6 rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildVietQrUrl({
                          bankCode: bankInfo.bankCode,
                          accountNumber: bankInfo.bankAccountNumber,
                          accountName: bankInfo.bankAccountName,
                          amount: posTotals.totalAmount,
                          invoiceCode: activeInvoice.invoiceCode,
                        })}
                        alt="Mã VietQR thanh toán ANIMORA"
                        className="h-44 w-44 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                      />
                      <div className="space-y-1.5 text-xs">
                        <p className="text-sm font-extrabold text-[#0F766E]">
                          Quét mã VietQR — Đã điền sẵn số tiền & nội dung
                        </p>
                        <p>
                          Ngân hàng: <strong>{bankInfo.bankCode}</strong> • STK:{" "}
                          <strong className="font-mono">{bankInfo.bankAccountNumber}</strong>
                        </p>
                        <p>
                          Chủ tài khoản: <strong>{bankInfo.bankAccountName}</strong>
                        </p>
                        <p>
                          Số tiền:{" "}
                          <strong className="text-base text-[#F97316]">
                            {formatVnd(posTotals.totalAmount)}
                          </strong>
                        </p>
                        <p>
                          Nội dung CK:{" "}
                          <strong className="font-mono">
                            ANIMORA {activeInvoice.invoiceCode}
                          </strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePayInvoice}
                    disabled={paying}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-4 text-base font-extrabold text-white shadow-lg shadow-[#F97316]/25 transition hover:bg-[#EA580C] disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {paying
                      ? "Đang xác nhận thu tiền & trừ kho FEFO..."
                      : "Xác nhận đã thu (Trừ kho FEFO & Khóa bệnh án S.O.A.P)"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: LỊCH TRỰC CỐ ĐỊNH HÀNG TUẦN & CÔNG TẮC NGHỈ TRƯA
         ===================================================================== */}
      {tab === "SCHEDULE" && (
        <div className="rounded-3xl border border-[#0F766E]/15 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                Thiết lập Lịch trực tuần Bác sĩ (2 ca xoay vòng)
              </h2>
              <p className="text-xs text-[#476268]">
                Ca sáng: 07:00 – 13:30 • Ca chiều: 13:30 – 20:00 (không phân tách tay nghề Y tế / Spa).
              </p>
            </div>
            <button
              onClick={handleSaveSchedules}
              disabled={savingSchedule}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0B5D56]"
            >
              <Save className="h-4 w-4" />
              {savingSchedule ? "Đang lưu..." : "Lưu lịch trực & Cài đặt"}
            </button>
          </div>

          {/* Công tắc Bật/Tắt Nghỉ trưa 12:00 - 13:30 */}
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div>
              <p className="text-sm font-extrabold text-[#132A2E]">
                Khung giờ Nghỉ trưa phòng khám (12:00 – 13:30)
              </p>
              <p className="text-xs text-[#476268]">
                Khi BẬT, trang Đặt lịch online sẽ tự động khóa toàn bộ các ô từ 12:00 đến 13:30.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLunchBreakEnabled((v) => !v)}
              className={`rounded-full px-5 py-2 text-xs font-extrabold transition ${
                lunchBreakEnabled
                  ? "bg-[#F97316] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {lunchBreakEnabled ? "ĐANG BẬT NGHỈ TRƯA" : "ĐANG TẮT (Mở xuyên trưa)"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A2E]/10 text-[#476268]">
                  <th className="py-3 pr-4">Bác sĩ</th>
                  {DAYS_VN.map((day) => (
                    <th key={day} className="px-2 py-3 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A2E]/10">
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-4 pr-4 font-extrabold text-[#132A2E]">
                      {doc.fullName}
                    </td>
                    {DAYS_VN.map((_, dow) => {
                      const row = schedules.find(
                        (s) => s.doctorId === doc.id && s.dayOfWeek === dow
                      );
                      const m = row ? row.morningShift : true;
                      const a = row ? row.afternoonShift : true;
                      return (
                        <td key={dow} className="px-2 py-3 text-center">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleShift(doc.id, dow, "morningShift")}
                              className={`rounded-lg px-2 py-1 font-bold transition ${
                                m
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-400 line-through"
                              }`}
                            >
                              Sáng
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleShift(doc.id, dow, "afternoonShift")}
                              className={`rounded-lg px-2 py-1 font-bold transition ${
                                a
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-slate-100 text-slate-400 line-through"
                              }`}
                            >
                              Chiều
                            </button>
                          </div>
                        </td>
                      );
                    })}
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
