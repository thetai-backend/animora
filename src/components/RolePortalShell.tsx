"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Home,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { AnimoraLogo } from "./AnimoraLogo";
import type { SessionPayload, UserRole } from "@/lib/auth";

const ROLE_LABELS: Record<UserRole, { label: string; badge: string }> = {
  MANAGER: { label: "Quản lý phòng khám", badge: "bg-[#0F766E] text-white" },
  RECEPTIONIST: { label: "Lễ tân & Điều phối", badge: "bg-[#F97316] text-white" },
  DOCTOR: { label: "Bác sĩ Thú y", badge: "bg-[#0D9488] text-white" },
  CUSTOMER: { label: "Khách hàng thành viên", badge: "bg-[#132A2E] text-white" },
};

interface RolePortalShellProps {
  session: SessionPayload;
  pageTitle: string;
  pageSubtitle: string;
  notice?: string;
  children: React.ReactNode;
}

/**
 * Khung Dashboard Vận hành Chuẩn 0ms (Tactile Spatial Medical)
 * TẮT hoàn toàn 3D nặng & Lenis để nhân viên thao tác liên tục 8 giờ không mỏi mắt và phản hồi tức thì.
 */
export function RolePortalShell({
  session,
  pageTitle,
  pageSubtitle,
  notice,
  children,
}: RolePortalShellProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dang-nhap");
    router.refresh();
  };

  const roleMeta = ROLE_LABELS[session.role];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
      <header className="sticky top-0 z-30 border-b border-[#0F766E]/12 bg-white/90 shadow-[0_6px_20px_-14px_rgba(19,42,46,0.14)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-6 xl:px-8">
          <div className="flex items-center gap-5">
            <AnimoraLogo size="sm" interactive />
            <div className="border-l border-[#132A2E]/12 pl-5">
              <span
                className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${roleMeta.badge}`}
              >
                {roleMeta.label}
              </span>
              <p className="mt-0.5 text-xs font-medium text-[#476268]">
                {session.fullName} ({session.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/20 bg-[#FAF9F6] px-4 py-2.5 text-sm font-bold text-[#0F766E] transition-colors hover:bg-[#0F766E]/10 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Xem Trang quảng cáo
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Đang thoát..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-6 py-8 xl:px-8">
        {notice === "khong-du-quyen" && (
          <div className="alert-urgent-card mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-extrabold text-[#991B1B]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#DC2626]" />
            <span>
              Hệ thống phân quyền đã chặn truy cập trái vai trò và đưa bạn trở về đúng khu vực làm việc của mình.
            </span>
          </div>
        )}

        <div className="tactile-surface mb-7 flex items-end justify-between gap-6 rounded-[28px] p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-extrabold text-[#0F766E]">
                <ShieldCheck className="h-3.5 w-3.5" />
                ANIMORA Clinical OS — Đã xác thực phân quyền
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-bold text-[#476268] ring-1 ring-[#132A2E]/8">
                <Zap className="h-3 w-3 text-[#F97316]" />
                Chế độ vận hành 0ms
              </span>
            </div>
            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-[#476268]">{pageSubtitle}</p>
          </div>

          <div className="shrink-0 rounded-2xl border border-[#0F766E]/10 bg-[#FAF9F6] px-5 py-3.5 text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#476268]">
              Kiểm tra phân quyền nhanh
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-extrabold">
              <Link href="/quan-ly" className="text-[#0F766E] hover:underline">
                /quan-ly
              </Link>
              <span className="text-[#476268]/40">•</span>
              <Link href="/le-tan" className="text-[#0F766E] hover:underline">
                /le-tan
              </Link>
              <span className="text-[#476268]/40">•</span>
              <Link href="/bac-si" className="text-[#0F766E] hover:underline">
                /bac-si
              </Link>
              <span className="text-[#476268]/40">•</span>
              <Link href="/tai-khoan" className="text-[#0F766E] hover:underline">
                /tai-khoan
              </Link>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
