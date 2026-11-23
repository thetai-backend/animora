"use client";

import React from "react";
import Link from "next/link";
import { Printer, ArrowLeft, FileText } from "lucide-react";

export function PrintTriggerBar({
  title,
  backHref,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  backHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="no-print sticky top-0 z-40 border-b border-[#0F766E]/15 bg-white/95 px-8 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else if (backHref) {
                window.location.href = backHref;
              } else {
                window.close();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] px-4 py-2 text-xs font-bold text-[#132A2E] hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <span className="text-sm font-extrabold text-[#0F766E]">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/25 bg-[#FAF9F6] px-4 py-2.5 text-xs font-extrabold text-[#0F766E] hover:bg-[#0F766E]/10"
            >
              <FileText className="h-4 w-4" />
              {secondaryLabel}
            </Link>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-[#F97316]/25 hover:bg-[#EA580C]"
          >
            <Printer className="h-4 w-4" />
            In ngay (Khổ giấy A4)
          </button>
        </div>
      </div>
    </div>
  );
}
