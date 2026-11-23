"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Magnetic Button — Hút mượt mà về phía con trỏ chuột khi di gần trên Desktop.
 * Giữ nguyên link/button bên trong để không ảnh hưởng hành vi điều hướng hay form.
 */
export function MagneticButton({
  children,
  className = "",
  strength = 0.28,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { stiffness: 260, damping: 18, mass: 0.45 });
  const y = useSpring(rawY, { stiffness: 260, damping: 18, mass: 0.45 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    rawX.set(dx * strength);
    rawY.set(dy * strength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
