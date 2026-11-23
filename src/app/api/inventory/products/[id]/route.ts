import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền sửa thông tin mặt hàng" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy mặt hàng" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      brand: body.brand !== undefined ? String(body.brand).trim() : existing.brand,
      group:
        body.group && ["MEDICINE", "SHOP", "SHARED", "SUPPLY"].includes(String(body.group))
          ? String(body.group)
          : existing.group,
      category: body.category !== undefined ? String(body.category).trim() : existing.category,
      targetSpecies:
        body.targetSpecies && ["DOG", "CAT", "BOTH"].includes(String(body.targetSpecies))
          ? String(body.targetSpecies)
          : existing.targetSpecies,
      price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : existing.price,
      importUnit:
        body.importUnit !== undefined ? String(body.importUnit).trim() : existing.importUnit,
      retailUnit:
        body.retailUnit !== undefined ? String(body.retailUnit).trim() : existing.retailUnit,
      conversionRate:
        body.conversionRate !== undefined
          ? Math.max(1, Number(body.conversionRate) || 1)
          : existing.conversionRate,
      imageUrl: body.imageUrl !== undefined ? String(body.imageUrl).trim() : existing.imageUrl,
      shortDescription:
        body.shortDescription !== undefined
          ? String(body.shortDescription).trim()
          : existing.shortDescription,
      ingredients:
        body.ingredients !== undefined ? String(body.ingredients).trim() : existing.ingredients,
      benefits: body.benefits !== undefined ? String(body.benefits).trim() : existing.benefits,
      suitableFor:
        body.suitableFor !== undefined ? String(body.suitableFor).trim() : existing.suitableFor,
      usageInstructions:
        body.usageInstructions !== undefined
          ? String(body.usageInstructions).trim()
          : existing.usageInstructions,
      storageInstructions:
        body.storageInstructions !== undefined
          ? String(body.storageInstructions).trim()
          : existing.storageInstructions,
      isFeaturedOnWeb:
        body.isFeaturedOnWeb !== undefined
          ? Boolean(body.isFeaturedOnWeb)
          : existing.isFeaturedOnWeb,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    },
  });

  revalidatePath("/");
  revalidatePath(`/san-pham/${updated.slug}`);

  return NextResponse.json({
    product: updated,
    message: `Đã cập nhật mặt hàng "${updated.name}" thành công!`,
  });
}
