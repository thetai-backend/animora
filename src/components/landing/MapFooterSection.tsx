"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { MagneticButton } from "@/components/public/MagneticButton";

interface MapFooterProps {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
}

export function MapFooterSection({
  clinicName,
  address,
  phone,
  email,
  openTime,
  closeTime,
  googleMapsUrl,
  googleMapsEmbedUrl,
}: MapFooterProps) {
  return (
    <>
      {/* Khu vực Bản đồ Google Maps bo góc lớn + Thẻ kính mờ nổi góc trái */}
      <section id="ban-do" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-[1380px] px-6 xl:px-8">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                <MapPin className="h-3.5 w-3.5" />
                Định vị 1 cơ sở duy nhất
              </span>
              <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E] xl:text-4xl">
                Ghé thăm {clinicName}
              </h2>
            </div>
            <p className="max-w-md text-right text-sm text-[#476268]">
              Mặt tiền trung tâm thuận tiện đỗ xe, khu vực chờ tách biệt giữa Chó và Mèo giúp các bé luôn bình tĩnh khi thăm khám.
            </p>
          </div>

          {/* Khung bản đồ bo góc lớn rounded-3xl đồng bộ tông Xanh Ngọc – Kem */}
          <div className="relative h-[540px] w-full overflow-hidden rounded-3xl border border-[#0F766E]/18 bg-[#E8F1EE] shadow-[0_28px_70px_-24px_rgba(15,118,110,0.22)]">
            <iframe
              title="Bản đồ Phòng khám Thú y ANIMORA"
              src={googleMapsEmbedUrl}
              className="h-full w-full border-0 transition-all duration-500 [filter:saturate(0.84)_hue-rotate(-7deg)_contrast(1.03)] hover:[filter:saturate(0.95)_contrast(1.02)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Phủ viền ánh sáng kem-ngọc rất nhẹ để hòa bản đồ vào nền */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#0F766E]/15"
            />

            {/* THẺ KÍNH MỜ (FROSTED GLASS CARD) NỔI Ở GÓC TRÁI */}
            <div className="glass-medical-card absolute bottom-7 left-7 top-7 z-10 flex w-[430px] flex-col justify-between rounded-[28px] p-7">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                    <span className="h-2 w-2 rounded-full bg-[#5EEAD4] animate-pulse" />
                    Đang mở cửa đón bé
                  </span>
                  <span className="font-heading text-xs font-extrabold tracking-widest text-[#0F766E]">
                    ANIMORA
                  </span>
                </div>

                <h3 className="mt-4 font-heading text-2xl font-extrabold leading-tight text-[#132A2E]">
                  {clinicName}
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/12 text-[#0F766E]">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#476268]">
                        Địa chỉ phòng khám
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-snug text-[#132A2E]">
                        {address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/14 text-[#EA580C]">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#476268]">
                        Giờ mở cửa hàng ngày
                      </p>
                      <p className="tabular-nums-strict mt-0.5 text-sm font-extrabold text-[#132A2E]">
                        {openTime} – {closeTime} (Mở cửa xuyên trưa)
                      </p>
                      <p className="text-xs text-[#476268]">
                        2 ca bác sĩ xoay vòng liên tục: 07:00–13:30 &amp; 13:30–20:00
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-2xl border border-[#0F766E]/10 bg-white/75 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#476268]">
                        <Phone className="h-3 w-3 text-[#0F766E]" />
                        Hotline
                      </p>
                      <p className="tabular-nums-strict mt-1 text-sm font-extrabold text-[#132A2E]">
                        {phone}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#0F766E]/10 bg-white/75 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#476268]">
                        <Mail className="h-3 w-3 text-[#0F766E]" />
                        Email CSKH
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-[#132A2E]">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <MagneticButton className="w-full" strength={0.22}>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 py-4 text-sm font-extrabold text-white shadow-[0_16px_32px_-10px_rgba(249,115,22,0.55)] transition hover:bg-[#EA580C]"
                  >
                    <Navigation className="h-4 w-4" />
                    Mở chỉ đường trên Google Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chân trang */}
      <footer className="border-t border-[#0F766E]/12 bg-[#FAF9F6] py-10">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-6 xl:px-8 text-sm text-[#476268]">
          <div>
            <p className="font-heading text-lg font-extrabold tracking-[0.2em] text-[#0F766E]">
              ANIMORA
            </p>
            <p className="mt-1 text-xs">
              © {new Date().getFullYear()} {clinicName}. Hệ thống quản lý &amp; chăm sóc thú y chuẩn y khoa.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/#dich-vu" className="transition hover:text-[#0F766E]">
              Bảng giá dịch vụ
            </Link>
            <Link href="/#san-pham" className="transition hover:text-[#0F766E]">
              Sản phẩm tại Shop
            </Link>
            <Link href="/#bac-si" className="transition hover:text-[#0F766E]">
              Đội ngũ Bác sĩ
            </Link>
            <Link href="/tra-cuu" className="transition hover:text-[#0F766E]">
              Tra cứu / Hủy lịch
            </Link>
            <Link href="/dang-nhap" className="transition hover:text-[#0F766E]">
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
