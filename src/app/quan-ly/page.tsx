import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RolePortalShell } from "@/components/RolePortalShell";
import { ManagerPortalClient } from "@/components/manager/ManagerPortalClient";

export const dynamic = "force-dynamic";

export default async function ManagerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/quan-ly");
  }

  const sp = await searchParams;

  return (
    <RolePortalShell
      session={session}
      pageTitle="Trung tâm Quản lý — Kho thông minh, Bệnh án & Đối soát"
      pageSubtitle="Quản lý kho hợp nhất đa lô (quy đổi đơn vị nhập -> bán lẻ), cảnh báo đỏ lô dưới 30 ngày, phiếu xuất nội bộ/xuất hủy và tra cứu toàn bộ bệnh án & Audit Log."
      notice={sp.notice}
    >
      <ManagerPortalClient />
    </RolePortalShell>
  );
}
