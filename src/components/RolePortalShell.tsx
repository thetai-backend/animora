"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Home,
  ShieldCheck,
  AlertTriangle,
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
      <header className="sticky top-0 z-30 border-b border-[#0F766E]/12 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-8">
          <div className="flex items-center gap-5">
            <AnimoraLogo size="sm" interactive />
            <div className="border-l border-[#132A2E]/15 pl-5">
              <span
                className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold ${roleMeta.badge}`}
              >
                {roleMeta.label}
              </span>
              <p className="mt-0.5 text-xs text-[#476268]">
                {session.fullName} ({session.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/20 bg-[#FAF9F6] px-4 py-2.5 text-sm font-semibold text-[#0F766E] transition hover:bg-[#0F766E]/8"
            >
              <Home className="h-4 w-4" />
              Xem Trang quảng cáo
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Đang thoát..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-8 py-10">
        {notice === "khong-du-quyen" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>
              Hệ thống phân quyền đã chặn truy cập trái vai trò và đưa bạn trở về đúng khu vực làm việc của mình.
            </span>
          </div>
        )}

        <div className="mb-8 flex items-end justify-between rounded-3xl border border-[#0F766E]/12 bg-white p-8 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Hệ thống vận hành ANIMORA — Đã xác thực phân quyền
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
              {pageTitle}
            </h1>
            <p className="mt-1.5 text-sm text-[#476268]">{pageSubtitle}</p>
          </div>

          <div className="rounded-2xl bg-[#FAF9F6] px-5 py-3.5 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#476268]">
              Kiểm tra bảo mật nhanh
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-bold">
              <Link href="/quan-ly" className="text-[#0F766E] underline">
                /quan-ly
              </Link>
              <span>•</span>
              <Link href="/le-tan" className="text-[#0F766E] underline">
                /le-tan
              </Link>
              <span>•</span>
              <Link href="/bac-si" className="text-[#0F766E] underline">
                /bac-si
              </Link>
              <span>•</span>
              <Link href="/tai-khoan" className="text-[#0F766E] underline">
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
