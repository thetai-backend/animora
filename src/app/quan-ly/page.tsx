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
      pageTitle="Trung tâm Quản lý Toàn diện ANIMORA"
      pageSubtitle="Báo cáo Doanh thu & Chốt ca, Kho thông minh FEFO, Hóa đơn & Hủy hoàn kho, Hồ sơ S.O.A.P, Nhân sự, Sự kiện Ưu đãi & CMS Trang Quảng cáo."
      notice={sp.notice}
    >
      <ManagerPortalClient />
    </RolePortalShell>
  );
}
