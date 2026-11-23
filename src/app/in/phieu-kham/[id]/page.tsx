import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTimeVn, formatDateVn, formatGender, formatSpecies } from "@/lib/format";
import { PrintTriggerBar } from "@/components/print/PrintTriggerBar";

export const dynamic = "force-dynamic";

export default async function PrintMedicalRecordA4Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap");
  }

  const { id } = await params;

  const [record, settings] = await Promise.all([
    prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        doctor: { select: { fullName: true, title: true, specialty: true } },
        customer: { select: { id: true, fullName: true, phone: true, address: true } },
        pet: true,
        addendums: { orderBy: { createdAt: "asc" } },
        invoice: {
          include: {
            items: true,
          },
        },
      },
    }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!record) {
    notFound();
  }

  if (session.role === "CUSTOMER" && record.customerId !== session.userId) {
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
  };

  const ownerName = record.customer?.fullName || record.guestOwnerName || "Khách vãng lai";
  const ownerPhone = record.customer?.phone || record.guestOwnerPhone || "—";
  const petName = record.pet?.name || record.guestPetName || "Thú cưng";
  const petSpecies = formatSpecies(record.pet?.species || record.guestPetSpecies || "DOG");
  const petBreed = record.pet?.breed || record.guestPetBreed || "—";

  const medicines = (record.invoice?.items || []).filter((i) => i.itemType === "MEDICINE");
  const services = (record.invoice?.items || []).filter((i) => i.itemType === "SERVICE");

  return (
    <div className="min-h-screen bg-[#E9ECEF] pb-16 text-[#132A2E] print:bg-white print:pb-0">
      <PrintTriggerBar
        title={`Xem trước bản in A4 — Phiếu khám & Đơn thuốc ${record.recordCode}`}
        backHref={session.role === "DOCTOR" ? "/bac-si" : session.role === "MANAGER" ? "/quan-ly" : "/le-tan"}
        secondaryHref={record.invoice ? `/in/hoa-don/${record.invoice.id}` : undefined}
        secondaryLabel={record.invoice ? `Mở Hóa đơn ${record.invoice.invoiceCode} A4` : undefined}
      />

      <div className="print-a4-sheet mx-auto mt-8 w-[210mm] min-h-[297mm] rounded-xl border border-slate-200 bg-white p-[14mm] shadow-2xl print:mt-0 print:min-h-0 print:rounded-none">
        {/* Header ANIMORA */}
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
                Hotline: <strong>{clinic.phone}</strong> • Email: {clinic.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-lg bg-[#0F766E]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0F766E]">
              Hồ sơ Bệnh án S.O.A.P
            </span>
            <p className="mt-2 font-mono text-xl font-extrabold text-[#132A2E]">
              {record.recordCode}
            </p>
            <p className="mt-0.5 text-[11px] text-[#476268]">
              Ngày khám: {formatDateTimeVn(record.createdAt)}
            </p>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="my-5 text-center">
          <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-[#132A2E]">
            PHIẾU KHÁM BỆNH &amp; ĐƠN THUỐC THÚ Y
          </h1>
          <p className="mt-0.5 text-xs italic text-[#476268]">{clinic.tagline}</p>
        </div>

        {/* Thông tin hành chính thú cưng & chủ nuôi */}
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#0F766E]/15 bg-[#FAF9F6] p-4 text-xs">
          <div className="space-y-1">
            <p>
              <span className="text-[#476268]">Tên thú cưng:</span>{" "}
              <strong className="text-sm text-[#0F766E]">{petName}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Loài / Giống:</span>{" "}
              <strong>
                {petSpecies} — {petBreed}
              </strong>
            </p>
            {record.pet && (
              <p>
                <span className="text-[#476268]">Giới tính / Triệt sản:</span>{" "}
                <strong>
                  {formatGender(record.pet.gender)} •{" "}
                  {record.pet.isNeutered ? "Đã triệt sản" : "Chưa triệt sản"}
                </strong>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p>
              <span className="text-[#476268]">Chủ nuôi:</span>{" "}
              <strong>{ownerName}</strong>{" "}
              {!record.customer && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  Khách vãng lai (Thông tin tạm)
                </span>
              )}
            </p>
            <p>
              <span className="text-[#476268]">Số điện thoại:</span> <strong>{ownerPhone}</strong>
            </p>
            <p>
              <span className="text-[#476268]">Bác sĩ điều trị:</span>{" "}
              <strong>{record.doctor.fullName}</strong>
            </p>
          </div>
        </div>

        {/* Chỉ số sinh tồn */}
        <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs">
          <div className="rounded-xl border border-slate-200 p-2.5">
            <p className="text-[10px] uppercase text-[#476268]">Cân nặng</p>
            <p className="mt-0.5 font-extrabold text-[#132A2E]">
              {record.weightKg ? `${record.weightKg} kg` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-2.5">
            <p className="text-[10px] uppercase text-[#476268]">Thân nhiệt</p>
            <p className="mt-0.5 font-extrabold text-[#132A2E]">
              {record.temperatureC ? `${record.temperatureC} °C` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-2.5">
            <p className="text-[10px] uppercase text-[#476268]">Nhịp tim</p>
            <p className="mt-0.5 font-extrabold text-[#132A2E]">
              {record.heartRate ? `${record.heartRate} lần/p` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-2.5">
            <p className="text-[10px] uppercase text-[#476268]">Nhịp thở</p>
            <p className="mt-0.5 font-extrabold text-[#132A2E]">
              {record.respiratoryRate ? `${record.respiratoryRate} lần/p` : "—"}
            </p>
          </div>
        </div>

        {/* Nội dung S.O.A.P */}
        <div className="mt-5 space-y-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="font-extrabold text-[#0F766E]">S — Triệu chứng &amp; Bệnh sử (Subjective)</p>
            <p className="mt-1 whitespace-pre-line text-[#132A2E]">
              {record.subjective || "Không ghi nhận bất thường."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="font-extrabold text-[#0F766E]">O — Kết quả khám lâm sàng (Objective)</p>
            <p className="mt-1 whitespace-pre-line text-[#132A2E]">
              {record.objective || "Khám lâm sàng bình thường."}
            </p>
          </div>
          <div className="rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/5 p-3.5">
            <p className="font-extrabold text-[#0F766E]">A — Chẩn đoán lâm sàng (Assessment)</p>
            <p className="mt-1 whitespace-pre-line font-bold text-[#132A2E]">
              {record.assessment || "Đang theo dõi."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="font-extrabold text-[#0F766E]">P — Phác đồ điều trị &amp; Dặn dò (Plan)</p>
            <p className="mt-1 whitespace-pre-line text-[#132A2E]">
              {record.plan || "Theo dõi tại nhà và tái khám theo hẹn."}
            </p>
          </div>
        </div>

        {/* Dịch vụ đã thực hiện */}
        {services.length > 0 && (
          <div className="mt-4 text-xs">
            <p className="font-extrabold uppercase text-[#0F766E]">Dịch vụ / Thủ thuật thực hiện:</p>
            <p className="mt-1 text-[#132A2E]">
              {services.map((s) => `${s.name} (x${s.quantity})`).join(" • ")}
            </p>
          </div>
        )}

        {/* Đơn thuốc kê cho thú cưng */}
        <div className="mt-5">
          <h2 className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#0F766E]">
            ĐƠN THUỐC &amp; HƯỚNG DẪN SỬ DỤNG
          </h2>
          {medicines.length > 0 ? (
            <table className="mt-2 w-full border-collapse text-xs">
              <thead>
                <tr className="border-y-2 border-[#0F766E] bg-[#0F766E]/8 text-[#0F766E]">
                  <th className="px-2.5 py-2 text-center font-extrabold">STT</th>
                  <th className="px-2.5 py-2 text-left font-extrabold">Tên thuốc / Chế phẩm</th>
                  <th className="px-2.5 py-2 text-center font-extrabold">Số lượng</th>
                  <th className="px-2.5 py-2 text-left font-extrabold">Liều dùng &amp; Cách dùng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines.map((med, idx) => (
                  <tr key={med.id}>
                    <td className="px-2.5 py-2 text-center font-bold">{idx + 1}</td>
                    <td className="px-2.5 py-2 font-bold text-[#132A2E]">{med.name}</td>
                    <td className="px-2.5 py-2 text-center font-extrabold">
                      {med.quantity} {med.unit}
                    </td>
                    <td className="px-2.5 py-2 text-[#132A2E]">
                      {med.dosageInstruction || "Theo hướng dẫn trực tiếp của bác sĩ"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs italic text-[#476268]">
              Không kê đơn thuốc mang về trong lần khám này.
            </p>
          )}
        </div>

        {/* Lịch hẹn tái khám */}
        {record.followUpDate && (
          <div className="mt-4 rounded-xl border border-[#F97316]/40 bg-[#F97316]/8 p-3.5 text-xs">
            <p className="font-extrabold text-[#EA580C]">
              LỊCH HẸN TÁI KHÁM / TIÊM NHẮC LẠI: {formatDateVn(record.followUpDate)}
            </p>
            {record.followUpNote && <p className="mt-0.5 text-[#132A2E]">{record.followUpNote}</p>}
          </div>
        )}

        {/* Ghi chú bổ sung (nếu có) */}
        {record.addendums.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs">
            <p className="font-extrabold text-amber-900">Ghi chú bổ sung sau khi khóa bệnh án:</p>
            <ul className="mt-1 space-y-1">
              {record.addendums.map((add) => (
                <li key={add.id}>
                  • <strong>{add.authorName}</strong> ({formatDateTimeVn(add.createdAt)}):{" "}
                  {add.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chữ ký Bác sĩ */}
        <div className="mt-10 flex justify-end text-center text-xs">
          <div className="w-64">
            <p className="italic text-[#476268]">Ngày {formatDateVn(record.createdAt)}</p>
            <p className="mt-1 font-extrabold uppercase">Bác sĩ Thú y phụ trách</p>
            <p className="italic text-[#476268]">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-extrabold text-[#0F766E]">{record.doctor.fullName}</p>
            {record.doctor.title && (
              <p className="text-[11px] text-[#476268]">{record.doctor.title}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
