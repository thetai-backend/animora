"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ArrowRight,
  Filter,
  Eye,
  X,
  FlaskConical,
  HeartPulse,
  PawPrint,
  BookOpen,
  ThermometerSnowflake,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { formatSpecies, formatVnd } from "@/lib/format";
import { ProductZoomViewer } from "@/components/public/ProductZoomViewer";

export interface ShopProductItem {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  targetSpecies: string;
  price: number;
  retailUnit: string;
  stockQuantity: number;
  imageUrl: string;
  shortDescription: string;
  ingredients: string;
  benefits: string;
  suitableFor: string;
  usageInstructions: string;
  storageInstructions: string;
}

const SPECIES_FILTERS = [
  { key: "ALL", label: "Tất cả loài" },
  { key: "DOG", label: "Dành cho Chó" },
  { key: "CAT", label: "Dành cho Mèo" },
  { key: "BOTH", label: "Dùng chung Chó & Mèo" },
];

export function ShopGallerySection({
  products,
  clinicAddress,
  googleMapsUrl,
}: {
  products: ShopProductItem[];
  clinicAddress?: string;
  googleMapsUrl?: string;
}) {
  const [speciesFilter, setSpeciesFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [inspectProduct, setInspectProduct] = useState<ShopProductItem | null>(null);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectProduct(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section id="san-pham" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-[1380px] px-6 xl:px-8">
        {/* Tiêu đề & Cam kết chỉ tham khảo mua tại quầy (TUYỆT ĐỐI KHÔNG GIỎ HÀNG) */}
        <div className="flex items-end justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <Store className="h-3.5 w-3.5" />
              Interactive Lookbook • Sản phẩm tại quầy ANIMORA
            </span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[#132A2E] xl:text-4xl">
              Thư viện Sản phẩm Chăm sóc &amp; Dinh dưỡng
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#476268]">
              Trải nghiệm soi bao bì trực quan như <strong>&ldquo;cầm trên tay&rdquo;</strong>: đọc kỹ thành phần, công dụng, liều dùng được bác sĩ thú y kiểm duyệt trước khi đến mua trực tiếp tại quầy.
            </p>
          </div>

          <div className="glass-medical-card rounded-2xl border-[#F97316]/25 px-5 py-3.5 text-right">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#EA580C]">
              Tham khảo trực tuyến • Mua trực tiếp
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#132A2E]">
              Không bán giao hàng online — Tư vấn đúng thể trạng tại quầy
            </p>
          </div>
        </div>

        {/* Thanh Bộ lọc mượt theo Loài & Danh mục */}
        <div className="glass-medical-card mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#476268]">
              <Filter className="h-3.5 w-3.5 text-[#0F766E]" />
              Loài:
            </span>
            {SPECIES_FILTERS.map((f) => {
              const active = speciesFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSpeciesFilter(f.key)}
                  className={`relative rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
                    active ? "text-white" : "text-[#476268] hover:text-[#0F766E]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="shop-species-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#0F766E] shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-[#476268]">
              Danh mục:
            </span>
            {categories.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`relative rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
                    active ? "text-white" : "text-[#476268] hover:text-[#132A2E]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="shop-cat-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#132A2E] shadow-sm"
                    />
                  )}
                  <span className="relative z-10">
                    {cat === "ALL" ? "Tất cả danh mục" : cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lưới sản phẩm Interactive Lookbook */}
        {filteredProducts.length === 0 ? (
          <div className="glass-medical-card mt-10 rounded-3xl p-14 text-center">
            <p className="text-base font-bold text-[#132A2E]">
              Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSpeciesFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="mt-4 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white"
            >
              Xem lại toàn bộ sản phẩm
            </button>
          </div>
        ) : (
          <motion.div layout className="mt-10 grid grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const inStock = product.stockQuantity > 0;

                return (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28 }}
                    className="group relative flex flex-col rounded-[28px] border border-[#0F766E]/12 bg-white p-3.5 shadow-[0_8px_28px_-14px_rgba(19,42,46,0.1)] transition-all duration-300 hover:border-[#0F766E]/35 hover:shadow-[0_26px_54px_-18px_rgba(15,118,110,0.22)]"
                  >
                    {/* Khung ảnh nổi lên khỏi thẻ với bóng đổ mềm thực tế khi di chuột */}
                    <div
                      onClick={() => setInspectProduct(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setInspectProduct(product);
                        }
                      }}
                      className="relative h-56 cursor-pointer rounded-[22px] bg-[#FAF9F6] p-1.5"
                    >
                      <div className="h-full w-full overflow-hidden rounded-[18px] bg-white transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-[1.03] group-hover:shadow-[0_24px_38px_-12px_rgba(19,42,46,0.28)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <span className="glass-medical pointer-events-none absolute left-3.5 top-3.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold text-[#132A2E]">
                        {formatSpecies(product.targetSpecies)}
                      </span>

                      {/* Nhãn Còn hàng tại quầy gắn chấm đèn Xanh Ngọc nhấp nháy */}
                      <span
                        className={`pointer-events-none absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-md ${
                          inStock
                            ? "bg-[#132A2E]/90 text-white backdrop-blur-md"
                            : "bg-slate-700/90 text-white"
                        }`}
                      >
                        {inStock ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4BF] opacity-80" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14B8A6]" />
                            </span>
                            Còn hàng tại quầy
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            Tạm hết tại quầy
                          </>
                        )}
                      </span>

                      {/* Nút soi nhanh nổi khi hover */}
                      <span className="pointer-events-none absolute bottom-3.5 right-3.5 inline-flex translate-y-2 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-[#0F766E] opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Eye className="h-3 w-3" />
                        Soi bao bì
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between px-2 pb-1.5 pt-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#476268]">
                          <span>{product.brand}</span>
                          <span className="text-[#0F766E]">{product.category}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectProduct(product)}
                          className="mt-1.5 text-left"
                        >
                          <h3 className="line-clamp-2 font-heading text-base font-extrabold leading-snug text-[#132A2E] transition group-hover:text-[#0F766E]">
                            {product.name}
                          </h3>
                        </button>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#476268]">
                          {product.shortDescription}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#132A2E]/8 pt-3.5">
                        <div>
                          <p className="tabular-nums-strict font-heading text-lg font-extrabold text-[#0F766E]">
                            {formatVnd(product.price)}
                          </p>
                          <p className="text-[11px] text-[#476268]">
                            Đơn vị: {product.retailUnit}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectProduct(product)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#FAF9F6] px-3 py-2 text-xs font-extrabold text-[#0F766E] transition group-hover:bg-[#0F766E] group-hover:text-white"
                        >
                          Cầm xem
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* SPLIT-SCREEN INTERACTIVE LOOKBOOK MODAL ("CẦM TRÊN TAY") */}
      <AnimatePresence>
        {inspectProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A2E]/65 p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid h-[88vh] w-full max-w-[1220px] grid-cols-12 overflow-hidden rounded-[34px] border border-white/80 bg-[#FAF9F6] shadow-[0_36px_100px_-20px_rgba(19,42,46,0.5)]"
            >
              <button
                type="button"
                aria-label="Đóng cửa sổ soi sản phẩm"
                onClick={() => setInspectProduct(null)}
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#132A2E]/12 bg-white/95 text-[#132A2E] shadow-sm transition hover:bg-[#132A2E] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* CỘT TRÁI CỐ ĐỊNH: ẢNH LỚN CÓ ZOOM SOI BAO BÌ THEO CON TRỎ */}
              <div className="col-span-5 flex flex-col justify-between border-r border-[#0F766E]/10 bg-white p-7">
                <div>
                  <div className="mb-4 flex items-center justify-between text-xs">
                    <span className="rounded-lg bg-[#0F766E]/10 px-2.5 py-1 font-extrabold text-[#0F766E]">
                      {inspectProduct.category}
                    </span>
                    <span className="font-mono font-bold text-[#476268]">
                      SKU: {inspectProduct.sku}
                    </span>
                  </div>

                  <ProductZoomViewer
                    imageUrl={inspectProduct.imageUrl}
                    alt={inspectProduct.name}
                    inStock={inspectProduct.stockQuantity > 0}
                    stockQuantity={inspectProduct.stockQuantity}
                    retailUnit={inspectProduct.retailUnit}
                    heightClass="h-[380px]"
                  />
                </div>

                {/* Khối giá & Cam kết mua trực tiếp tại quầy (KHÔNG GIỎ HÀNG) */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-baseline justify-between rounded-2xl bg-[#FAF9F6] px-5 py-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#476268]">
                      Giá niêm yết tại quầy
                    </span>
                    <div className="text-right">
                      <span className="tabular-nums-strict font-heading text-2xl font-extrabold text-[#0F766E]">
                        {formatVnd(inspectProduct.price)}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-[#476268]">
                        / {inspectProduct.retailUnit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/san-pham/${inspectProduct.slug}`}
                      onClick={() => setInspectProduct(null)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#0B5D56]"
                    >
                      Mở trang chi tiết đầy đủ
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#EA580C]"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Đến quầy mua
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI CUỘN MƯỢT: 5 THẺ THÔNG TIN CHUYÊN SÂU */}
              <div
                data-lenis-prevent
                className="col-span-7 overflow-y-auto p-8 pr-10 space-y-5"
              >
                <div className="pr-10">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-lg bg-[#132A2E]/8 px-2.5 py-1 text-[#132A2E]">
                      {formatSpecies(inspectProduct.targetSpecies)}
                    </span>
                    <span className="text-[#476268]">
                      Thương hiệu:{" "}
                      <strong className="text-[#132A2E]">{inspectProduct.brand}</strong>
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-heading text-2xl font-extrabold leading-tight text-[#132A2E]">
                    {inspectProduct.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#476268]">
                    {inspectProduct.shortDescription}
                  </p>
                </div>

                {/* Thông báo chỉ bán tại quầy */}
                <div className="rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] p-4 text-xs text-[#132A2E]">
                  <p className="font-extrabold text-[#EA580C]">
                    Sản phẩm chỉ trưng bày tham khảo &amp; mua trực tiếp tại quầy ANIMORA
                  </p>
                  <p className="mt-1 leading-relaxed text-[#476268]">
                    Không hỗ trợ giỏ hàng giao tận nhà nhằm đảm bảo bác sĩ tư vấn đúng liều lượng theo thể trạng bé.
                    {clinicAddress ? ` Địa chỉ: ${clinicAddress}.` : ""}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#0F766E]/12 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#132A2E]">
                      <FlaskConical className="h-4 w-4 text-[#0F766E]" />
                      Thành phần chi tiết
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                      {inspectProduct.ingredients}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0F766E]/12 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#132A2E]">
                      <HeartPulse className="h-4 w-4 text-[#F97316]" />
                      Công dụng nổi bật
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                      {inspectProduct.benefits}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0F766E]/12 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#132A2E]">
                      <PawPrint className="h-4 w-4 text-[#0F766E]" />
                      Đối tượng phù hợp
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                      {inspectProduct.suitableFor}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0F766E]/12 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#132A2E]">
                      <BookOpen className="h-4 w-4 text-[#0F766E]" />
                      Hướng dẫn sử dụng
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                      {inspectProduct.usageInstructions}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0F766E]/12 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#132A2E]">
                      <ThermometerSnowflake className="h-4 w-4 text-[#0F766E]" />
                      Hướng dẫn bảo quản
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                      {inspectProduct.storageInstructions}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
