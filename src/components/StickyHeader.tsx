"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Search,
  LogIn,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { AnimoraLogo } from "./AnimoraLogo";
import { MagneticButton } from "./public/MagneticButton";
import type { SessionPayload, UserRole } from "@/lib/auth";

const ROLE_UI: Record<UserRole, { label: string; path: string; badge: string }> = {
  MANAGER: {
    label: "Quản lý",
    path: "/quan-ly",
    badge: "bg-[#0F766E] text-white",
  },
  RECEPTIONIST: {
    label: "Lễ tân",
    path: "/le-tan",
    badge: "bg-[#F97316] text-white",
  },
  DOCTOR: {
    label: "Bác sĩ",
    path: "/bac-si",
    badge: "bg-[#0D9488] text-white",
  },
  CUSTOMER: {
    label: "Khách hàng",
    path: "/tai-khoan",
    badge: "bg-[#132A2E] text-white",
  },
};

interface StickyHeaderProps {
  session: SessionPayload | null;
  clinicPhone?: string;
  enablePreloaderReplay?: boolean;
}

export function StickyHeader({
  session,
  enablePreloaderReplay = false,
}: StickyHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    setLoggingOut(false);
    router.refresh();
  };

  const roleInfo = session ? ROLE_UI[session.role] : null;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#0F766E]/12 bg-[#FAF9F6]/80 shadow-[0_10px_30px_-14px_rgba(19,42,46,0.14)] backdrop-blur-xl"
          : "border-b border-[#0F766E]/8 bg-[#FAF9F6]/65 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between gap-4 px-6 xl:px-8">
        {/* Logo động ANIMORA — gọn sắc nét 1 hàng, bấm xem lại hiệu ứng */}
        <div className="shrink-0">
          <AnimoraLogo
            size="md"
            interactive
            triggerGlobalPreloader={enablePreloaderReplay}
          />
        </div>

        {/* Liên kết điều hướng Trang quảng cáo — 1 hàng ngang whitespace-nowrap */}
        <nav className="flex items-center gap-4 xl:gap-6 text-sm font-semibold text-[#132A2E]">
          <Link
            href="/#uu-dai"
            className="whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-[#0F766E]/6 hover:text-[#0F766E]"
          >
            Ưu đãi
          </Link>
          <Link
            href="/#dich-vu"
            className="whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-[#0F766E]/6 hover:text-[#0F766E]"
          >
            Dịch vụ
          </Link>
          <Link
            href="/#san-pham"
            className="whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-[#0F766E]/6 hover:text-[#0F766E]"
          >
            Sản phẩm
          </Link>
          <Link
            href="/#bac-si"
            className="whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-[#0F766E]/6 hover:text-[#0F766E]"
          >
            Bác sĩ
          </Link>
          <Link
            href="/#ban-do"
            className="whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-[#0F766E]/6 hover:text-[#0F766E]"
          >
            Bản đồ
          </Link>
          <Link
            href="/tra-cuu"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[#0F766E] transition-colors hover:bg-[#0F766E]/10 hover:text-[#0B5D56]"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            Tra cứu lịch
          </Link>
        </nav>

        {/* Cụm nút hành động bên phải — 1 hàng ngang whitespace-nowrap */}
        <div className="flex shrink-0 items-center gap-2.5">
          <MagneticButton strength={0.18}>
            <Link
              href="/dat-lich"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F97316]/25 transition hover:bg-[#EA580C] active:scale-[0.98]"
            >
              <CalendarPlus className="h-4 w-4 shrink-0" />
              Đặt lịch ngay
            </Link>
          </MagneticButton>

          {session && roleInfo ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#132A2E]/15 bg-white/90 px-3 py-1.5 text-left backdrop-blur-md transition hover:border-[#0F766E]/40"
              >
                <div>
                  <p className="max-w-[120px] truncate text-xs font-bold text-[#132A2E]">
                    {session.fullName}
                  </p>
                  <span
                    className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#476268]" />
              </button>

              {menuOpen && (
                <div className="glass-medical-card absolute right-0 mt-2 w-60 rounded-2xl p-2">
                  <div className="border-b border-[#132A2E]/10 px-3 py-2">
                    <p className="text-xs text-[#476268]">Đang đăng nhập</p>
                    <p className="truncate text-sm font-bold text-[#132A2E]">
                      {session.email}
                    </p>
                  </div>
                  <Link
                    href={roleInfo.path}
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#132A2E] transition hover:bg-[#0F766E]/10 hover:text-[#0F766E]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Vào khu vực {roleInfo.label}
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0F766E]/20 transition hover:bg-[#0B5D56] active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
