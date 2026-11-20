import React from "react";
import { redirect } from "next/navigation";
import { Clock, Stethoscope, ReceiptText, CalendarRange } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatWorkStatus } from "@/lib/format";
import { RolePortalShell } from "@/components/RolePortalShell";

export const dynamic = "force-dynamic";

export default async function ReceptionistPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    redirect("/dang-nhap");
  }

  const { notice } = await searchParams;

  const [doctors, settings] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DOCTOR", isActive: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <RolePortalShell
      session={session}
      pageTitle="Bàn Điều phối & Lễ tân ANIMORA"
      pageSubtitle="Theo dõi trạng thái bác sĩ trực, sắp xếp lịch trực cố định hàng tuần, tiếp đón khách và thu ngân tại quầy."
      notice={notice}
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 rounded-3xl border border-[#0F766E]/12 bg-white p-7">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
              <Stethoscope className="h-5 w-5 text-[#0F766E]" />
              Trạng thái Bác sĩ hiện tại
            </h2>
            <span className="text-xs font-semibold text-[#476268]">
              Chỉ đẩy ca Walk-in / Cấp cứu khi bác sĩ Đang trống
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {doctors.map((doc) => {
              const st = formatWorkStatus(doc.workStatus);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-[#0F766E]/10 bg-[#FAF9F6] p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={doc.avatarUrl || "/images/doctor-1.jpg"}
                      alt={doc.fullName}
                      className="h-12 w-12 rounded-xl object-cover object-top"
                    />
                    <div>
                      <p className="text-sm font-extrabold text-[#132A2E]">
                        {doc.fullName}
                      </p>
                      <p className="text-xs text-[#476268]">{doc.specialty}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${st.colorClass}`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-7">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
              <Clock className="h-5 w-5 text-[#F97316]" />
              Khung ca trực & Giờ mở cửa
            </h2>
            <div className="mt-4 space-y-2.5 text-sm text-[#476268]">
              <p>
                Giờ mở cửa:{" "}
                <strong className="text-[#132A2E]">
                  {settings?.openTime ?? "07:00"} – {settings?.closeTime ?? "20:00"}
                </strong>
              </p>
              <p>
                Ca sáng: <strong className="text-[#132A2E]">07:00 – 13:30</strong> • Ca chiều:{" "}
                <strong className="text-[#132A2E]">13:30 – 20:00</strong>
              </p>
              <p>
                Khung nghỉ trưa (12:00 – 13:30):{" "}
                <strong className="text-[#0F766E]">
                  {settings?.lunchBreakEnabled ? "Đang bật" : "Đang tắt (mở xuyên trưa)"}
                </strong>
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-7">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
              <CalendarRange className="h-5 w-5 text-[#0F766E]" />
              Tính năng sắp mở ở Giai đoạn 2 & 4
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#476268]">
              <li>• Bảng điều phối lịch hẹn 30 phút, cảnh báo đỏ khách trễ 20 phút & bác sĩ nghỉ đột xuất.</li>
              <li className="flex items-center gap-1.5">
                <ReceiptText className="h-3.5 w-3.5 text-[#F97316]" />
                Thu ngân POS (Tiền mặt / VietQR tĩnh), bán lẻ Shop & In hóa đơn chuẩn khổ A4.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </RolePortalShell>
  );
}
