"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface AnimoraLogoProps {
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  showReplayHint?: boolean;
  triggerGlobalPreloader?: boolean;
  className?: string;
}

/**
 * Logo động thương hiệu ANIMORA (Tổng thời lượng chuẩn 1.8 giây):
 * 1. (0.00s - 0.45s): Xuất hiện "A U R A" với ánh sáng quét màu xanh ngọc (#0F766E).
 * 2. (0.45s - 0.95s): Chữ "U" lật ngược 180° theo trục dọc và biến hình mượt thành chữ "N" (mái vòm bảo vệ -> "A N R A").
 * 3. (0.95s - 1.48s): Hai cụm "AN" và "RA" tách ngang để "I M O" trượt nhịp nhàng vào giữa -> "A N I M O R A".
 * 4. (1.48s - 1.80s): Chấm sáng màu cam san hô (#F97316) bật lên trên đầu chữ "I".
 */
export function AnimoraLogo({
  size = "md",
  interactive = true,
  showReplayHint = false,
  triggerGlobalPreloader = false,
  className = "",
}: AnimoraLogoProps) {
  const [replayKey, setReplayKey] = useState(0);

  const sizeConfig = {
    sm: {
      text: "text-xl tracking-[0.14em]",
      imoWidth: "3.15ch",
      dotSize: "w-1.5 h-1.5 -top-0.5",
      subText: "text-[9px]",
    },
    md: {
      text: "text-[26px] tracking-[0.15em]",
      imoWidth: "3.25ch",
      dotSize: "w-2 h-2 -top-1",
      subText: "text-[10px]",
    },
    lg: {
      text: "text-5xl tracking-[0.16em]",
      imoWidth: "3.3ch",
      dotSize: "w-3 h-3 -top-1.5",
      subText: "text-xs",
    },
  }[size];

  const handleReplay = () => {
    if (!interactive) return;
    setReplayKey((prev) => prev + 1);
    if (triggerGlobalPreloader && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("animora:replay-preloader"));
    }
  };

  return (
    <div
      onClick={handleReplay}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleReplay();
        }
      }}
      title={interactive ? "Bấm vào logo để xem lại hiệu ứng AURA → ANIMORA (1,8s)" : undefined}
      className={`group inline-flex flex-col select-none ${
        interactive ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div
        key={replayKey}
        className={`relative inline-flex items-baseline font-heading font-extrabold leading-none text-[#0F766E] ${sizeConfig.text}`}
      >
        {/* Vệt ánh sáng quét màu xanh ngọc trên cụm AURA ở bước 1 (0.0s -> 0.45s) */}
        <motion.span
          aria-hidden="true"
          initial={{ x: "-110%", opacity: 0 }}
          animate={{ x: "120%", opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.48, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#5EEAD4]/85 to-transparent"
        />

        {/* Cụm bên trái: A + (U lật 180° -> N) */}
        <motion.span
          initial={{ opacity: 0, filter: "blur(3px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="inline-flex items-baseline"
        >
          <span>A</span>

          {/* Chữ U lật 180° theo trục dọc (mái vòm che chở) và biến hình mượt thành chữ N */}
          <span className="relative inline-grid place-items-center" style={{ perspective: 400 }}>
            <motion.span
              aria-hidden="true"
              initial={{ rotateX: 0, opacity: 1, scaleY: 1 }}
              animate={{
                rotateX: [0, 0, 180, 180],
                opacity: [1, 1, 0.85, 0],
              }}
              transition={{
                duration: 0.96,
                times: [0, 0.46, 0.82, 1],
                ease: "easeInOut",
              }}
              className="col-start-1 row-start-1 inline-block origin-center text-[#0F766E]"
            >
              U
            </motion.span>

            <motion.span
              initial={{ opacity: 0, scaleY: 0.82 }}
              animate={{
                opacity: [0, 0, 1],
                scaleY: [0.82, 0.92, 1],
              }}
              transition={{
                duration: 0.98,
                times: [0, 0.72, 1],
                ease: "easeOut",
              }}
              className="col-start-1 row-start-1 inline-block text-[#0F766E]"
            >
              N
            </motion.span>
          </span>
        </motion.span>

        {/* Cụm giữa: I M O mở rộng và trượt nhịp nhàng vào khoảng tách giữa AN và RA (0.95s -> 1.48s) */}
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: sizeConfig.imoWidth, opacity: 1 }}
          transition={{
            delay: 0.95,
            duration: 0.52,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-flex items-baseline justify-center overflow-visible"
        >
          {/* Chữ I với chấm sáng màu cam san hô (#F97316) bật lên ở bước 4 (1.48s -> 1.80s) */}
          <motion.span
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.02, duration: 0.36, ease: "easeOut" }}
            className="relative inline-flex flex-col items-center"
          >
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.45, 1],
                opacity: [0, 1, 1],
                boxShadow: [
                  "0 0 0px rgba(249,115,22,0)",
                  "0 0 14px rgba(249,115,22,0.95)",
                  "0 0 6px rgba(249,115,22,0.55)",
                ],
              }}
              transition={{
                delay: 1.48,
                duration: 0.32,
                ease: "easeOut",
              }}
              className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] ${sizeConfig.dotSize}`}
            />
            <span>I</span>
          </motion.span>

          <motion.span
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.12, duration: 0.34, ease: "easeOut" }}
          >
            M
          </motion.span>

          <motion.span
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.22, duration: 0.3, ease: "easeOut" }}
          >
            O
          </motion.span>
        </motion.span>

        {/* Cụm bên phải: R A */}
        <motion.span
          initial={{ opacity: 0, filter: "blur(3px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="inline-flex items-baseline"
        >
          <span>R</span>
          <span>A</span>
        </motion.span>
      </div>

      {showReplayHint && (
        <span
          className={`mt-1 inline-flex items-center gap-1 font-medium text-[#476268] transition-colors group-hover:text-[#0F766E] ${sizeConfig.subText}`}
        >
          <RotateCcw className="h-3 w-3" />
          Bấm logo để xem lại hiệu ứng AURA → ANIMORA (1,8s)
        </span>
      )}
    </div>
  );
}
