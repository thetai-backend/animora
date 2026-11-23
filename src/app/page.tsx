import React from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StickyHeader } from "@/components/StickyHeader";
import { PublicSmoothScroll } from "@/components/public/PublicSmoothScroll";
import { AnimoraPreloader } from "@/components/public/AnimoraPreloader";
import { HeroSection } from "@/components/landing/HeroSection";
import { PromotionsSection } from "@/components/landing/PromotionsSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { ShopGallerySection } from "@/components/landing/ShopGallerySection";
import { DoctorsSection } from "@/components/landing/DoctorsSection";
import { MapFooterSection } from "@/components/landing/MapFooterSection";

export const dynamic = "force-dynamic";

function summarizeDoctorShifts(
  schedules: { dayOfWeek: number; morningShift: boolean; afternoonShift: boolean }[]
): string {
  if (!schedules || schedules.length === 0) {
    return "Trực xoay ca 07:00 – 20:00";
  }
  const activeDays = schedules.filter((s) => s.morningShift || s.afternoonShift);
  if (activeDays.length === 0) return "Trực theo lịch phòng khám";
  const hasMorning = activeDays.some((s) => s.morningShift);
  const hasAfternoon = activeDays.some((s) => s.afternoonShift);
  const shiftLabel =
    hasMorning && hasAfternoon
      ? "Ca Sáng & Chiều"
      : hasMorning
      ? "Ca Sáng (07:00–13:30)"
      : "Ca Chiều (13:30–20:00)";
  return `${activeDays.length} ngày/tuần • ${shiftLabel}`;
}

export default async function HomePage() {
  const now = new Date();

  const [session, settings, promotions, services, products, doctors] =
    await Promise.all([
      getSession(),
      prisma.clinicSettings.findUnique({ where: { id: "default" } }),
      prisma.promotion.findMany({
        where: {
          isActive: true,
          showOnLanding: true,
          endDate: { gt: now },
        },
        orderBy: { endDate: "asc" },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          isFeaturedOnWeb: true,
          group: { in: ["SHOP", "SHARED"] },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findMany({
        where: {
          role: "DOCTOR",
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          title: true,
          specialty: true,
          experienceYears: true,
          bio: true,
          workSchedules: {
            select: {
              dayOfWeek: true,
              morningShift: true,
              afternoonShift: true,
            },
          },
        },
        orderBy: { experienceYears: "desc" },
      }),
    ]);

  const clinic = settings ?? {
    clinicName: "Phòng khám Thú y ANIMORA",
    tagline: "Chăm sóc bằng chuẩn y khoa — Yêu thương như người nhà",
    heroTitle: "Y khoa thú nhỏ chuẩn mực trong không gian ấm áp",
    heroSubtitle:
      "Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, bảng giá niêm yết minh bạch và quy trình chăm sóc nhẹ nhàng dành riêng cho chó mèo.",
    address: "128 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    phone: "028 3890 2468",
    email: "cskh@animora.vn",
    openTime: "07:00",
    closeTime: "20:00",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=128+Nguyen+Thi+Minh+Khai,+Quan+3,+Ho+Chi+Minh",
    googleMapsEmbedUrl:
      "https://maps.google.com/maps?q=128%20Nguyen%20Thi%20Minh%20Khai%2C%20Quan%203%2C%20Ho%20Chi+Minh&t=&z=16&ie=UTF8&iwloc=&output=embed",
  };

  return (
    <PublicSmoothScroll>
      <AnimoraPreloader />

      <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
        <StickyHeader
          session={session}
          clinicPhone={clinic.phone}
          enablePreloaderReplay
        />

        <main>
          <HeroSection
            clinicName={clinic.clinicName}
            tagline={clinic.tagline}
            heroTitle={clinic.heroTitle}
            heroSubtitle={clinic.heroSubtitle}
            address={clinic.address}
            phone={clinic.phone}
            openTime={clinic.openTime}
            closeTime={clinic.closeTime}
            doctorCount={doctors.length}
            serviceCount={services.length}
          />

          <PromotionsSection
            promotions={promotions.map((p) => ({
              ...p,
              endDate: p.endDate.toISOString(),
            }))}
          />

          <ServicesSection services={services} />

          <ShopGallerySection
            products={products}
            clinicAddress={clinic.address}
            googleMapsUrl={clinic.googleMapsUrl}
          />

          <DoctorsSection
            doctors={doctors.map((d) => ({
              id: d.id,
              fullName: d.fullName,
              avatarUrl: d.avatarUrl,
              title: d.title,
              specialty: d.specialty,
              experienceYears: d.experienceYears,
              bio: d.bio,
              shiftSummary: summarizeDoctorShifts(d.workSchedules),
            }))}
          />

          <MapFooterSection
            clinicName={clinic.clinicName}
            address={clinic.address}
            phone={clinic.phone}
            email={clinic.email}
            openTime={clinic.openTime}
            closeTime={clinic.closeTime}
            googleMapsUrl={clinic.googleMapsUrl}
            googleMapsEmbedUrl={clinic.googleMapsEmbedUrl}
          />
        </main>
      </div>
    </PublicSmoothScroll>
  );
}
