import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/booking-utils";

interface PosItemInput {
  itemType: "SERVICE" | "MEDICINE" | "SHOP_PRODUCT";
  serviceId?: string;
  productId?: string;
  quantity: number;
  dosageInstruction?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["DOCTOR", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền gửi phiếu thanh toán" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      pet: true,
      customer: true,
      invoice: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy bệnh án" }, { status: 404 });
  }
  if (record.status === "LOCKED") {
    return NextResponse.json({ error: "Bệnh án đã thanh toán và khóa cứng" }, { status: 423 });
  }

  const body = await request.json();

  // Lưu đồng thời nội dung S.O.A.P mới nhất
  await prisma.medicalRecord.update({
    where: { id },
    data: {
      subjective: body.subjective !== undefined ? String(body.subjective) : record.subjective,
      objective: body.objective !== undefined ? String(body.objective) : record.objective,
      weightKg: body.weightKg !== undefined ? String(body.weightKg || "") : record.weightKg,
      temperatureC:
        body.temperatureC !== undefined ? String(body.temperatureC || "") : record.temperatureC,
      heartRate: body.heartRate !== undefined ? String(body.heartRate || "") : record.heartRate,
      respiratoryRate:
        body.respiratoryRate !== undefined
          ? String(body.respiratoryRate || "")
          : record.respiratoryRate,
      assessment: body.assessment !== undefined ? String(body.assessment) : record.assessment,
      plan: body.plan !== undefined ? String(body.plan) : record.plan,
      followUpDate:
        body.followUpDate !== undefined
          ? body.followUpDate
            ? new Date(body.followUpDate)
            : null
          : record.followUpDate,
      followUpNote:
        body.followUpNote !== undefined
          ? body.followUpNote
            ? String(body.followUpNote)
            : null
          : record.followUpNote,
      status: "SENT_TO_POS",
    },
  });

  const itemsInput: PosItemInput[] = Array.isArray(body.items) ? body.items : [];
  if (itemsInput.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn ít nhất 1 dịch vụ hoặc thuốc trước khi gửi Lễ tân" },
      { status: 400 }
    );
  }

  const resolvedItems: {
    itemType: string;
    serviceId: string | null;
    productId: string | null;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    dosageInstruction: string | null;
    addedByRole: string;
  }[] = [];

  for (const item of itemsInput) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (item.itemType === "SERVICE" && item.serviceId) {
      const srv = await prisma.service.findUnique({ where: { id: item.serviceId } });
      if (!srv) continue;
      resolvedItems.push({
        itemType: "SERVICE",
        serviceId: srv.id,
        productId: null,
        name: srv.name,
        category: srv.category,
        unit: "Lần",
        quantity: qty,
        unitPrice: srv.price,
        totalPrice: srv.price * qty,
        dosageInstruction: null,
        addedByRole: "DOCTOR",
      });
    } else if (item.productId) {
      const prod = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!prod) continue;
      resolvedItems.push({
        itemType: prod.group === "SHOP" ? "SHOP_PRODUCT" : "MEDICINE",
        serviceId: null,
        productId: prod.id,
        name: prod.name,
        category: prod.group === "SHOP" ? "SHOP" : "MEDICINE",
        unit: prod.retailUnit,
        quantity: qty,
        unitPrice: prod.price,
        totalPrice: prod.price * qty,
        dosageInstruction: item.dosageInstruction ? String(item.dosageInstruction).trim() : null,
        addedByRole: "DOCTOR",
      });
    }
  }

  const subtotal = resolvedItems.reduce((s, i) => s + i.totalPrice, 0);
  const petSummary = record.pet
    ? `${record.pet.name} (${record.pet.species === "DOG" ? "Chó" : record.pet.species === "CAT" ? "Mèo" : "Khác"}${record.pet.breed ? ` - ${record.pet.breed}` : ""})`
    : `${record.guestPetName || "Thú cưng"} (${record.guestPetSpecies === "CAT" ? "Mèo" : "Chó"})`;

  let invoice;
  if (record.invoice && record.invoice.status === "PENDING") {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: record.invoice.id } });
    invoice = await prisma.invoice.update({
      where: { id: record.invoice.id },
      data: {
        subtotal,
        totalAmount: subtotal,
        eventDiscountAmount: 0,
        couponDiscountAmount: 0,
        items: { create: resolvedItems },
      },
      include: { items: true },
    });
  } else {
    invoice = await prisma.invoice.create({
      data: {
        invoiceCode: generateShortCode("HD"),
        type: "CLINIC",
        bookingId: record.bookingId,
        medicalRecordId: record.id,
        customerId: record.customerId,
        guestName: record.guestOwnerName,
        guestPhone: record.guestOwnerPhone,
        petSummary,
        doctorId: record.doctorId,
        subtotal,
        totalAmount: subtotal,
        status: "PENDING",
        items: { create: resolvedItems },
      },
      include: { items: true },
    });
  }

  // Đưa trạng thái bác sĩ về lại Đang trống (AVAILABLE) & hoàn tất booking
  await prisma.user.update({
    where: { id: record.doctorId },
    data: { workStatus: "AVAILABLE" },
  });

  if (record.bookingId) {
    await prisma.booking.update({
      where: { id: record.bookingId },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({
    invoice,
    message: `Đã gửi phiếu hóa đơn ${invoice.invoiceCode} ra quầy Lễ tân và chuyển trạng thái Bác sĩ về Đang trống.`,
  });
}
