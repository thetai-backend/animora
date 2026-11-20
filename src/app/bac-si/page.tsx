import React from "react";
import { redirect } from "next/navigation";
import { FileText, CalendarOff, Activity } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatWorkStatus } from "@/lib/format";
import { RolePortalShell } from "@/components/RolePortalShell";

export const dynamic = "force-dynamic";

export default async function DoctorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    redirect("/dang-nhap");
  }

  const { notice } = await searchParams;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const statusInfo = formatWorkStatus(user?.workStatus ?? "AVAILABLE");

  return (
    <RolePortalShell
      session={session}
      pageTitle="Phòng Khám Lâm Sàng — Khu vực Bác sĩ"
      pageSubtitle="Cập nhật trạng thái làm việc trực tiếp, tiếp nhận hàng chờ khám, ghi bệnh án S.O.A.P và chuyển phiếu thanh toán."
      notice={notice}
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || "/images/doctor-1.jpg"}
              alt={user?.fullName || session.fullName}
              className="h-20 w-20 rounded-2xl object-cover object-top"
            />
            <div>
              <p className="text-xs font-bold uppercase text-[#0F766E]">
                {user?.title || "Bác sĩ Thú y"}
              </p>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                {user?.fullName || session.fullName}
              </h2>
              <span
                className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${statusInfo.colorClass}`}
              >
                Trạng thái: {statusInfo.label}
              </span>
            </div>
          </div>

          {user?.specialty && (
            <p className="mt-5 rounded-2xl bg-[#FAF9F6] p-4 text-xs leading-relaxed text-[#476268]">
              <strong className="text-[#132A2E]">Chuyên môn:</strong> {user.specialty}
            </p>
          )}
        </div>

        <div className="col-span-7 grid grid-cols-3 gap-5">
          <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
            <Activity className="h-6 w-6 text-[#0F766E]" />
            <h3 className="mt-4 text-base font-extrabold text-[#132A2E]">
              Trạng thái trực
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#476268]">
              Chuyển nhanh giữa Đang trống / Đang khám / Nghỉ (mở ở Giai đoạn 2).
            </p>
          </div>

          <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
            <CalendarOff className="h-6 w-6 text-[#F97316]" />
            <h3 className="mt-4 text-base font-extrabold text-[#132A2E]">
              Đăng ký nghỉ phép
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#476268]">
              Tự khóa lịch trực và bật cảnh báo đỏ cho Lễ tân khi báo nghỉ đột xuất (Giai đoạn 2).
            </p>
          </div>

          <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
            <FileText className="h-6 w-6 text-[#0F766E]" />
            <h3 className="mt-4 text-base font-extrabold text-[#132A2E]">
              Bệnh án S.O.A.P
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#476268]">
              Giao diện 2 cột xem lịch sử thú cưng và ghi chép S-O-A-P thuần văn bản, tự khóa khi đã thanh toán (Giai đoạn 3).
            </p>
          </div>
        </div>
      </div>
    </RolePortalShell>
  );
}
