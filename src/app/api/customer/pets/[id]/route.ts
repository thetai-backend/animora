import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.pet.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ thú cưng" }, { status: 404 });
  }
  if (existing.ownerId !== session.userId && session.role !== "MANAGER") {
    return NextResponse.json({ error: "Không có quyền chỉnh sửa hồ sơ này" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await prisma.pet.update({
    where: { id },
    data: {
      name: body.name ? String(body.name).trim() : existing.name,
      species: body.species ? String(body.species).toUpperCase() : existing.species,
      breed: body.breed !== undefined ? (body.breed ? String(body.breed).trim() : null) : existing.breed,
      birthDate:
        body.birthDate !== undefined
          ? body.birthDate
            ? new Date(body.birthDate)
            : null
          : existing.birthDate,
      gender: body.gender !== undefined ? body.gender || null : existing.gender,
      isNeutered: body.isNeutered !== undefined ? Boolean(body.isNeutered) : existing.isNeutered,
      coatDescription:
        body.coatDescription !== undefined
          ? body.coatDescription
            ? String(body.coatDescription).trim()
            : null
          : existing.coatDescription,
      microchipCode:
        body.microchipCode !== undefined
          ? body.microchipCode
            ? String(body.microchipCode).trim()
            : null
          : existing.microchipCode,
      allergies:
        body.allergies !== undefined
          ? body.allergies
            ? String(body.allergies).trim()
            : null
          : existing.allergies,
      vaccinationHistory:
        body.vaccinationHistory !== undefined
          ? body.vaccinationHistory
            ? String(body.vaccinationHistory).trim()
            : null
          : existing.vaccinationHistory,
      dewormingHistory:
        body.dewormingHistory !== undefined
          ? body.dewormingHistory
            ? String(body.dewormingHistory).trim()
            : null
          : existing.dewormingHistory,
      status: body.status === "DECEASED" ? "DECEASED" : body.status === "ALIVE" ? "ALIVE" : existing.status,
    },
  });

  return NextResponse.json({ pet: updated });
}
