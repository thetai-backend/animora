import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RolePortalShell } from "@/components/RolePortalShell";
import { CustomerPortalClient } from "@/components/customer/CustomerPortalClient";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/tai-khoan");
  }

  const sp = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
    },
  });

  if (!user) {
    redirect("/dang-nhap");
  }

  return (
    <RolePortalShell
      session={session}
      pageTitle="Khu vực Khách hàng & Hồ sơ Thú cưng"
      pageSubtitle="Quản lý thông tin cá nhân, sổ sức khỏe từng thú cưng, lịch hẹn đặt trước và lịch sử bệnh án S.O.A.P."
      notice={sp.notice}
    >
      <CustomerPortalClient initialProfile={user} />
    </RolePortalShell>
  );
}
