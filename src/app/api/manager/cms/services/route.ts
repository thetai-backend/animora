import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyVi } from "@/lib/format";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền quản lý dịch vụ" }, { status: 403 });
  }

  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền thêm dịch vụ" }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const category = body.category === "SPA" ? "SPA" : "MEDICAL";
  const price = Math.max(0, Number(body.price) || 0);
  const durationMinutes = Math.max(15, Number(body.durationMinutes) || 30);
  const shortDescription = String(body.shortDescription || "").trim();
  const processSteps = String(body.processSteps || "").trim();

  if (!name || !shortDescription) {
    return NextResponse.json(
      { error: "Vui lòng nhập Tên dịch vụ và Mô tả ngắn" },
      { status: 400 }
    );
  }

  const baseSlug = slugifyVi(name) || `dich-vu-${Date.now()}`;
  const existing = await prisma.service.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const maxOrder = await prisma.service.aggregate({ _max: { sortOrder: true } });

  const service = await prisma.service.create({
    data: {
      slug,
      name,
      category,
      price,
      durationMinutes,
      shortDescription,
      processSteps: processSteps || "Tiếp nhận thú cưng và kiểm tra thể trạng\nThực hiện dịch vụ chuẩn y khoa ANIMORA",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      sortOrder: Number(body.sortOrder) || (maxOrder._max.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json(
    {
      service,
      message: `Đã thêm dịch vụ "${service.name}" vào Bảng giá cố định!`,
    },
    { status: 201 }
  );
}
