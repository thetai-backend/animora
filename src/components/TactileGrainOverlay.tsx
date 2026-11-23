import React from "react";

/**
 * Lớp phủ hạt giấy y khoa siêu mịn (SVG fractalNoise opacity ~0.03)
 * Tạo chiều sâu xúc giác "Tactile Spatial Medical" trên nền #FAF9F6.
 * Tự động ẩn hoàn toàn khi in A4 (@media print).
 */
export function TactileGrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="tactile-paper-grain no-print pointer-events-none fixed inset-0 z-[60] opacity-[0.032] mix-blend-multiply"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="animora-tactile-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#animora-tactile-grain)" />
      </svg>
    </div>
  );
}
