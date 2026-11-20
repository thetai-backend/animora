"use client";

import React, { useState } from "react";
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
import { Phase2NoticeModal } from "./Phase2NoticeModal";
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
  clinicPhone: string;
}

export function StickyHeader({ session, clinicPhone }: StickyHeaderProps) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<"BOOKING" | "LOOKUP" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    setLoggingOut(false);
    router.refresh();
  };

  const roleInfo = session ? ROLE_UI[session.role] : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#0F766E]/10 bg-[#FAF9F6]/92 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-8">
          {/* Logo động ANIMORA */}
          <div className="flex items-center gap-4">
            <AnimoraLogo size="md" interactive />
            <Link
              href="/"
              className="hidden border-l border-[#132A2E]/15 pl-4 text-xs font-medium leading-tight text-[#476268] transition hover:text-[#0F766E] xl:block"
            >
              <span className="block font-semibold text-[#132A2E]">
                Phòng khám Thú y
              </span>
              <span>Mở cửa 07:00 – 20:00</span>
            </Link>
          </div>

          {/* Liên kết điều hướng Trang quảng cáo */}
          <nav className="flex items-center gap-7 text-sm font-semibold text-[#132A2E]">
            <Link
              href="/#uu-dai"
              className="transition-colors hover:text-[#0F766E]"
            >
              Sự kiện Ưu đãi
            </Link>
            <Link
              href="/#dich-vu"
              className="transition-colors hover:text-[#0F766E]"
            >
              Dịch vụ & Bảng giá
            </Link>
            <Link
              href="/#san-pham"
              className="transition-colors hover:text-[#0F766E]"
            >
              Sản phẩm tại Shop
            </Link>
            <Link
              href="/#bac-si"
              className="transition-colors hover:text-[#0F766E]"
            >
              Đội ngũ Bác sĩ
            </Link>
            <Link
              href="/#ban-do"
              className="transition-colors hover:text-[#0F766E]"
            >
              Bản đồ
            </Link>
          </nav>

          {/* Cụm nút hành động bên phải */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalMode("LOOKUP")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F766E] transition hover:border-[#0F766E] hover:bg-[#0F766E]/5"
            >
              <Search className="h-4 w-4" />
              Tra cứu / Hủy lịch
            </button>

            <button
              onClick={() => setModalMode("BOOKING")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F97316]/25 transition hover:bg-[#EA580C]"
            >
              <CalendarPlus className="h-4 w-4" />
              Đặt lịch ngay
            </button>

            {session && roleInfo ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#132A2E]/15 bg-white px-3.5 py-2 text-left transition hover:border-[#0F766E]/40"
                >
                  <div>
                    <p className="max-w-[130px] truncate text-xs font-bold text-[#132A2E]">
                      {session.fullName}
                    </p>
                    <span
                      className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#476268]" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#0F766E]/15 bg-white p-2 shadow-xl">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5D56]"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      </header>

      <Phase2NoticeModal
        open={modalMode !== null}
        mode={modalMode || "BOOKING"}
        phone={clinicPhone}
        onClose={() => setModalMode(null)}
      />
    </>
  );
}
