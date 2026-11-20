"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { formatSpecies, formatVnd } from "@/lib/format";

export interface ShopProductItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  targetSpecies: string;
  price: number;
  retailUnit: string;
  stockQuantity: number;
  imageUrl: string;
  shortDescription: string;
}

const SPECIES_FILTERS = [
  { key: "ALL", label: "Tất cả loài" },
  { key: "DOG", label: "Dành cho Chó" },
  { key: "CAT", label: "Dành cho Mèo" },
  { key: "BOTH", label: "Dùng chung Chó & Mèo" },
];

export function ShopGallerySection({
  products,
}: {
  products: ShopProductItem[];
}) {
  const [speciesFilter, setSpeciesFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["ALL", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSpecies =
        speciesFilter === "ALL" ||
        p.targetSpecies === speciesFilter ||
        (speciesFilter !== "BOTH" && p.targetSpecies === "BOTH");
      const matchCategory =
        categoryFilter === "ALL" || p.category === categoryFilter;
      return matchSpecies && matchCategory;
    });
  }, [products, speciesFilter, categoryFilter]);

  return (
    <section id="san-pham" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-[1380px] px-8">
        {/* Tiêu đề & Lưu ý chỉ tham khảo mua tại quầy */}
        <div className="flex items-end justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <Store className="h-3.5 w-3.5" />
              Thư viện Sản phẩm tại quầy ANIMORA
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-[#132A2E]">
              Sản phẩm Chăm sóc & Dinh dưỡng Chính hãng
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#476268]">
              Tất cả sản phẩm đều được bác sĩ thú y tuyển chọn kỹ lưỡng. Bạn có thể xem trước thành phần, công dụng, hướng dẫn sử dụng chi tiết và <strong>mua trực tiếp tại quầy phòng khám</strong> (không bán giao hàng online).
            </p>
          </div>

          <div className="rounded-2xl border border-[#F97316]/25 bg-[#F97316]/8 px-5 py-3.5 text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
              Lưu ý mua hàng
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#132A2E]">
              Chỉ trưng bày tham khảo & mua trực tiếp tại quầy
            </p>
          </div>
        </div>

        {/* Thanh Bộ lọc theo Loài & Danh mục */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#0F766E]/12 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#476268]">
              <Filter className="h-3.5 w-3.5 text-[#0F766E]" />
              Loài:
            </span>
            {SPECIES_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setSpeciesFilter(f.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  speciesFilter === f.key
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#FAF9F6] text-[#476268] hover:bg-[#0F766E]/10 hover:text-[#0F766E]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#476268]">
              Danh mục:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  categoryFilter === cat
                    ? "bg-[#132A2E] text-white"
                    : "bg-[#FAF9F6] text-[#476268] hover:bg-[#132A2E]/10 hover:text-[#132A2E]"
                }`}
              >
                {cat === "ALL" ? "Tất cả danh mục" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lưới sản phẩm */}
        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#0F766E]/25 bg-white p-14 text-center">
            <p className="text-base font-bold text-[#132A2E]">
              Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
            <button
              onClick={() => {
                setSpeciesFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="mt-4 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Xem lại toàn bộ sản phẩm
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => {
              const inStock = product.stockQuantity > 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.35, delay: (idx % 4) * 0.05 }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-[#0F766E]/12 bg-white transition duration-200 hover:-translate-y-1 hover:border-[#0F766E]/35 hover:shadow-xl hover:shadow-[#0F766E]/10"
                >
                  <Link
                    href={`/san-pham/${product.slug}`}
                    className="relative block h-52 overflow-hidden bg-[#FAF9F6]"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#132A2E] shadow-xs backdrop-blur-xs">
                      {formatSpecies(product.targetSpecies)}
                    </span>
                    <span
                      className={`absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs ${
                        inStock
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {inStock ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Còn hàng tại quầy
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Tạm hết tại quầy
                        </>
                      )}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-[#476268]">
                        <span>{product.brand}</span>
                        <span className="text-[#0F766E]">{product.category}</span>
                      </div>

                      <Link href={`/san-pham/${product.slug}`}>
                        <h3 className="mt-2 line-clamp-2 text-base font-extrabold leading-snug text-[#132A2E] transition group-hover:text-[#0F766E]">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#476268]">
                        {product.shortDescription}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#132A2E]/8 pt-4">
                      <div>
                        <p className="font-heading text-lg font-extrabold text-[#0F766E]">
                          {formatVnd(product.price)}
                        </p>
                        <p className="text-[11px] text-[#476268]">
                          Đơn vị: {product.retailUnit}
                        </p>
                      </div>

                      <Link
                        href={`/san-pham/${product.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF9F6] px-3.5 py-2 text-xs font-bold text-[#0F766E] transition group-hover:bg-[#0F766E] group-hover:text-white"
                      >
                        Xem chi tiết
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
