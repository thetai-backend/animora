import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTimeVn, formatVnd } from "@/lib/format";
import { PrintTriggerBar } from "@/components/print/PrintTriggerBar";

export const dynamic = "force-dynamic";

export default async function PrintInvoiceA4Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap");
  }

  const { id } = await params;

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, address: true, email: true } },
        doctor: { select: { fullName: true, title: true } },
        cashier: { select: { fullName: true } },
        medicalRecord: { select: { id: true, recordCode: true } },
        items: true,
      },
    }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!invoice) {
    notFound();
  }

  if (session.role === "CUSTOMER" && invoice.customerId !== session.userId) {
    redirect("/tai-khoan?notice=khong-du-quyen");
  }

  const clinic = {
    name: settings?.clinicName || "Phòng khám Thú y ANIMORA",
    tagline: settings?.tagline || "Chăm sóc bằng chuẩn y khoa — Yêu thương như người nhà",
    address:
      settings?.address ||
      "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    phone: settings?.phone || "028 3890 2468",
    email: settings?.email || "cskh@animora.vn",
    openTime: settings?.openTime || "07:00",
    closeTime: settings?.closeTime || "20:00",
  };

  const customerName = invoice.customer?.fullName || invoice.guestName || "Khách vãng lai";
  const customerPhone = invoice.customer?.phone || invoice.guestPhone || "—";

  return (
    <div className="min-h-screen bg-[#E9ECEF] pb-16 text-[#132A2E] print:bg-white print:pb-0">
      <PrintTriggerBar
        title={`Xem trước bản in A4 — Hóa đơn ${invoice.invoiceCode}`}
        backHref="/le-tan"
      />

      <div className="print-a4-sheet mx-auto mt-8 w-[210mm] min-h-[297mm] rounded-xl border border-slate-200 bg-white p-[14mm] shadow-2xl print:mt-0 print:min-h-0 print:rounded-none">
        {/* Header Thương hiệu ANIMORA */}
        <div className="flex items-start justify-between border-b-2 border-[#0F766E] pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F766E] text-white">
              <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <path
                  d="M12 34V22C12 15.3726 17.3726 10 24 10C30.6274 10 36 15.3726 36 22V34"
                  stroke="white"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="24" r="4.5" fill="#F97316" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-heading text-2xl font-extrabold tracking-widest text-[#0F766E]">
                <span>AN</span>
                <span className="relative">
                  I
                  <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#F97316]" />
                </span>
                <span>MORA</span>
              </div>
              <p className="text-xs font-bold text-[#132A2E]">{clinic.name}</p>
              <p className="mt-0.5 text-[11px] text-[#476268]">{clinic.address}</p>
              <p className="text-[11px] text-[#476268]">
                Hotline: <strong>{clinic.phone}</strong> • Email: {clinic.email} • Giờ mở cửa:{" "}
                {clinic.openTime} – {clinic.closeTime}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-lg bg-[#0F766E]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0F766E]">
              {invoice.type === "RETAIL" ? "Hóa đơn Bán lẻ Shop" : "Hóa đơn Khám & Điều trị"}
            </span>
            <p className="mt-2 font-mono text-xl font-extrabold text-[#132A2E]">
              {invoice.invoiceCode}
            </p>
            <p className="mt-0.5 text-[11px] text-[#476268]">
              Ngày lập: {formatDateTimeVn(invoice.paidAt || invoice.createdAt)}
            </p>
            {invoice.status === "CANCELLED" && (
              <span className="mt-1 inline-block rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                ĐÃ HỦY HÓA ĐƠN
              </span>
            )}
          </div>
        </div>

        {/* Tiêu đề chính */}
        <div className="my-6 text-center">
          <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-[#132A2E]">
            HÓA ĐƠN THANH TOÁN
          </h1>
          <p className="mt-0.5 text-xs italic text-[#476268]">{clinic.tagline}</p>
        </div>

        {/* Thông tin khách hàng & ca khám */}
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#0F766E]/15 bg-[#FAF9F6] p-4 text-xs">
          <div className="space-y-1">
            <p>
              <span className="text-[#476268]">Khách hàng:</span>{" "}
              <strong className="text-[#132A2E]">{customerName}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Số điện thoại:</span>{" "}
              <strong>{customerPhone}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Thú cưng / Nội dung:</span>{" "}
              <strong>{invoice.petSummary || "Mua lẻ sản phẩm tại Shop"}</strong>
            </p>
          </div>
          <div className="space-y-1">
            <p>
              <span className="text-[#476268]">Bác sĩ phụ trách:</span>{" "}
              <strong>{invoice.doctor?.fullName || "Bán lẻ tại quầy"}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Thu ngân lập phiếu:</span>{" "}
              <strong>{invoice.cashier?.fullName || "Quầy Lễ tân ANIMORA"}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Mã bệnh án liên kết:</span>{" "}
              <strong className="font-mono">{invoice.medicalRecord?.recordCode || "Không có"}</strong>
            </p>
          </div>
        </div>

        {/* Bảng chi tiết hạng mục */}
        <table className="mt-6 w-full border-collapse text-xs">
          <thead>
            <tr className="border-y-2 border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]">
              <th className="px-3 py-2.5 text-left font-extrabold">STT</th>
              <th className="px-3 py-2.5 text-left font-extrabold">Hạng mục Dịch vụ / Thuốc / Sản phẩm</th>
              <th className="px-3 py-2.5 text-center font-extrabold">Phân loại</th>
              <th className="px-3 py-2.5 text-center font-extrabold">ĐVT</th>
              <th className="px-3 py-2.5 text-center font-extrabold">SL</th>
              <th className="px-3 py-2.5 text-right font-extrabold">Đơn giá</th>
              <th className="px-3 py-2.5 text-right font-extrabold">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-3 py-2.5 text-center font-semibold">{idx + 1}</td>
                <td className="px-3 py-2.5">
                  <p className="font-bold text-[#132A2E]">{item.name}</p>
                  {item.dosageInstruction && (
                    <p className="text-[10px] italic text-[#476268]">
                      HDSD: {item.dosageInstruction}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center text-[11px] text-[#476268]">
                  {item.category === "MEDICAL"
                    ? "Y tế"
                    : item.category === "SPA"
                    ? "Spa"
                    : item.category === "MEDICINE"
                    ? "Thuốc"
                    : "Shop"}
                </td>
                <td className="px-3 py-2.5 text-center">{item.unit}</td>
                <td className="px-3 py-2.5 text-center font-bold">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right">{formatVnd(item.unitPrice)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#132A2E]">
                  {formatVnd(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tổng kết tài chính */}
        <div className="mt-6 flex justify-between gap-8">
          <div className="flex-1 rounded-2xl border border-slate-200 p-4 text-xs space-y-1.5">
            <p className="font-extrabold uppercase text-[#0F766E]">Thông tin thanh toán</p>
            <p>
              Phương thức:{" "}
              <strong>
                {invoice.paymentMethod === "VIETQR"
                  ? "Chuyển khoản ngân hàng (VietQR)"
                  : invoice.paymentMethod === "CASH"
                  ? "Tiền mặt tại quầy"
                  : "Chờ thanh toán"}
              </strong>
            </p>
            {invoice.paymentMethod === "CASH" && invoice.cashReceived !== null && (
              <>
                <p>
                  Tiền khách đưa: <strong>{formatVnd(invoice.cashReceived)}</strong>
                </p>
                <p>
                  Tiền thối lại: <strong>{formatVnd(invoice.cashChange || 0)}</strong>
                </p>
              </>
            )}
            <p>
              Trạng thái:{" "}
              <strong
                className={
                  invoice.status === "PAID"
                    ? "text-emerald-700"
                    : invoice.status === "CANCELLED"
                    ? "text-rose-700"
                    : "text-amber-700"
                }
              >
                {invoice.status === "PAID"
                  ? "ĐÃ THANH TOÁN ĐỦ"
                  : invoice.status === "CANCELLED"
                  ? `ĐÃ HỦY (${invoice.cancelReason || ""})`
                  : "CHỜ THANH TOÁN"}
              </strong>
            </p>
          </div>

          <div className="w-80 space-y-2 rounded-2xl border border-[#0F766E]/20 bg-[#FAF9F6] p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[#476268]">Tạm tính:</span>
              <span className="font-bold">{formatVnd(invoice.subtotal)}</span>
            </div>
            {invoice.eventDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Ưu đãi sự kiện ({invoice.appliedEventPromoTitle || "Sự kiện"}):</span>
                <span className="font-bold">-{formatVnd(invoice.eventDiscountAmount)}</span>
              </div>
            )}
            {invoice.couponDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Mã ưu đãi ({invoice.appliedCouponCode}):</span>
                <span className="font-bold">-{formatVnd(invoice.couponDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-[#0F766E] pt-2.5 text-base font-extrabold text-[#0F766E]">
              <span>TỔNG THANH TOÁN:</span>
              <span>{formatVnd(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Chữ ký 2 bên */}
        <div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs">
          <div>
            <p className="font-extrabold uppercase">Khách hàng</p>
            <p className="italic text-[#476268]">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold">{customerName}</p>
          </div>
          <div>
            <p className="font-extrabold uppercase">Thu ngân / Đại diện Phòng khám</p>
            <p className="italic text-[#476268]">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold">{invoice.cashier?.fullName || "Phòng khám Thú y ANIMORA"}</p>
          </div>
        </div>

        <p className="mt-10 border-t border-slate-200 pt-3 text-center text-[11px] text-[#476268]">
          Cảm ơn Quý khách đã tin tưởng Phòng khám Thú y ANIMORA! Vui lòng giữ lại hóa đơn khi cần đối chiếu hoặc tái khám.
        </p>
      </div>
    </div>
  );
}
