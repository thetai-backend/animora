"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  CalendarPlus,
  Clock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  ArrowDownRight,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { AnimoraLogo } from "@/components/AnimoraLogo";
import { Phase2NoticeModal } from "@/components/Phase2NoticeModal";

interface HeroSectionProps {
  clinicName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  doctorCount: number;
  serviceCount: number;
}

export function HeroSection({
  tagline,
  heroTitle,
  heroSubtitle,
  address,
  phone,
  openTime,
  closeTime,
  doctorCount,
  serviceCount,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Hiệu ứng chiều sâu (parallax depth) khi cuộn chuột
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const floatCardTopY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const floatCardBottomY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <>
      <section
        ref={containerRef}
        className="relative overflow-hidden border-b border-[#0F766E]/10 bg-gradient-to-b from-[#FAF9F6] via-[#F4F8F7] to-[#FAF9F6] pb-20 pt-14"
      >
        {/* Vầng sáng nền dịu mắt */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[540px] w-[540px] rounded-full bg-[#0F766E]/8 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#F97316]/8 blur-3xl"
        />

        <div className="mx-auto grid max-w-[1380px] grid-cols-12 items-center gap-12 px-8">
          {/* Cột trái: Nhận diện & Giá trị y khoa */}
          <div className="col-span-6 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#0F766E]/20 bg-white px-4 py-1.5 text-xs font-semibold text-[#0F766E] shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#F97316]" />
              {tagline}
            </motion.div>

            {/* Trình diễn Logo động cỡ lớn có thể bấm xem lại */}
            <div className="rounded-2xl border border-[#0F766E]/12 bg-white/80 px-5 py-4 backdrop-blur-xs">
              <AnimoraLogo size="lg" interactive showReplayHint />
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="text-5xl font-extrabold leading-[1.15] tracking-tight text-[#132A2E]"
            >
              {heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="max-w-xl text-base leading-relaxed text-[#476268]"
            >
              {heroSubtitle}
            </motion.p>

            {/* Nút hành động chính */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              <button
                onClick={() => setBookingModalOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-[#F97316] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#F97316]/30 transition hover:-translate-y-0.5 hover:bg-[#EA580C]"
              >
                <CalendarPlus className="h-5 w-5" />
                Đặt lịch khám / Spa ngay
              </button>

              <Link
                href="#dich-vu"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#0F766E]/25 bg-white px-6 py-4 text-base font-bold text-[#0F766E] transition hover:border-[#0F766E] hover:bg-[#0F766E]/5"
              >
                Xem bảng giá minh bạch
                <ArrowDownRight className="h-5 w-5" />
              </Link>
            </motion.div>

            {/* 3 Chỉ số tin cậy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="grid grid-cols-3 gap-4 pt-4"
            >
              <div className="rounded-2xl border border-[#0F766E]/10 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-[#0F766E]">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Mở cửa xuyên suốt
                  </span>
                </div>
                <p className="mt-1.5 text-lg font-extrabold text-[#132A2E]">
                  {openTime} – {closeTime}
                </p>
                <p className="text-xs text-[#476268]">Tất cả các ngày trong tuần</p>
              </div>

              <div className="rounded-2xl border border-[#0F766E]/10 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-[#0F766E]">
                  <Stethoscope className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Đội ngũ chuyên khoa
                  </span>
                </div>
                <p className="mt-1.5 text-lg font-extrabold text-[#132A2E]">
                  {doctorCount} Bác sĩ chính quy
                </p>
                <p className="text-xs text-[#476268]">2 ca trực liên tục mỗi ngày</p>
              </div>

              <div className="rounded-2xl border border-[#0F766E]/10 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-[#0F766E]">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Chi phí rõ ràng
                  </span>
                </div>
                <p className="mt-1.5 text-lg font-extrabold text-[#132A2E]">
                  {serviceCount} Gói cố định
                </p>
                <p className="text-xs text-[#476268]">Niêm yết sẵn, không phát sinh ẩn</p>
              </div>
            </motion.div>
          </div>

          {/* Cột phải: Khung ảnh phòng khám có hiệu ứng chiều sâu */}
          <div className="relative col-span-6">
            <motion.div
              style={{ y: imageY, scale: imageScale }}
              className="relative overflow-hidden rounded-[32px] border-4 border-white shadow-2xl shadow-[#0F766E]/15"
            >
              <img
                src="/images/hero-clinic.jpg"
                alt="Không gian khám chữa bệnh chuẩn y khoa tại Phòng khám Thú y ANIMORA"
                className="h-[540px] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#132A2E]/35 via-transparent to-transparent" />
            </motion.div>

            {/* Thẻ nổi góc trên phải */}
            <motion.div
              style={{ y: floatCardTopY }}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -right-4 top-8 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F766E] text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#476268]">
                    Quy trình khám chuẩn quốc tế
                  </p>
                  <p className="text-sm font-extrabold text-[#132A2E]">
                    Bệnh án điện tử S.O.A.P
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Thẻ nổi góc dưới trái */}
            <motion.div
              style={{ y: floatCardBottomY }}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="absolute -bottom-5 left-6 max-w-sm rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                    1 Cơ sở duy nhất — Dễ tìm kiếm
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[#476268]">
                    {address}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Phase2NoticeModal
        open={bookingModalOpen}
        mode="BOOKING"
        phone={phone}
        onClose={() => setBookingModalOpen(false)}
      />
    </>
  );
}
