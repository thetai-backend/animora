import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Navigation,
  FlaskConical,
  HeartPulse,
  PawPrint,
  BookOpen,
  ThermometerSnowflake,
  PhoneCall,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StickyHeader } from "@/components/StickyHeader";
import { PublicSmoothScroll } from "@/components/public/PublicSmoothScroll";
import { ProductZoomViewer } from "@/components/public/ProductZoomViewer";
import { MagneticButton } from "@/components/public/MagneticButton";
import { formatSpecies, formatVnd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [session, product, settings] = await Promise.all([
    getSession(),
    prisma.product.findUnique({ where: { slug } }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!product || !product.isActive) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeaturedOnWeb: true,
      group: { in: ["SHOP", "SHARED"] },
      id: { not: product.id },
    },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  const clinicPhone = settings?.phone ?? "028 3890 2468";
  const clinicAddress =
    settings?.address ??
    "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh";
  const googleMapsUrl =
    settings?.googleMapsUrl ??
    "https://www.google.com/maps/search/?api=1&query=128+Nguyen+Thi+Minh+Khai,+Quan+3,+Ho+Chi+Minh";

  const inStock = product.stockQuantity > 0;

  return (
    <PublicSmoothScroll>
      <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
        <StickyHeader session={session} clinicPhone={clinicPhone} />

        <main className="mx-auto max-w-[1380px] px-6 py-10 xl:px-8">
          {/* Đường dẫn quay lại */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/#san-pham"
              className="glass-medical inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[#0F766E] transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại Thư viện Sản phẩm
            </Link>

            <span className="rounded-xl border border-[#0F766E]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#476268]">
              Mã sản phẩm (SKU):{" "}
              <strong className="font-mono text-[#132A2E]">{product.sku}</strong>
            </span>
          </div>

          {/* SPLIT-SCREEN LOOKBOOK: TRÁI CỐ ĐỊNH ẢNH ZOOM BAO BÌ | PHẢI CUỘN MƯỢT 5 THẺ Y KHOA */}
          <div className="grid grid-cols-12 items-start gap-10">
            {/* CỘT TRÁI CỐ ĐỊNH (STICKY): ẢNH LỚN CÓ TƯƠNG TÁC ZOOM SOI BAO BÌ */}
            <div className="sticky top-28 col-span-5 space-y-5">
              <div className="glass-medical-card rounded-[32px] p-5">
                <ProductZoomViewer
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  inStock={inStock}
                  stockQuantity={product.stockQuantity}
                  retailUnit={product.retailUnit}
                  heightClass="h-[460px]"
                />

                {/* Khối giá niêm yết & Nút đến quầy (Rule 2: tuyệt đối KHÔNG giỏ hàng online) */}
                <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-[#FAF9F6] px-5 py-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#476268]">
                    Giá niêm yết tại quầy
                  </span>
                  <div className="text-right">
                    <span className="tabular-nums-strict font-heading text-3xl font-extrabold text-[#0F766E]">
                      {formatVnd(product.price)}
                    </span>
                    <span className="ml-1.5 text-xs font-semibold text-[#476268]">
                      / {product.retailUnit}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <MagneticButton className="flex-1" strength={0.2}>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-[#0F766E]/25 transition hover:bg-[#0B5D56]"
                    >
                      <Navigation className="h-4 w-4" />
                      Chỉ đường đến quầy
                    </a>
                  </MagneticButton>
                  <a
                    href={`tel:${clinicPhone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/25 bg-white px-4 py-3.5 text-sm font-bold text-[#0F766E] transition hover:bg-[#0F766E]/5"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span className="tabular-nums-strict">{clinicPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI CUỘN MƯỢT: TỔNG QUAN + 5 THẺ THÔNG TIN CHUYÊN SÂU */}
            <div className="col-span-7 space-y-6">
              <div className="tactile-surface rounded-[32px] p-8">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-lg bg-[#0F766E]/10 px-3 py-1 text-xs font-extrabold text-[#0F766E]">
                    {product.category}
                  </span>
                  <span className="rounded-lg bg-[#132A2E]/8 px-3 py-1 text-xs font-bold text-[#132A2E]">
                    Đối tượng: {formatSpecies(product.targetSpecies)}
                  </span>
                  <span className="text-xs font-semibold text-[#476268]">
                    Thương hiệu:{" "}
                    <strong className="text-[#132A2E]">{product.brand}</strong>
                  </span>
                </div>

                <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-[#132A2E] xl:text-4xl">
                  {product.name}
                </h1>

                <p className="mt-4 text-base leading-relaxed text-[#476268]">
                  {product.shortDescription}
                </p>

                {/* Khung thông báo chỉ bán tại quầy (Rule 2) */}
                <div className="mt-6 rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#132A2E]">
                        Sản phẩm chỉ bán trực tiếp tại quầy Phòng khám ANIMORA
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#476268]">
                        Nhằm đảm bảo bác sĩ tư vấn đúng liều lượng theo thể trạng thú cưng, ANIMORA không hỗ trợ giỏ hàng giao hàng online. Bạn có thể mua trực tiếp tại quầy Lễ tân hoặc gộp chung vào hóa đơn khi đưa bé đến khám.
                      </p>
                      <p className="mt-2 text-xs font-bold text-[#132A2E]">
                        Địa chỉ: {clinicAddress} • 07:00 – 20:00 (Mở cửa xuyên trưa)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Mục Mô tả Chuyên sâu chuẩn Y khoa */}
              <div className="tactile-surface rounded-[28px] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-extrabold text-[#132A2E]">
                    Thành phần chi tiết
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                  {product.ingredients}
                </p>
              </div>

              <div className="tactile-surface rounded-[28px] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/12 text-[#F97316]">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-extrabold text-[#132A2E]">
                    Công dụng nổi bật
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                  {product.benefits}
                </p>
              </div>

              <div className="tactile-surface rounded-[28px] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                    <PawPrint className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-extrabold text-[#132A2E]">
                    Đối tượng phù hợp
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                  {product.suitableFor}
                </p>
              </div>

              <div className="tactile-surface rounded-[28px] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-extrabold text-[#132A2E]">
                    Hướng dẫn sử dụng
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                  {product.usageInstructions}
                </p>
              </div>

              <div className="tactile-surface rounded-[28px] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                    <ThermometerSnowflake className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-extrabold text-[#132A2E]">
                    Hướng dẫn bảo quản
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
                  {product.storageInstructions}
                </p>
              </div>
            </div>
          </div>

          {/* Sản phẩm khác tại quầy */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-[#0F766E]/10 pt-12">
              <h2 className="font-heading text-2xl font-extrabold text-[#132A2E]">
                Sản phẩm tham khảo khác tại quầy
              </h2>
              <div className="mt-6 grid grid-cols-4 gap-6">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/san-pham/${item.slug}`}
                    className="group overflow-hidden rounded-[26px] border border-[#0F766E]/12 bg-white p-3 transition hover:-translate-y-1 hover:border-[#0F766E]/35 hover:shadow-xl"
                  >
                    <div className="h-44 overflow-hidden rounded-2xl bg-[#FAF9F6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#0F766E]">
                        {item.brand}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-extrabold text-[#132A2E] group-hover:text-[#0F766E]">
                        {item.name}
                      </h3>
                      <p className="tabular-nums-strict mt-2.5 font-heading text-base font-extrabold text-[#0F766E]">
                        {formatVnd(item.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </PublicSmoothScroll>
  );
}
