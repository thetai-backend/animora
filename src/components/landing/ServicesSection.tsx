"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  X,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";
import { formatVnd } from "@/lib/format";

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  shortDescription: string;
  processSteps: string;
}

/**
 * Thẻ dịch vụ với hiệu ứng 3D Tilt + Spotlight Border di chuyển theo con trỏ chuột
 */
function SpatialServiceCard({
  service,
  isSpa,
  featured,
  onSelect,
}: {
  service: ServiceItem;
  isSpa: boolean;
  featured: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  const steps = service.processSteps
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateX: (0.5 - py) * 9,
      rotateY: (px - 0.5) * 10,
    });
    setSpot({
      x: px * 100,
      y: py * 100,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setSpot((prev) => ({ ...prev, active: false }));
  };

  const spotlightRgb = isSpa ? "249, 115, 22" : "15, 118, 110";

  return (
    <motion.div
      layoutId={`service-card-${service.id}`}
      ref={cardRef}
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: spot.active
          ? "transform 0.08s ease-out"
          : "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-[28px] p-[1.5px] will-change-transform ${
        featured ? "col-span-6" : "col-span-4"
      }`}
    >
      {/* Spotlight Border di chuyển theo con trỏ chuột */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300"
        style={{
          opacity: spot.active ? 1 : 0.35,
          background: spot.active
            ? `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, rgba(${spotlightRgb}, 0.65), rgba(${spotlightRgb}, 0.1) 55%, transparent 78%)`
            : `linear-gradient(135deg, rgba(${spotlightRgb}, 0.16), rgba(19, 42, 46, 0.06))`,
        }}
      />

      {/* Mặt kính tactile bên trong */}
      <div
        className={`relative flex h-full flex-col justify-between rounded-[26.5px] p-7 transition-colors duration-300 ${
          isSpa
            ? "bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF7ED]/75"
            : "bg-gradient-to-br from-[#FAFDFC] via-white to-[#F0FDFA]/70"
        }`}
      >
        {/* Vầng sáng mềm nội bộ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[26.5px] transition-opacity duration-300"
          style={{
            opacity: spot.active ? 1 : 0,
            background: `radial-gradient(320px circle at ${spot.x}% ${spot.y}%, rgba(${spotlightRgb}, 0.08), transparent 65%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`tabular-nums-strict inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                isSpa
                  ? "bg-[#F97316]/12 text-[#EA580C]"
                  : "bg-[#0F766E]/10 text-[#0F766E]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {service.durationMinutes} phút
            </span>

            <span
              className={`tabular-nums-strict font-heading text-2xl font-extrabold ${
                isSpa ? "text-[#EA580C]" : "text-[#0F766E]"
              }`}
            >
              {formatVnd(service.price)}
            </span>
          </div>

          <h3
            className={`mt-4 font-heading text-xl font-extrabold leading-snug text-[#132A2E] transition-colors ${
              isSpa ? "group-hover:text-[#EA580C]" : "group-hover:text-[#0F766E]"
            }`}
          >
            {service.name}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#476268]">
            {service.shortDescription}
          </p>

          {/* Xem trước nhanh 2 bước đầu */}
          <div className="mt-5 space-y-2 border-t border-[#132A2E]/8 pt-4">
            {steps.slice(0, featured ? 3 : 2).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-[#476268]"
              >
                <CheckCircle2
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    isSpa ? "text-[#F97316]" : "text-[#0F766E]"
                  }`}
                />
                <span className="line-clamp-1">{step}</span>
              </div>
            ))}
            {steps.length > (featured ? 3 : 2) && (
              <p className="pl-5 text-[11px] font-semibold text-[#476268]/80">
                +{steps.length - (featured ? 3 : 2)} bước chuyên sâu khác...
              </p>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-6 flex items-center justify-between pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#476268]">
            Giá cố định • Không phụ thu cân nặng
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              isSpa
                ? "bg-[#F97316]/12 text-[#EA580C] group-hover:bg-[#F97316] group-hover:text-white"
                : "bg-[#0F766E]/10 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white"
            }`}
          >
            Xem quy trình
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ServicesSection({ services }: { services: ServiceItem[] }) {
  const [activeTab, setActiveTab] = useState<"MEDICAL" | "SPA">("MEDICAL");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const medicalServices = services.filter((s) => s.category === "MEDICAL");
  const spaServices = services.filter((s) => s.category === "SPA");
  const visibleServices = activeTab === "MEDICAL" ? medicalServices : spaServices;
  const isSpaTab = activeTab === "SPA";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedService(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      id="dich-vu"
      className={`scroll-mt-24 border-y border-[#0F766E]/10 py-20 transition-colors duration-500 ${
        isSpaTab
          ? "bg-gradient-to-b from-[#FFFDF8] via-[#FFF9F2] to-[#FAF9F6]"
          : "bg-gradient-to-b from-white via-[#F6FBFA] to-white"
      }`}
    >
      <div className="mx-auto max-w-[1380px] px-6 xl:px-8">
        <div className="flex items-end justify-between gap-8">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                isSpaTab
                  ? "bg-[#F97316]/12 text-[#EA580C]"
                  : "bg-[#0F766E]/10 text-[#0F766E]"
              }`}
            >
              Bảng giá niêm yết minh bạch • Spatial Bento
            </span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E] xl:text-4xl">
              Dịch vụ Y tế &amp; Spa / Grooming
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#476268]">
              Mỗi dịch vụ áp dụng <strong>một mức giá cố định rõ ràng</strong> kèm thời lượng ước tính. Bấm vào từng thẻ để mở chi tiết quy trình từng bước và đặt lịch ngay.
            </p>
          </div>

          {/* Segmented Control trượt mượt bằng layoutId */}
          <div className="glass-medical inline-flex rounded-2xl p-1.5">
            {(
              [
                {
                  key: "MEDICAL" as const,
                  label: `Dịch vụ Y tế (${medicalServices.length})`,
                  icon: Stethoscope,
                  pillClass: "bg-[#0F766E] shadow-[0_8px_20px_-6px_rgba(15,118,110,0.55)]",
                },
                {
                  key: "SPA" as const,
                  label: `Spa & Grooming (${spaServices.length})`,
                  icon: Sparkles,
                  pillClass: "bg-[#F97316] shadow-[0_8px_20px_-6px_rgba(249,115,22,0.55)]",
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-colors ${
                    isActive ? "text-white" : "text-[#476268] hover:text-[#132A2E]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="service-segment-pill"
                      transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      className={`absolute inset-0 rounded-xl ${item.pillClass}`}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spatial Bento Grid (12 cột — 2 thẻ nổi bật đầu tiên 6-6 nếu tổng >= 5, hoặc 4-4-4 cân đối) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="mt-10 grid grid-cols-12 gap-6"
          >
            {visibleServices.map((service, idx) => {
              const featured = visibleServices.length >= 5 && idx < 2;
              return (
                <SpatialServiceCard
                  key={service.id}
                  service={service}
                  isSpa={service.category === "SPA"}
                  featured={featured}
                  onSelect={() => setSelectedService(service)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* SHARED LAYOUT EXPANSION MODAL — HIỂN THỊ QUY TRÌNH TỪNG BƯỚC + ĐẶT DỊCH VỤ NÀY */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/55 p-6 backdrop-blur-md"
          >
            <motion.div
              layoutId={`service-card-${selectedService.id}`}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/85 bg-[#FAF9F6] p-8 shadow-[0_32px_90px_-20px_rgba(19,42,46,0.45)]"
            >
              <button
                type="button"
                aria-label="Đóng chi tiết dịch vụ"
                onClick={() => setSelectedService(null)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#132A2E]/10 bg-white text-[#476268] transition hover:border-[#0F766E] hover:text-[#132A2E]"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2.5 pr-12">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold ${
                    selectedService.category === "SPA"
                      ? "bg-[#F97316]/12 text-[#EA580C]"
                      : "bg-[#0F766E]/12 text-[#0F766E]"
                  }`}
                >
                  {selectedService.category === "SPA" ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Spa &amp; Grooming
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-3.5 w-3.5" />
                      Dịch vụ Y tế Chuẩn mực
                    </>
                  )}
                </span>

                <span className="tabular-nums-strict inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#132A2E] shadow-xs">
                  <Clock className="h-3.5 w-3.5 text-[#0F766E]" />
                  Thời lượng ước tính: {selectedService.durationMinutes} phút
                </span>
              </div>

              <h3 className="mt-4 font-heading text-3xl font-extrabold text-[#132A2E]">
                {selectedService.name}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#476268]">
                {selectedService.shortDescription}
              </p>

              {/* Khối giá cố định minh bạch */}
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#0F766E]/15 bg-white px-6 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#476268]">
                    Mức giá cố định niêm yết
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#0F766E]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Không chia theo cân nặng • Không phát sinh chi phí ẩn
                  </p>
                </div>
                <span
                  className={`tabular-nums-strict font-heading text-3xl font-extrabold ${
                    selectedService.category === "SPA" ? "text-[#EA580C]" : "text-[#0F766E]"
                  }`}
                >
                  {formatVnd(selectedService.price)}
                </span>
              </div>

              {/* Quy trình thực hiện từng bước */}
              <div className="mt-6">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#132A2E]">
                  Quy trình thực hiện chi tiết tại ANIMORA
                </p>
                <ol className="mt-3 space-y-2.5">
                  {selectedService.processSteps
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-2xl border border-[#132A2E]/8 bg-white p-3.5 text-sm text-[#132A2E]"
                      >
                        <span
                          className={`tabular-nums-strict flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white ${
                            selectedService.category === "SPA"
                              ? "bg-[#F97316]"
                              : "bg-[#0F766E]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="leading-relaxed text-[#132A2E]">{step}</span>
                      </li>
                    ))}
                </ol>
              </div>

              {/* Nút hành động Đặt dịch vụ này */}
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#132A2E]/10 pt-5">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="rounded-xl border border-[#132A2E]/15 bg-white px-5 py-3 text-sm font-bold text-[#476268] transition hover:text-[#132A2E]"
                >
                  Đóng lại
                </button>
                <Link
                  href={`/dat-lich?service=${encodeURIComponent(selectedService.id)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#F97316]/30 transition hover:bg-[#EA580C]"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Đặt dịch vụ này
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
