"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

const SESSION_KEY = "animora_preloader_seen_v1";

/**
 * Preloader Seamless Transition (AURA -> ANIMORA — đúng 1.8 giây dùng GSAP)
 * 1. (0.00s - 0.45s): Hiện A U R A trên nền Xanh Than #132A2E với tia sáng quét Xanh Ngọc #0F766E.
 * 2. (0.45s - 0.95s): Chữ U lật 180° biến hình mượt thành chữ N mái vòm (A N R A).
 * 3. (0.95s - 1.45s): Tách ngang AN và RA, trượt I M O vào giữa tạo thành A N I M O R A.
 * 4. (1.45s - 1.80s): Chấm Cam San Hô #F97316 bật sáng trên chữ I, rồi phóng to vỡ thành vòng tròn ánh sáng
 *    (clip-path: circle) mở ra toàn bộ nền #FAF9F6 của Trang chủ.
 *
 * Tự động chạy 1 lần mỗi phiên (sessionStorage), và có thể kích hoạt xem lại bất cứ lúc nào
 * khi bấm Logo trên Header (qua CustomEvent "animora:replay-preloader").
 */
export function AnimoraPreloader() {
  const [visible, setVisible] = useState(false);
  const [runId, setRunId] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const lightSweepRef = useRef<HTMLDivElement>(null);
  const auraWrapRef = useRef<HTMLDivElement>(null);
  const letterURef = useRef<HTMLSpanElement>(null);
  const letterNRef = useRef<HTMLSpanElement>(null);
  const archHaloRef = useRef<SVGSVGElement>(null);
  const imoSlotRef = useRef<HTMLSpanElement>(null);
  const imoCharsRef = useRef<HTMLSpanElement[]>([]);
  const coralDotRef = useRef<HTMLSpanElement>(null);
  const portalRingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const finishPreloader = useCallback(() => {
    tlRef.current?.kill();
    tlRef.current = null;
    setVisible(false);
    document.body.style.overflow = "";
  }, []);

  // Kiểm tra lần truy cập đầu trong phiên + lắng nghe sự kiện phát lại từ Logo trên Header
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (!seen) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(true);
        setRunId((n) => n + 1);
      }
    } catch {
      // Nếu trình duyệt chặn sessionStorage thì bỏ qua không chặn giao diện
    }

    const onReplay = () => {
      setVisible(true);
      setRunId((n) => n + 1);
    };
    window.addEventListener("animora:replay-preloader", onReplay);
    return () => {
      window.removeEventListener("animora:replay-preloader", onReplay);
      document.body.style.overflow = "";
    };
  }, []);

  // Chạy kịch bản GSAP đúng 4 nhịp (1.8s + 0.55s mở vòng tròn ánh sáng)
  useEffect(() => {
    if (!visible || runId === 0) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          finishPreloader();
        },
      });
      tlRef.current = tl;

      // Reset trạng thái ban đầu
      gsap.set(overlay, {
        clipPath: "circle(150% at 50% 50%)",
        opacity: 1,
      });
      gsap.set(auraWrapRef.current, { opacity: 0, scale: 0.94, filter: "blur(6px)" });
      gsap.set(lightSweepRef.current, { xPercent: -130, opacity: 0 });
      gsap.set(letterURef.current, { rotateX: 0, opacity: 1, y: 0 });
      gsap.set(letterNRef.current, { rotateX: -180, opacity: 0, scaleY: 0.85 });
      gsap.set(archHaloRef.current, { opacity: 0, scale: 0.72 });
      gsap.set(imoSlotRef.current, { width: 0, opacity: 0 });
      gsap.set(imoCharsRef.current, { y: 18, opacity: 0 });
      gsap.set(coralDotRef.current, { scale: 0, opacity: 0 });
      gsap.set(portalRingRef.current, { scale: 0, opacity: 0 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 8 });

      // NHỊP 1 (0.00s -> 0.45s): Hiện A U R A + quét sáng Xanh Ngọc #0F766E
      tl.to(
        auraWrapRef.current,
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.34,
          ease: "power3.out",
        },
        0
      );
      tl.to(
        lightSweepRef.current,
        {
          xPercent: 145,
          opacity: 1,
          duration: 0.44,
          ease: "power2.inOut",
        },
        0.05
      );
      tl.to(lightSweepRef.current, { opacity: 0, duration: 0.12 }, 0.38);

      // NHỊP 2 (0.45s -> 0.95s): Chữ U lật 180° biến hình mượt thành chữ N mái vòm (A N R A)
      tl.to(
        letterURef.current,
        {
          rotateX: 180,
          opacity: 0,
          duration: 0.46,
          ease: "power3.inOut",
        },
        0.45
      );
      tl.to(
        letterNRef.current,
        {
          rotateX: 0,
          opacity: 1,
          scaleY: 1,
          duration: 0.48,
          ease: "power3.out",
        },
        0.54
      );
      tl.to(
        archHaloRef.current,
        {
          opacity: 0.95,
          scale: 1.08,
          duration: 0.35,
          ease: "power2.out",
        },
        0.58
      );
      tl.to(archHaloRef.current, { opacity: 0.25, scale: 1, duration: 0.25 }, 0.88);

      // NHỊP 3 (0.95s -> 1.46s): Tách ngang AN & RA, trượt I M O vào giữa -> A N I M O R A
      tl.to(
        imoSlotRef.current,
        {
          width: "3.28ch",
          opacity: 1,
          duration: 0.48,
          ease: "expo.out",
        },
        0.95
      );
      tl.to(
        imoCharsRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.36,
          stagger: 0.08,
          ease: "back.out(1.4)",
        },
        1.0
      );
      tl.to(
        subtitleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.34,
          ease: "power2.out",
        },
        1.15
      );

      // NHỊP 4 (1.46s -> 1.80s): Chấm Cam San Hô #F97316 bật sáng trên đầu chữ I
      tl.to(
        coralDotRef.current,
        {
          scale: 1.55,
          opacity: 1,
          duration: 0.22,
          ease: "back.out(2.6)",
        },
        1.46
      );
      tl.to(
        coralDotRef.current,
        {
          scale: 1,
          duration: 0.14,
          ease: "power2.out",
        },
        1.66
      );

      // MỞ MÀN VÒNG TRÒN ÁNH SÁNG (1.80s -> 2.38s): Chấm cam bung thành vòng tròn ánh sáng mở ra nền #FAF9F6
      tl.to(
        portalRingRef.current,
        {
          scale: 46,
          opacity: 0.92,
          duration: 0.52,
          ease: "power4.inOut",
        },
        1.82
      );
      tl.to(
        auraWrapRef.current,
        {
          scale: 1.07,
          opacity: 0,
          duration: 0.32,
          ease: "power2.in",
        },
        1.86
      );
      tl.to(
        overlay,
        {
          clipPath: "circle(0% at 50% 48%)",
          duration: 0.56,
          ease: "expo.inOut",
        },
        1.94
      );
    }, overlay);

    // Fail-safe đảm bảo không bao giờ kẹt màn hình
    const safetyTimer = window.setTimeout(() => {
      finishPreloader();
    }, 3200);

    return () => {
      window.clearTimeout(safetyTimer);
      ctx.revert();
    };
  }, [visible, runId, finishPreloader]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-label="Đang mở không gian y khoa ANIMORA"
      className="no-print fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#132A2E] text-[#FAF9F6]"
    >
      {/* Vầng sáng Xanh Ngọc dịu mắt phía sau */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-[#0F766E]/32 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[240px] w-[240px] rounded-full bg-[#F97316]/14 blur-[80px]"
      />

      {/* Vòng tròn ánh sáng bung ra ở nhịp cuối */}
      <div
        ref={portalRingRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[48%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F97316]/80 bg-gradient-to-tr from-[#FAF9F6] via-[#FFF7ED] to-[#CCFBF1] shadow-[0_0_80px_rgba(249,115,22,0.8)]"
      />

      {/* Khối Logo AURA -> ANIMORA */}
      <div ref={auraWrapRef} className="relative z-10 flex flex-col items-center">
        <div className="relative inline-flex items-baseline font-heading text-6xl font-extrabold leading-none tracking-[0.18em] text-[#FAF9F6] xl:text-7xl">
          {/* Vệt ánh sáng quét Xanh Ngọc #0F766E -> #5EEAD4 */}
          <div
            ref={lightSweepRef}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-4 left-0 z-20 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#5EEAD4]/85 to-transparent mix-blend-screen"
          />

          {/* Cụm AN */}
          <span className="inline-flex items-baseline">
            <span className="text-[#FAF9F6]">A</span>

            {/* Chữ U lật 180° -> N mái vòm bảo vệ */}
            <span
              className="relative inline-grid place-items-center"
              style={{ perspective: 520 }}
            >
              <svg
                ref={archHaloRef}
                aria-hidden="true"
                viewBox="0 0 64 64"
                className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]"
                fill="none"
              >
                <path
                  d="M12 50V28C12 16.954 20.954 8 32 8C43.046 8 52 16.954 52 28V50"
                  stroke="#2DD4BF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />
              </svg>

              <span
                ref={letterURef}
                aria-hidden="true"
                className="col-start-1 row-start-1 inline-block origin-center text-[#5EEAD4]"
                style={{ backfaceVisibility: "hidden" }}
              >
                U
              </span>
              <span
                ref={letterNRef}
                className="col-start-1 row-start-1 inline-block origin-center text-[#5EEAD4]"
                style={{ backfaceVisibility: "hidden" }}
              >
                N
              </span>
            </span>
          </span>

          {/* Cụm giữa I M O trượt vào */}
          <span
            ref={imoSlotRef}
            className="inline-flex items-baseline justify-center overflow-visible"
          >
            <span
              ref={(el) => {
                if (el) imoCharsRef.current[0] = el;
              }}
              className="relative inline-flex flex-col items-center"
            >
              {/* Chấm Cam San Hô #F97316 trên chữ I */}
              <span
                ref={coralDotRef}
                aria-hidden="true"
                className="absolute -top-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#F97316] shadow-[0_0_24px_rgba(249,115,22,1)]"
              />
              <span>I</span>
            </span>
            <span
              ref={(el) => {
                if (el) imoCharsRef.current[1] = el;
              }}
            >
              M
            </span>
            <span
              ref={(el) => {
                if (el) imoCharsRef.current[2] = el;
              }}
            >
              O
            </span>
          </span>

          {/* Cụm RA */}
          <span className="inline-flex items-baseline">
            <span>R</span>
            <span>A</span>
          </span>
        </div>

        <p
          ref={subtitleRef}
          className="mt-6 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.34em] text-[#99F6E4]/85"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
          Y khoa Thú nhỏ Chuẩn mực • Chăm sóc Tận tâm
        </p>
      </div>

      {/* Nút bỏ qua kín đáo góc dưới phải */}
      <button
        type="button"
        onClick={finishPreloader}
        className="absolute bottom-8 right-8 z-20 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
      >
        Vào ngay
      </button>
    </div>
  );
}
