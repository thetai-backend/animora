import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pets });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const species = String(body.species || "DOG").toUpperCase();

  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên thú cưng" }, { status: 400 });
  }

  const pet = await prisma.pet.create({
    data: {
      ownerId: session.userId,
      name,
      species: ["DOG", "CAT", "OTHER"].includes(species) ? species : "DOG",
      breed: body.breed ? String(body.breed).trim() : null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender === "MALE" || body.gender === "FEMALE" ? body.gender : null,
      isNeutered: Boolean(body.isNeutered),
      coatDescription: body.coatDescription ? String(body.coatDescription).trim() : null,
      microchipCode: body.microchipCode ? String(body.microchipCode).trim() : null,
      allergies: body.allergies ? String(body.allergies).trim() : null,
      vaccinationHistory: body.vaccinationHistory ? String(body.vaccinationHistory).trim() : null,
      dewormingHistory: body.dewormingHistory ? String(body.dewormingHistory).trim() : null,
      status: body.status === "DECEASED" ? "DECEASED" : "ALIVE",
    },
  });

  return NextResponse.json({ pet }, { status: 201 });
}
