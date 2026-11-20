"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Tag, Clock, CheckCircle2 } from "lucide-react";
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

function CountdownBadge({ endDate }: { endDate: string }) {
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
      <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white">
        <Clock className="h-4 w-4" />
        Đang cập nhật thời gian...
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-[#132A2E]/35 px-4 py-2 text-white backdrop-blur-xs">
      <Clock className="h-4 w-4 text-[#FDBA74]" />
      <span className="text-xs font-medium text-white/80">Còn lại:</span>
      <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
        <span className="rounded-md bg-white/15 px-2 py-0.5">{timeLeft.days} ngày</span>
        <span className="rounded-md bg-white/15 px-2 py-0.5">{pad(timeLeft.hours)}g</span>
        <span className="rounded-md bg-white/15 px-2 py-0.5">{pad(timeLeft.minutes)}p</span>
        <span className="rounded-md bg-[#F97316] px-2 py-0.5">{pad(timeLeft.seconds)}s</span>
      </div>
    </div>
  );
}

export function PromotionsSection({
  promotions,
}: {
  promotions: PromotionItem[];
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (promotions.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section id="uu-dai" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1380px] px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316]/12 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F97316]">
              <Sparkles className="h-3.5 w-3.5" />
              Sự kiện & Ưu đãi đang diễn ra
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
              Chương trình khuyến mãi tại phòng khám
            </h2>
          </div>
          <p className="max-w-md text-right text-sm text-[#476268]">
            Ưu đãi được áp dụng trực tiếp khi thanh toán tại quầy và có thể cộng dồn theo chính sách phòng khám.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {promotions.map((promo, index) => {
            const isPrimaryCard = index % 2 === 0;
            const discountLabel =
              promo.discountType === "PERCENT"
                ? `Giảm ${promo.discountValue}%`
                : `Giảm ${formatVnd(promo.discountValue)}`;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl ${
                  isPrimaryCard
                    ? "bg-gradient-to-br from-[#0F766E] via-[#0D6B63] to-[#132A2E]"
                    : "bg-gradient-to-br from-[#132A2E] via-[#1B3D43] to-[#0F766E]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#F97316]/20 blur-2xl"
                />

                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm">
                        <Tag className="h-3.5 w-3.5" />
                        {promo.badgeText || discountLabel}
                      </span>
                      <CountdownBadge endDate={promo.endDate} />
                    </div>

                    <h3 className="mt-5 text-2xl font-extrabold leading-snug">
                      {promo.title}
                    </h3>

                    {promo.subtitle && (
                      <p className="mt-1.5 text-sm font-semibold text-[#99F6E4]">
                        {promo.subtitle}
                      </p>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-white/85">
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
                          : "Toàn bộ dịch vụ"}
                      </span>
                    </div>

                    {promo.code && (
                      <button
                        onClick={() => handleCopy(promo.code!)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-white transition hover:bg-white/20"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-[#5EEAD4]" />
                            Đã sao chép: {promo.code}
                          </>
                        ) : (
                          <>Mã ưu đãi: {promo.code}</>
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
