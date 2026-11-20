"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Stethoscope } from "lucide-react";

export interface DoctorProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  specialty: string | null;
  experienceYears: number | null;
  bio: string | null;
}

export function DoctorsSection({ doctors }: { doctors: DoctorProfile[] }) {
  return (
    <section
      id="bac-si"
      className="scroll-mt-24 border-y border-[#0F766E]/10 bg-white py-20"
    >
      <div className="mx-auto max-w-[1380px] px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            <Stethoscope className="h-3.5 w-3.5" />
            Đội ngũ chuyên môn tận tâm
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
            Bác sĩ Thú y trực tiếp thăm khám
          </h2>
          <p className="mt-2 text-sm text-[#476268]">
            Các bác sĩ xoay ca trực xuyên suốt từ 07:00 đến 20:00 mỗi ngày, luôn sẵn sàng tiếp nhận khám định kỳ, tiêm phòng, spa và xử lý cấp cứu thú nhỏ.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="group overflow-hidden rounded-3xl border border-[#0F766E]/12 bg-[#FAF9F6] transition duration-300 hover:-translate-y-1.5 hover:border-[#0F766E]/35 hover:bg-white hover:shadow-2xl hover:shadow-[#0F766E]/12"
            >
              <div className="relative h-80 overflow-hidden bg-[#E9F1EF]">
                <img
                  src={doctor.avatarUrl || "/images/doctor-1.jpg"}
                  alt={doctor.fullName}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
                {doctor.experienceYears && (
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#132A2E]/85 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                    <Award className="h-3.5 w-3.5 text-[#F97316]" />
                    {doctor.experienceYears}+ năm kinh nghiệm
                  </span>
                )}
              </div>

              <div className="p-7">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                  {doctor.title || "Bác sĩ Thú y"}
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-[#132A2E]">
                  {doctor.fullName}
                </h3>

                {doctor.specialty && (
                  <p className="mt-2 inline-block rounded-xl bg-[#0F766E]/8 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">
                    Chuyên môn: {doctor.specialty}
                  </p>
                )}

                {doctor.bio && (
                  <p className="mt-4 text-sm leading-relaxed text-[#476268]">
                    {doctor.bio}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
