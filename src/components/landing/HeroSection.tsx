"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  CalendarPlus,
  Clock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  ArrowDownRight,
  MapPin,
  MousePointerClick,
} from "lucide-react";
import { AnimoraLogo } from "@/components/AnimoraLogo";
import { MagneticButton } from "@/components/public/MagneticButton";

const HeroClayScene = dynamic(
  () => import("./HeroClayScene").then((mod) => mod.HeroClayScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[36px] border border-white/75 bg-gradient-to-br from-[#F0FDFA]/70 via-[#FAF9F6]/80 to-[#FFF7ED]/70 backdrop-blur-xl">
        <div className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-tr from-[#0F766E]/25 to-[#F97316]/20" />
        <p className="mt-4 text-xs font-semibold tracking-wide text-[#476268]">
          Đang khởi tạo không gian Y khoa 3D...
        </p>
      </div>
    ),
  }
);

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
  openTime,
  closeTime,
  doctorCount,
  serviceCount,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const scrollRatioRef = useRef<number>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      scrollRatioRef.current = Math.max(0, Math.min(1, latest));
    });
  }, [scrollYProgress]);

  // Khi cuộn xuống dưới Hero, cụm 3D tự thu nhỏ nhẹ và trượt mờ tinh tế nhường không gian
  const stageOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const floatTopY = useTransform(scrollYProgress, [0, 1], [0, -38]);
  const floatBottomY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-b border-[#0F766E]/10 bg-gradient-to-b from-[#FAF9F6] via-[#F3F8F6] to-[#FAF9F6] pb-20 pt-10 xl:pb-24 xl:pt-12"
    >
      {/* Lưới chấm y khoa siêu mảnh & Vầng sáng ấm áp */}
      <div
        aria-hidden="true"
        className="medical-dot-grid pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-[560px] w-[560px] rounded-full bg-[#0F766E]/10 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-4 h-[380px] w-[380px] rounded-full bg-[#F97316]/9 blur-[95px]"
      />

      <div className="relative z-10 mx-auto grid max-w-[1380px] grid-cols-12 items-center gap-10 px-6 xl:px-8">
        {/* Cột trái: Typography chuẩn Awwwards + Magnetic CTA */}
        <div className="col-span-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48 }}
            className="glass-medical inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-[#0F766E]"
          >
            <span className="h-2 w-2 rounded-full bg-[#F97316] animate-heartbeat" />
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]" />
            <span>{tagline}</span>
          </motion.div>

          {/* Trình diễn Logo động cỡ lớn có thể bấm xem lại */}
          <div className="glass-medical inline-block rounded-2xl px-5 py-3.5">
            <AnimoraLogo size="lg" interactive triggerGlobalPreloader showReplayHint />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-heading text-5xl font-extrabold leading-[1.12] tracking-[-0.025em] text-[#132A2E] xl:text-[54px]"
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="max-w-xl text-base leading-relaxed text-[#476268]"
          >
            {heroSubtitle}
          </motion.p>

          {/* Nút hành động chính với Magnetic Button */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="flex flex-wrap items-center gap-4 pt-1"
          >
            <MagneticButton strength={0.3}>
              <Link
                href="/dat-lich"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-[#F97316] px-8 py-4 text-base font-extrabold text-white shadow-[0_16px_34px_-10px_rgba(249,115,22,0.58)] transition hover:bg-[#EA580C]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <CalendarPlus className="h-5 w-5" />
                Đặt lịch ngay
              </Link>
            </MagneticButton>

            <Link
              href="#dich-vu"
              className="glass-medical inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-[#0F766E] transition hover:border-[#0F766E]/40 hover:bg-white"
            >
              Xem bảng giá minh bạch
              <ArrowDownRight className="h-5 w-5" />
            </Link>
          </motion.div>

          {/* 3 Chỉ số tin cậy dạng Tactile Glass */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="grid grid-cols-3 gap-4 pt-3"
          >
            <div className="glass-medical-card rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[#0F766E]">
                <Clock className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Mở cửa xuyên trưa
                </span>
              </div>
              <p className="tabular-nums-strict mt-1.5 font-heading text-lg font-extrabold text-[#132A2E]">
                {openTime} – {closeTime}
              </p>
              <p className="text-xs text-[#476268]">Tất cả các ngày trong tuần</p>
            </div>

            <div className="glass-medical-card rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[#0F766E]">
                <Stethoscope className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Đội ngũ chuyên khoa
                </span>
              </div>
              <p className="tabular-nums-strict mt-1.5 font-heading text-lg font-extrabold text-[#132A2E]">
                {doctorCount} Bác sĩ chính quy
              </p>
              <p className="text-xs text-[#476268]">2 ca trực liên tục mỗi ngày</p>
            </div>

            <div className="glass-medical-card rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[#0F766E]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Chi phí rõ ràng
                </span>
              </div>
              <p className="tabular-nums-strict mt-1.5 font-heading text-lg font-extrabold text-[#132A2E]">
                {serviceCount} Gói cố định
              </p>
              <p className="text-xs text-[#476268]">Niêm yết sẵn, không phát sinh</p>
            </div>
          </motion.div>
        </div>

        {/* Cột phải: Vật thể 3D Soft Clay + Mái vòm Kính mờ (React Three Fiber) */}
        <div className="relative col-span-6">
          <motion.div
            style={{ opacity: stageOpacity, y: stageY }}
            className="relative h-[560px] w-full overflow-hidden rounded-[38px] border border-white/85 bg-gradient-to-br from-[#F0FDFA]/80 via-[#FAF9F6]/90 to-[#FFF7ED]/75 shadow-[0_32px_70px_-24px_rgba(15,118,110,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]"
          >
            {/* Vòng sáng dịu phía sau cụm 3D */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#0F766E]/18 via-[#CCFBF1]/35 to-[#F97316]/14 blur-2xl"
            />

            {/* Scene 3D tương tác chuột 60fps */}
            <HeroClayScene scrollRatioRef={scrollRatioRef} />

            {/* Gợi ý tương tác chuột tinh tế góc trên trái */}
            <div className="glass-medical pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#0F766E]">
              <MousePointerClick className="h-3.5 w-3.5 text-[#F97316]" />
              Di chuột để tương tác không gian 3D
            </div>
          </motion.div>

          {/* Thẻ nổi Kính mờ góc trên phải */}
          <motion.div
            style={{ y: floatTopY }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-medical-card absolute -right-3 top-12 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#476268]">
                  Quy trình chuẩn quốc tế
                </p>
                <p className="text-sm font-extrabold text-[#132A2E]">
                  Bệnh án điện tử S.O.A.P
                </p>
              </div>
            </div>
          </motion.div>

          {/* Thẻ nổi Kính mờ góc dưới trái */}
          <motion.div
            style={{ y: floatBottomY }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="glass-medical-card absolute -bottom-5 left-5 max-w-sm rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#0F766E]">
                  1 Cơ sở duy nhất — Không gian tách biệt Chó &amp; Mèo
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
  );
}
