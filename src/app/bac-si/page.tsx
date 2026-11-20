import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RolePortalShell } from "@/components/RolePortalShell";
import { DoctorPortalClient } from "@/components/doctor/DoctorPortalClient";

export const dynamic = "force-dynamic";

export default async function DoctorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/bac-si");
  }

  const sp = await searchParams;

  return (
    <RolePortalShell
      session={session}
      pageTitle="Phòng khám Bác sĩ — Hàng chờ, Bệnh án S.O.A.P & Nghỉ phép"
      pageSubtitle="Cập nhật trạng thái trực tiếp, tiếp nhận khám, ghi bệnh án S.O.A.P 2 cột, kê đơn từ kho, thêm ghi chú bổ sung sau khóa cứng và báo nghỉ đột xuất."
      notice={sp.notice}
    >
      <DoctorPortalClient />
    </RolePortalShell>
  );
}
