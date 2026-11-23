"use client";

import React, { useRef, useState } from "react";
import { ZoomIn } from "lucide-react";

interface ProductZoomViewerProps {
  imageUrl: string;
  alt: string;
  inStock: boolean;
  stockQuantity?: number;
  retailUnit?: string;
  heightClass?: string;
}

/**
 * Interactive Packaging Loupe / Magnifier Zoom ("Cầm trên tay")
 * Di chuột trên ảnh để phóng đại 2.25x soi chi tiết bao bì, thành phần & tem nhãn.
 */
export function ProductZoomViewer({
  imageUrl,
  alt,
  inStock,
  stockQuantity,
  retailUnit,
  heightClass = "h-[460px]",
}: ProductZoomViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setOrigin({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-[28px] border border-[#0F766E]/12 bg-[#FAF9F6] shadow-inner cursor-zoom-in ${heightClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: zoomed ? "scale(2.25)" : "scale(1)",
        }}
        className="h-full w-full object-cover transition-transform duration-200 ease-out select-none"
      />

      {/* Nhãn trạng thái tồn kho đồng bộ thật với chấm đèn Xanh Ngọc nhấp nháy */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        {inStock ? (
          <span className="glass-dark-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-extrabold text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4BF] opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]" />
            </span>
            Còn hàng tại quầy
            {typeof stockQuantity === "number" && retailUnit ? (
              <span className="tabular-nums-strict text-[#99F6E4]">
                ({stockQuantity} {retailUnit})
              </span>
            ) : null}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 px-3.5 py-1.5 text-xs font-extrabold text-white backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Tạm hết tại quầy
          </span>
        )}
      </div>

      {/* Gợi ý soi chi tiết bao bì */}
      <div
        className={`glass-medical pointer-events-none absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#132A2E] transition-opacity duration-200 ${
          zoomed ? "opacity-0" : "opacity-100"
        }`}
      >
        <ZoomIn className="h-3.5 w-3.5 text-[#0F766E]" />
        Di chuột để soi chi tiết bao bì (2.25×)
      </div>
    </div>
  );
}
