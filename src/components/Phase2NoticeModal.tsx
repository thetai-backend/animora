"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, PhoneCall, Search, X, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Phase2NoticeModalProps {
  open: boolean;
  mode: "BOOKING" | "LOOKUP";
  phone: string;
  onClose: () => void;
}

export function Phase2NoticeModal({
  open,
  mode,
  phone,
  onClose,
}: Phase2NoticeModalProps) {
  const isBooking = mode === "BOOKING";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#132A2E]/50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-[#0F766E]/15 bg-[#FAF9F6] p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Đóng thông báo"
              className="absolute right-5 top-5 rounded-full p-2 text-[#476268] transition hover:bg-[#0F766E]/10 hover:text-[#132A2E]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F766E]/10 text-[#0F766E]">
              {isBooking ? (
                <CalendarClock className="h-7 w-7" />
              ) : (
                <Search className="h-7 w-7" />
              )}
            </div>

            <span className="mb-2 inline-block rounded-full bg-[#F97316]/12 px-3 py-1 text-xs font-semibold text-[#F97316]">
              Đang triển khai ở Giai đoạn 2
            </span>

            <h3 className="text-2xl font-bold text-[#132A2E]">
              {isBooking
                ? "Đặt lịch khám & Spa trực tuyến"
                : "Tra cứu / Hủy lịch cho Khách vãng lai"}
            </h3>

            <p className="mt-3 leading-relaxed text-[#476268]">
              {isBooking
                ? "Tính năng đặt lịch theo ô 30 phút (hỗ trợ đặt nhiều thú cưng cùng lúc, chọn bác sĩ hoặc để phòng khám tự phân công, không cần đặt cọc) sẽ được kích hoạt ngay ở Giai đoạn 2."
                : "Tính năng nhập Mã đặt lịch (ví dụ ANM-8492) + Số điện thoại để khách vãng lai tự kiểm tra hoặc hủy lịch bất kỳ lúc nào sẽ được kích hoạt ngay ở Giai đoạn 2."}
            </p>

            <div className="mt-6 rounded-2xl border border-[#0F766E]/15 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#476268]">
                    Hỗ trợ đặt lịch nhanh qua điện thoại
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[#0F766E]">
                    {phone} (07:00 – 20:00)
                  </p>
                </div>
                <PhoneCall className="h-6 w-6 text-[#0F766E]" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-[#132A2E]/15 px-5 py-2.5 text-sm font-semibold text-[#132A2E] transition hover:bg-black/5"
              >
                Đóng lại
              </button>
              <Link
                href="/dang-nhap"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5D56]"
              >
                Trải nghiệm Đăng nhập
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
