"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Stethoscope, CalendarClock, ShieldCheck } from "lucide-react";

export interface DoctorProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  specialty: string | null;
  experienceYears: number | null;
  bio: string | null;
  shiftSummary?: string;
}

export function DoctorsSection({ doctors }: { doctors: DoctorProfile[] }) {
  return (
    <section
      id="bac-si"
      className="scroll-mt-24 border-y border-[#0F766E]/10 bg-gradient-to-b from-white via-[#F6FBFA] to-white py-20"
    >
      <div className="mx-auto max-w-[1380px] px-6 xl:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            <Stethoscope className="h-3.5 w-3.5" />
            Thẻ Định Danh Chuyên Khoa • 2.5D Medical ID
          </span>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E] xl:text-4xl">
            Đội ngũ Bác sĩ Thú y trực tiếp thăm khám
          </h2>
          <p className="mt-2 text-sm text-[#476268]">
            Di chuột vào từng Thẻ định danh y khoa để xem nhanh số năm kinh nghiệm, chuyên khoa sâu và lịch ca trực xuyên trưa 07:00 – 20:00 mỗi ngày.
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="glass-medical-card mt-12 rounded-3xl p-12 text-center">
            <p className="text-base font-bold text-[#132A2E]">
              Chưa có dữ liệu đội ngũ Bác sĩ
            </p>
            <p className="mt-1.5 text-sm text-[#476268]">
              Quản lý vui lòng thêm tài khoản Bác sĩ trong trang Quản trị để hiển thị hồ sơ chuyên khoa tại đây.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-3 gap-8">
            {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-[32px] border border-[#0F766E]/14 bg-[#FAF9F6] shadow-[0_14px_38px_-16px_rgba(19,42,46,0.12)] transition-all duration-500 hover:-translate-y-2 hover:border-[#0F766E]/35 hover:bg-white hover:shadow-[0_30px_64px_-20px_rgba(15,118,110,0.24)]"
            >
              {/* Thanh header Thẻ định danh Y khoa */}
              <div className="flex items-center justify-between border-b border-[#0F766E]/10 bg-white/80 px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5 text-[#0F766E]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  ANIMORA MEDICAL ID
                </span>
                <span className="tabular-nums-strict font-mono text-[#476268]">
                  BS-{String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Khung chân dung 2.5D Depth */}
              <div className="relative h-[340px] overflow-hidden bg-gradient-to-b from-[#E5F4F1] via-[#EFF8F6] to-[#FAF9F6]">
                {/* Lớp nền kiến trúc y khoa mờ nhẹ khi hover (tạo chiều sâu 2.5D) */}
                <div
                  aria-hidden="true"
                  className="medical-dot-grid absolute inset-0 transition-all duration-500 group-hover:scale-110 group-hover:blur-[3px] group-hover:opacity-65"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#0F766E]/16 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-[#0F766E]/26"
                />

                {/* Chân dung bác sĩ nổi lên lớp trước khi di chuột */}
                <div className="relative z-10 h-full w-full transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.06]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doctor.avatarUrl || `/images/doctor-${(index % 3) + 1}.jpg`}
                    alt={doctor.fullName}
                    className="h-full w-full object-cover object-top transition-all duration-500 group-hover:drop-shadow-[0_22px_28px_rgba(19,42,46,0.3)]"
                  />
                  {/* Gradient phủ đáy mượt */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#132A2E]/65 via-[#132A2E]/20 to-transparent" />
                </div>

                {/* FLOATING BADGE 1 (Trái trên): Kinh nghiệm — trượt vào mượt khi hover */}
                {doctor.experienceYears && (
                  <div className="glass-dark-pill absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold text-white transition-all duration-400 group-hover:translate-x-1 group-hover:scale-105">
                    <Award className="h-3.5 w-3.5 text-[#F97316]" />
                    <span className="tabular-nums-strict">
                      {doctor.experienceYears}+ năm kinh nghiệm
                    </span>
                  </div>
                )}

                {/* FLOATING BADGE 2 (Phải trên): Lịch trực — trượt ra rõ nét khi hover */}
                <div className="glass-medical-card absolute right-4 top-14 z-20 inline-flex translate-x-6 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-[#0F766E] opacity-0 transition-all duration-400 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                  <CalendarClock className="h-3.5 w-3.5 text-[#F97316]" />
                  {doctor.shiftSummary || "Trực xoay ca 07:00 – 20:00"}
                </div>

                {/* FLOATING BADGE 3 (Dưới trái): Chuyên khoa trượt lên từ đáy ảnh */}
                {doctor.specialty && (
                  <div className="glass-medical absolute bottom-4 left-4 right-4 z-20 translate-y-2 rounded-2xl px-3.5 py-2.5 transition-all duration-400 group-hover:translate-y-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E]">
                      Chuyên khoa sâu
                    </p>
                    <p className="mt-0.5 truncate text-xs font-extrabold text-[#132A2E]">
                      {doctor.specialty}
                    </p>
                  </div>
                )}
              </div>

              {/* Thông tin định danh phía dưới */}
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">
                    {doctor.title || "Bác sĩ Thú y"}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-extrabold text-[#132A2E]">
                    {doctor.fullName}
                  </h3>
                  {doctor.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-[#476268]">
                      {doctor.bio}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#132A2E]/8 pt-3.5 text-xs font-semibold text-[#476268]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Khám Y tế &amp; Spa chuẩn mực
                  </span>
                  <span className="font-bold text-[#0F766E]">
                    {doctor.shiftSummary || "2 ca xoay vòng"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}
