"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Tag, CheckCircle2, Copy, ChevronRight, ChevronLeft } from "lucide-react";
import { formatVnd } from "@/lib/format";

export interface PromotionItem {
  id: string;
  code: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  discountType: string;
  discountValue: number;
  applicableScope: string;
  badgeText: string | null;
  endDate: string;
}

function FlipDigitBox({
  value,
  unit,
  highlight = false,
}: {
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <div
        className={`relative h-8 min-w-[34px] overflow-hidden rounded-lg px-2 text-center font-body text-sm font-extrabold leading-8 tabular-nums-strict ${
          highlight
            ? "bg-[#F97316] text-white shadow-[0_4px_14px_rgba(249,115,22,0.45)]"
            : "bg-[#132A2E] text-[#FAF9F6]"
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: -16, opacity: 0, rotateX: 55 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 16, opacity: 0, rotateX: -55 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[11px] font-bold text-[#476268]">{unit}</span>
    </div>
  );
}

function MechanicalCountdown({
  endDate,
  variant = "light",
}: {
  endDate: string;
  variant?: "light" | "dark";
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const compute = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) {
    return (
      <span
        className={`tabular-nums-strict text-xs font-semibold ${
          variant === "dark" ? "text-white/75" : "text-[#476268]"
        }`}
      >
        Đang đồng bộ đồng hồ...
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  if (variant === "dark") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#132A2E]/45 px-3 py-1.5 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#F97316] animate-heartbeat" />
        <div className="tabular-nums-strict flex items-center gap-1.5 font-body text-xs font-extrabold text-white">
          <span className="rounded-md bg-white/15 px-2 py-0.5">{timeLeft.days}n</span>
          <span className="rounded-md bg-white/15 px-2 py-0.5">{pad(timeLeft.hours)}g</span>
          <span className="rounded-md bg-white/15 px-2 py-0.5">{pad(timeLeft.minutes)}p</span>
          <span className="rounded-md bg-[#F97316] px-2 py-0.5">{pad(timeLeft.seconds)}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <FlipDigitBox value={String(timeLeft.days)} unit="ngày" />
      <FlipDigitBox value={pad(timeLeft.hours)} unit="giờ" />
      <FlipDigitBox value={pad(timeLeft.minutes)} unit="phút" />
      <FlipDigitBox value={pad(timeLeft.seconds)} unit="giây" highlight />
    </div>
  );
}

export function PromotionsSection({
  promotions,
}: {
  promotions: PromotionItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % promotions.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  const activePromo = promotions[activeIndex % promotions.length];

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  return (
    <section id="uu-dai" className="scroll-mt-24 relative z-20 -mt-9 pb-16 pt-2">
      <div className="mx-auto max-w-[1380px] px-6 xl:px-8">
        {/* FLOATING GLASS PILL / DYNAMIC TICKER NGAY DƯỚI HERO */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-medical-card relative overflow-hidden rounded-[28px] px-6 py-4"
        >
          <div className="flex items-center justify-between gap-6">
            {/* Trái: Nhãn Live + Nội dung sự kiện chạy mượt */}
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#F97316]/12 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#EA580C]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F97316] animate-heartbeat" />
                </span>
                Ưu đãi trực tiếp
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePromo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <span className="shrink-0 rounded-lg bg-[#0F766E] px-2.5 py-1 text-[11px] font-extrabold text-white">
                      {activePromo.badgeText ||
                        (activePromo.discountType === "PERCENT"
                          ? `Giảm ${activePromo.discountValue}%`
                          : `Giảm ${formatVnd(activePromo.discountValue)}`)}
                    </span>
                    <p className="truncate font-heading text-base font-extrabold text-[#132A2E]">
                      {activePromo.title}
                    </p>
                    {activePromo.subtitle && (
                      <span className="hidden truncate text-xs font-medium text-[#476268] xl:inline">
                        — {activePromo.subtitle}
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Phải: Đồng hồ cơ học lật số + nút chuyển sự kiện */}
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-2.5 border-l border-[#132A2E]/10 pl-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#476268]">
                  Còn lại
                </span>
                <MechanicalCountdown endDate={activePromo.endDate} variant="light" />
              </div>

              {promotions.length > 1 && (
                <div className="flex items-center gap-1 border-l border-[#132A2E]/10 pl-3">
                  <button
                    type="button"
                    aria-label="Ưu đãi trước"
                    onClick={() =>
                      setActiveIndex((prev) => (prev - 1 + promotions.length) % promotions.length)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#0F766E]/15 bg-white text-[#132A2E] transition hover:border-[#0F766E] hover:text-[#0F766E]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ưu đãi tiếp theo"
                    onClick={() => setActiveIndex((prev) => (prev + 1) % promotions.length)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#0F766E]/15 bg-white text-[#132A2E] transition hover:border-[#0F766E] hover:text-[#0F766E]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* TIÊU ĐỀ & THẺ CHI TIẾT CÁC SỰ KIỆN ĐANG BẬT TỪ DATABASE/CMS */}
        <div className="mt-12 flex items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316]/12 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F97316]">
              <Sparkles className="h-3.5 w-3.5" />
              Sự kiện &amp; Ưu đãi đang diễn ra
            </span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E]">
              Chương trình khuyến mãi tại phòng khám
            </h2>
          </div>
          <p className="max-w-md text-right text-sm text-[#476268]">
            Đồng bộ trực tiếp từ hệ thống Quản lý. Ưu đãi áp dụng ngay tại quầy Lễ tân và hỗ trợ cộng dồn theo thứ tự chuẩn.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-6">
          {promotions.map((promo, index) => {
            const isPrimaryCard = index % 2 === 0;
            const discountLabel =
              promo.discountType === "PERCENT"
                ? `Giảm ${promo.discountValue}%`
                : `Giảm ${formatVnd(promo.discountValue)}`;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className={`group relative overflow-hidden rounded-[30px] border border-white/15 p-8 text-white shadow-[0_24px_48px_-20px_rgba(19,42,46,0.35)] transition-transform duration-300 hover:-translate-y-1 ${
                  isPrimaryCard
                    ? "bg-gradient-to-br from-[#0F766E] via-[#0B5D56] to-[#132A2E]"
                    : "bg-gradient-to-br from-[#132A2E] via-[#173A40] to-[#0F766E]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-[#F97316]/22 blur-3xl transition-transform duration-500 group-hover:scale-125"
                />

                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-md shadow-[#F97316]/30">
                        <Tag className="h-3.5 w-3.5" />
                        {promo.badgeText || discountLabel}
                      </span>
                      <MechanicalCountdown endDate={promo.endDate} variant="dark" />
                    </div>

                    <h3 className="mt-5 font-heading text-2xl font-extrabold leading-snug">
                      {promo.title}
                    </h3>

                    {promo.subtitle && (
                      <p className="mt-1.5 text-sm font-semibold text-[#99F6E4]">
                        {promo.subtitle}
                      </p>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-white/82">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/15 pt-5">
                    <div className="text-xs text-white/75">
                      Phạm vi áp dụng:{" "}
                      <span className="font-bold text-white">
                        {promo.applicableScope === "SPA"
                          ? "Dịch vụ Spa / Grooming"
                          : promo.applicableScope === "MEDICAL"
                          ? "Dịch vụ Y tế"
                          : promo.applicableScope === "SHOP"
                          ? "Sản phẩm Shop"
                          : "Toàn bộ dịch vụ"}
                      </span>
                    </div>

                    {promo.code && (
                      <button
                        type="button"
                        onClick={() => handleCopy(promo.code!)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold tracking-wider text-white backdrop-blur-md transition hover:bg-white/22 active:scale-[0.98]"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-[#5EEAD4]" />
                            Đã sao chép: {promo.code}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#FDBA74]" />
                            Mã: {promo.code}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
