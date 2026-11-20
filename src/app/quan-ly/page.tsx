import React from "react";
import { redirect } from "next/navigation";
import {
  Users,
  Stethoscope,
  Package,
  Sparkles,
  CalendarCog,
  BarChart3,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RolePortalShell } from "@/components/RolePortalShell";

export const dynamic = "force-dynamic";

export default async function ManagerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    redirect("/dang-nhap");
  }

  const { notice } = await searchParams;

  const [staffCount, doctorCount, serviceCount, productCount, promoCount] =
    await Promise.all([
      prisma.user.count({ where: { role: { not: "CUSTOMER" }, isActive: true } }),
      prisma.user.count({ where: { role: "DOCTOR", isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.promotion.count({ where: { isActive: true } }),
    ]);

  return (
    <RolePortalShell
      session={session}
      pageTitle="Trung tâm Quản trị Phòng khám ANIMORA"
      pageSubtitle="Toàn quyền quản lý nhân sự, kho hợp nhất, sự kiện khuyến mãi, CMS Trang quảng cáo và báo cáo tổng doanh thu."
      notice={notice}
    >
      <div className="grid grid-cols-5 gap-5">
        <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
          <Users className="h-6 w-6 text-[#0F766E]" />
          <p className="mt-4 text-xs font-bold uppercase text-[#476268]">
            Nhân sự đang hoạt động
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#132A2E]">{staffCount}</p>
        </div>

        <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
          <Stethoscope className="h-6 w-6 text-[#0F766E]" />
          <p className="mt-4 text-xs font-bold uppercase text-[#476268]">
            Bác sĩ chính quy
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#132A2E]">{doctorCount}</p>
        </div>

        <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
          <CalendarCog className="h-6 w-6 text-[#F97316]" />
          <p className="mt-4 text-xs font-bold uppercase text-[#476268]">
            Gói Dịch vụ niêm yết
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#132A2E]">{serviceCount}</p>
        </div>

        <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
          <Package className="h-6 w-6 text-[#0F766E]" />
          <p className="mt-4 text-xs font-bold uppercase text-[#476268]">
            Sản phẩm Shop tại quầy
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#132A2E]">{productCount}</p>
        </div>

        <div className="rounded-3xl border border-[#0F766E]/12 bg-white p-6">
          <Sparkles className="h-6 w-6 text-[#F97316]" />
          <p className="mt-4 text-xs font-bold uppercase text-[#476268]">
            Ưu đãi đang chạy
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#132A2E]">{promoCount}</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-[#0F766E]/15 bg-white p-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-[#0F766E]" />
          <h2 className="text-xl font-extrabold text-[#132A2E]">
            Các phân hệ Quản trị sẽ mở khóa tiếp ở Giai đoạn 2 – 4
          </h2>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-5 text-sm text-[#476268]">
          <div className="rounded-2xl bg-[#FAF9F6] p-5">
            <p className="font-bold text-[#132A2E]">Quản lý Kho FEFO & Quy đổi đơn vị</p>
            <p className="mt-1.5 text-xs leading-relaxed">
              Nhập hàng theo thùng/hộp tự quy đổi sang viên/ml, cảnh báo đỏ lô dưới 30 ngày hết hạn, lập phiếu xuất hủy & kiểm kê.
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF9F6] p-5">
            <p className="font-bold text-[#132A2E]">CMS & Quản lý Sự kiện Ưu đãi</p>
            <p className="mt-1.5 text-xs leading-relaxed">
              Tự chỉnh sửa bảng giá, thông tin bác sĩ, sản phẩm shop và bật/tắt banner khuyến mãi đếm ngược ngay trên web.
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF9F6] p-5">
            <p className="font-bold text-[#132A2E]">Báo cáo Doanh thu & Hủy hóa đơn</p>
            <p className="mt-1.5 text-xs leading-relaxed">
              Thống kê tách riêng Y tế / Spa / Shop, doanh thu theo Bác sĩ, bảng chốt ca Tiền mặt vs VietQR và quyền hủy hóa đơn hoàn kho.
            </p>
          </div>
        </div>
      </div>
    </RolePortalShell>
  );
}
