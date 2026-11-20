import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
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
      group: "SHOP",
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
      <StickyHeader session={session} clinicPhone={clinicPhone} />

      <main className="mx-auto max-w-[1380px] px-8 py-12">
        {/* Đường dẫn quay lại */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/#san-pham"
            className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0F766E] transition hover:bg-[#0F766E]/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Thư viện Sản phẩm
          </Link>

          <span className="text-xs font-medium text-[#476268]">
            Mã sản phẩm (SKU): <strong className="text-[#132A2E]">{product.sku}</strong>
          </span>
        </div>

        {/* Khối tổng quan sản phẩm */}
        <div className="grid grid-cols-12 gap-10 rounded-[32px] border border-[#0F766E]/12 bg-white p-10 shadow-xl shadow-[#0F766E]/6">
          {/* Ảnh sản phẩm */}
          <div className="col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-[#0F766E]/10 bg-[#FAF9F6]">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-[440px] w-full object-cover"
              />
              <span
                className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-md ${
                  inStock
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-700 text-white"
                }`}
              >
                {inStock ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Còn hàng tại quầy ({product.stockQuantity} {product.retailUnit})
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Tạm hết hàng tại quầy
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Thông tin chính & Lưu ý mua tại quầy */}
          <div className="col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-[#0F766E]/10 px-3 py-1 text-xs font-bold text-[#0F766E]">
                  {product.category}
                </span>
                <span className="rounded-lg bg-[#132A2E]/8 px-3 py-1 text-xs font-bold text-[#132A2E]">
                  Đối tượng: {formatSpecies(product.targetSpecies)}
                </span>
                <span className="text-xs font-semibold text-[#476268]">
                  Thương hiệu: <strong className="text-[#132A2E]">{product.brand}</strong>
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#132A2E]">
                {product.name}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#476268]">
                {product.shortDescription}
              </p>

              <div className="mt-6 flex items-baseline gap-3 rounded-2xl border border-[#0F766E]/12 bg-[#FAF9F6] px-6 py-5">
                <span className="font-heading text-4xl font-extrabold text-[#0F766E]">
                  {formatVnd(product.price)}
                </span>
                <span className="text-sm font-semibold text-[#476268]">
                  / {product.retailUnit} (Giá niêm yết tại quầy)
                </span>
              </div>
            </div>

            {/* Khung thông báo chỉ mua tại quầy (Rule 2: tuyệt đối không có giỏ hàng online) */}
            <div className="mt-7 rounded-2xl border border-[#F97316]/30 bg-[#F97316]/8 p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-extrabold text-[#132A2E]">
                    Sản phẩm chỉ bán trực tiếp tại quầy Phòng khám ANIMORA
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#476268]">
                    Nhằm đảm bảo tư vấn đúng liều lượng theo thể trạng thú cưng, ANIMORA không hỗ trợ giỏ hàng hay đặt giao tận nhà. Bạn có thể ghé trực tiếp quầy Lễ tân hoặc gộp chung vào hóa đơn khi đưa bé đến khám.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#132A2E]">
                    Địa chỉ: {clinicAddress} • Mở cửa 07:00 – 20:00
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B5D56]"
                >
                  <Navigation className="h-4 w-4" />
                  Mở chỉ đường Google Maps đến quầy
                </a>
                <a
                  href={`tel:${clinicPhone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/25 bg-white px-5 py-3 text-sm font-bold text-[#0F766E] transition hover:bg-[#0F766E]/5"
                >
                  <PhoneCall className="h-4 w-4" />
                  Gọi kiểm tra hàng: {clinicPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Mục Mô tả Chuyên sâu chuẩn Y khoa */}
        <div className="mt-10 grid grid-cols-12 gap-6">
          <div className="col-span-6 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                <FlaskConical className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                Thành phần chi tiết
              </h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
              {product.ingredients}
            </p>
          </div>

          <div className="col-span-6 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/12 text-[#F97316]">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#132A2E]">
                Công dụng nổi bật
              </h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
              {product.benefits}
            </p>
          </div>

          <div className="col-span-4 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                <PawPrint className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Đối tượng phù hợp
              </h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
              {product.suitableFor}
            </p>
          </div>

          <div className="col-span-4 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Hướng dẫn sử dụng
              </h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
              {product.usageInstructions}
            </p>
          </div>

          <div className="col-span-4 rounded-3xl border border-[#0F766E]/12 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                <ThermometerSnowflake className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-[#132A2E]">
                Hướng dẫn bảo quản
              </h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#476268]">
              {product.storageInstructions}
            </p>
          </div>
        </div>

        {/* Sản phẩm khác tại quầy */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold text-[#132A2E]">
              Sản phẩm tham khảo khác tại quầy
            </h2>
            <div className="mt-6 grid grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/san-pham/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-[#0F766E]/12 bg-white transition hover:-translate-y-1 hover:border-[#0F766E]/35 hover:shadow-lg"
                >
                  <div className="h-44 overflow-hidden bg-[#FAF9F6]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-[#0F766E]">
                      {item.brand}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-extrabold text-[#132A2E] group-hover:text-[#0F766E]">
                      {item.name}
                    </h3>
                    <p className="mt-3 font-heading text-base font-extrabold text-[#0F766E]">
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
  );
}
