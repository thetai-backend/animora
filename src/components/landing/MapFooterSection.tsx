import React from "react";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  Navigation,
} from "lucide-react";
import Link from "next/link";

interface MapFooterProps {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
}

export function MapFooterSection({
  clinicName,
  address,
  phone,
  email,
  openTime,
  closeTime,
  googleMapsUrl,
  googleMapsEmbedUrl,
}: MapFooterProps) {
  return (
    <>
      {/* Khu vực Bản đồ & Chỉ đường Google Maps */}
      <section id="ban-do" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-[1380px] px-8">
          <div className="grid grid-cols-12 items-stretch gap-8 overflow-hidden rounded-[32px] border border-[#0F766E]/15 bg-white shadow-xl shadow-[#0F766E]/8">
            {/* Thông tin liên hệ */}
            <div className="col-span-5 flex flex-col justify-between bg-[#132A2E] p-10 text-white">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <MapPin className="h-3.5 w-3.5" />
                  Định vị phòng khám
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight">
                  Ghé thăm {clinicName}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Vị trí mặt tiền trung tâm Quận 3, có chỗ đỗ xe rộng rãi và khu vực chờ tách biệt cho chó và mèo giúp các bé luôn thoải mái.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#5EEAD4]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Địa chỉ duy nhất
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-white">
                        {address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FDBA74]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Giờ mở cửa hàng ngày
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {openTime} – {closeTime} (Thứ 2 đến Chủ Nhật)
                      </p>
                      <p className="text-xs text-white/70">
                        2 ca bác sĩ trực liên tục: 07:00–13:30 & 13:30–20:00
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#5EEAD4]">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Hotline tiếp nhận & Cấp cứu
                      </p>
                      <p className="mt-0.5 text-base font-extrabold text-white">
                        {phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#5EEAD4]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Email chăm sóc khách hàng
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#F97316] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#F97316]/30 transition hover:bg-[#EA580C]"
                >
                  <Navigation className="h-4 w-4" />
                  Mở chỉ đường trực tiếp trên Google Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Khung nhúng Google Maps trực quan */}
            <div className="relative col-span-7 min-h-[460px] bg-[#E9F1EF]">
              <iframe
                title="Bản đồ Phòng khám Thú y ANIMORA"
                src={googleMapsEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Chân trang */}
      <footer className="border-t border-[#0F766E]/12 bg-[#FAF9F6] py-10">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-8 text-sm text-[#476268]">
          <div>
            <p className="font-heading text-lg font-extrabold tracking-widest text-[#0F766E]">
              ANIMORA
            </p>
            <p className="mt-1 text-xs">
              © {new Date().getFullYear()} {clinicName}. Hệ thống quản lý & chăm sóc thú y chuẩn y khoa.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/#dich-vu" className="hover:text-[#0F766E]">
              Bảng giá dịch vụ
            </Link>
            <Link href="/#san-pham" className="hover:text-[#0F766E]">
              Sản phẩm tại Shop
            </Link>
            <Link href="/#bac-si" className="hover:text-[#0F766E]">
              Đội ngũ Bác sĩ
            </Link>
            <Link href="/dang-nhap" className="hover:text-[#0F766E]">
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
