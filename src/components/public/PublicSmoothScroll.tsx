"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis Smooth Scroll — CHỈ gắn cho Trang Quảng cáo & Trang sản phẩm công khai.
 * TUYỆT ĐỐI KHÔNG gắn cho các Dashboard nội bộ (/quan-ly, /le-tan, /bac-si, /tai-khoan)
 * và tự động dừng khi trình duyệt mở chế độ in (@media print).
 */
export function PublicSmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.08,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Hỗ trợ cuộn mượt cho liên kết neo (#uu-dai, #dich-vu, ...)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;
      const hashIdx = href.indexOf("#");
      if (hashIdx === -1) return;
      const pathPart = href.slice(0, hashIdx);
      if (pathPart && pathPart !== "/" && pathPart !== window.location.pathname) return;
      const id = href.slice(hashIdx + 1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el, { offset: -86 });
      }
    };

    const handleBeforePrint = () => {
      lenis.stop();
    };
    const handleAfterPrint = () => {
      lenis.start();
    };

    document.addEventListener("click", handleAnchorClick);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
