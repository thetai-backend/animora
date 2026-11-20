import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền cấu hình CMS" }, { status: 403 });
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền lưu cài đặt CMS" }, { status: 403 });
  }

  const body = await request.json();
  const existing = await prisma.clinicSettings.findUnique({ where: { id: "default" } });

  const data = {
    clinicName: String(body.clinicName || existing?.clinicName || "Phòng khám Thú y ANIMORA").trim(),
    tagline: String(body.tagline || existing?.tagline || "").trim(),
    heroTitle: String(body.heroTitle || existing?.heroTitle || "").trim(),
    heroSubtitle: String(body.heroSubtitle || existing?.heroSubtitle || "").trim(),
    address: String(body.address || existing?.address || "").trim(),
    phone: String(body.phone || existing?.phone || "").trim(),
    email: String(body.email || existing?.email || "").trim(),
    openTime: String(body.openTime || existing?.openTime || "07:00").trim(),
    closeTime: String(body.closeTime || existing?.closeTime || "20:00").trim(),
    googleMapsUrl: String(body.googleMapsUrl || existing?.googleMapsUrl || "").trim(),
    googleMapsEmbedUrl: String(body.googleMapsEmbedUrl || existing?.googleMapsEmbedUrl || "").trim(),
    latitude:
      body.latitude !== undefined && body.latitude !== ""
        ? Number(body.latitude)
        : existing?.latitude ?? null,
    longitude:
      body.longitude !== undefined && body.longitude !== ""
        ? Number(body.longitude)
        : existing?.longitude ?? null,
    bankCode: String(body.bankCode || existing?.bankCode || "MB").trim().toUpperCase(),
    bankAccountNumber: String(body.bankAccountNumber || existing?.bankAccountNumber || "").trim(),
    bankAccountName: String(body.bankAccountName || existing?.bankAccountName || "").trim().toUpperCase(),
  };

  const settings = await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json({
    settings,
    message: "Đã lưu Thông tin Phòng khám, Google Maps & Tài khoản VietQR! Trang chủ đã đồng bộ tức thì.",
  });
}
