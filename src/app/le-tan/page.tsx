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
      pageTitle="Bàn Lễ tân — Điều phối, Thu ngân POS, Nhắc hẹn & Chốt ca"
      pageSubtitle="Tiếp đón Check-in, xử lý nghỉ đột xuất, Thu ngân POS (Phiếu Bác sĩ / Bán lẻ Shop), VietQR & FEFO, Nhắc hẹn tái khám, In A4 & Chốt ca cuối ngày."
      notice={sp.notice}
    >
      <ReceptionPortalClient />
    </RolePortalShell>
  );
}
