import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyVi } from "@/lib/format";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền thêm mặt hàng mới" }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const group = ["MEDICINE", "SHOP", "SHARED", "SUPPLY"].includes(String(body.group))
    ? String(body.group)
    : "SHOP";
  const brand = String(body.brand || "ANIMORA Clinic").trim();
  const category = String(
    body.category ||
      (group === "MEDICINE"
        ? "Thuốc kê đơn"
        : group === "SUPPLY"
        ? "Vật tư tiêu hao"
        : group === "SHARED"
        ? "Hàng dùng chung"
        : "Thức ăn & Chăm sóc")
  ).trim();
  const targetSpecies = ["DOG", "CAT", "BOTH"].includes(String(body.targetSpecies))
    ? String(body.targetSpecies)
    : "BOTH";
  const importUnit = String(body.importUnit || "Hộp").trim();
  const retailUnit = String(body.retailUnit || "Viên").trim();
  const conversionRate = Math.max(1, Number(body.conversionRate) || 1);
  const price = Math.max(0, Number(body.price) || 0);

  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên mặt hàng" }, { status: 400 });
  }

  const rawSku = String(body.sku || "").trim().toUpperCase();
  const prefix =
    group === "MEDICINE" ? "TH" : group === "SUPPLY" ? "VT" : group === "SHARED" ? "DC" : "SP";
  const sku = rawSku || `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) {
    return NextResponse.json({ error: `Mã SKU "${sku}" đã tồn tại trong kho` }, { status: 409 });
  }

  const baseSlug = slugifyVi(name) || `san-pham-${Date.now()}`;
  const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } });
  const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const product = await prisma.product.create({
    data: {
      slug,
      sku,
      name,
      brand,
      group,
      category,
      targetSpecies,
      price,
      importUnit,
      retailUnit,
      conversionRate,
      stockQuantity: 0,
      imageUrl: String(body.imageUrl || "/images/product-care.jpg").trim(),
      shortDescription: String(body.shortDescription || `Sản phẩm ${name} tại Phòng khám Thú y ANIMORA.`).trim(),
      ingredients: String(body.ingredients || "Xem chi tiết trên bao bì sản phẩm chính hãng.").trim(),
      benefits: String(body.benefits || "Hỗ trợ chăm sóc và bảo vệ sức khỏe thú cưng chuẩn y khoa.").trim(),
      suitableFor: String(body.suitableFor || "Chó và mèo theo tư vấn của bác sĩ thú y.").trim(),
      usageInstructions: String(body.usageInstructions || "Sử dụng theo hướng dẫn trên bao bì hoặc chỉ định bác sĩ.").trim(),
      storageInstructions: String(body.storageInstructions || "Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.").trim(),
      isFeaturedOnWeb:
        body.isFeaturedOnWeb !== undefined
          ? Boolean(body.isFeaturedOnWeb)
          : group === "SHOP" || group === "SHARED",
      isActive: true,
    },
  });

  revalidatePath("/");
  revalidatePath(`/san-pham/${product.slug}`);

  return NextResponse.json(
    {
      product,
      message: `Đã thêm mặt hàng "${product.name}" (SKU: ${product.sku}, 1 ${importUnit} = ${conversionRate} ${retailUnit}).`,
    },
    { status: 201 }
  );
}
