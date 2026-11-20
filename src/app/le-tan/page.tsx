import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RolePortalShell } from "@/components/RolePortalShell";
import { ReceptionPortalClient } from "@/components/reception/ReceptionPortalClient";

export const dynamic = "force-dynamic";

export default async function ReceptionPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/le-tan");
  }

  const sp = await searchParams;

  return (
    <RolePortalShell
      session={session}
      pageTitle="Bàn Lễ tân — Điều phối, Lịch trực & Thu ngân POS"
      pageSubtitle="Tiếp đón Check-in, xử lý cảnh báo bác sĩ nghỉ đột xuất, điều phối ca Walk-in/Cấp cứu, thu ngân Tiền mặt/VietQR & trừ kho FEFO."
      notice={sp.notice}
    >
      <ReceptionPortalClient />
    </RolePortalShell>
  );
}
