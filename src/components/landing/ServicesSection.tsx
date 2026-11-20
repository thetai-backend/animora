"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Sparkles, Clock, CheckCircle2 } from "lucide-react";
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

export function ServicesSection({ services }: { services: ServiceItem[] }) {
  const [activeTab, setActiveTab] = useState<"MEDICAL" | "SPA">("MEDICAL");

  const medicalServices = services.filter((s) => s.category === "MEDICAL");
  const spaServices = services.filter((s) => s.category === "SPA");
  const visibleServices =
    activeTab === "MEDICAL" ? medicalServices : spaServices;

  return (
    <section
      id="dich-vu"
      className="scroll-mt-24 border-y border-[#0F766E]/10 bg-white py-20"
    >
      <div className="mx-auto max-w-[1380px] px-8">
        <div className="flex items-end justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Bảng giá niêm yết minh bạch
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
              Dịch vụ Y tế & Spa / Grooming
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#476268]">
              Mỗi dịch vụ đều áp dụng <strong>một mức giá cố định rõ ràng</strong> kèm thời lượng ước tính và quy trình thực hiện chuẩn mực để bạn hoàn toàn yên tâm trước khi đưa bé đến khám.
            </p>
          </div>

          {/* Bộ chuyển đổi nhóm Y tế / Spa */}
          <div className="inline-flex rounded-2xl border border-[#0F766E]/15 bg-[#FAF9F6] p-1.5">
            <button
              onClick={() => setActiveTab("MEDICAL")}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition ${
                activeTab === "MEDICAL"
                  ? "bg-[#0F766E] text-white shadow-md"
                  : "text-[#476268] hover:text-[#132A2E]"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Dịch vụ Y tế ({medicalServices.length})
            </button>
            <button
              onClick={() => setActiveTab("SPA")}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition ${
                activeTab === "SPA"
                  ? "bg-[#F97316] text-white shadow-md"
                  : "text-[#476268] hover:text-[#132A2E]"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Spa & Grooming ({spaServices.length})
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-10 grid grid-cols-3 gap-6"
          >
            {visibleServices.map((service) => {
              const steps = service.processSteps
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);

              return (
                <div
                  key={service.id}
                  className="group flex flex-col justify-between rounded-3xl border border-[#0F766E]/12 bg-[#FAF9F6] p-7 transition duration-200 hover:-translate-y-1 hover:border-[#0F766E]/35 hover:bg-white hover:shadow-xl hover:shadow-[#0F766E]/8"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          service.category === "MEDICAL"
                            ? "bg-[#0F766E]/10 text-[#0F766E]"
                            : "bg-[#F97316]/12 text-[#F97316]"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Ước tính {service.durationMinutes} phút
                      </span>

                      <span className="font-heading text-xl font-extrabold text-[#0F766E]">
                        {formatVnd(service.price)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-extrabold leading-snug text-[#132A2E] group-hover:text-[#0F766E]">
                      {service.name}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-[#476268]">
                      {service.shortDescription}
                    </p>

                    <div className="mt-5 border-t border-[#132A2E]/8 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#132A2E]">
                        Quy trình thực hiện:
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {steps.map((step, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs leading-relaxed text-[#476268]"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
