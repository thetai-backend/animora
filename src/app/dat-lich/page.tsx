import React from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StickyHeader } from "@/components/StickyHeader";
import { BookingClient } from "@/components/booking/BookingClient";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const session = await getSession();

  const [services, doctors, customerPets, customerInfo] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "DOCTOR", isActive: true },
      select: {
        id: true,
        fullName: true,
        title: true,
        specialty: true,
        workStatus: true,
      },
      orderBy: { fullName: "asc" },
    }),
    session
      ? prisma.pet.findMany({
          where: { ownerId: session.userId, status: "ALIVE" },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    session
      ? prisma.user.findUnique({
          where: { id: session.userId },
          select: { fullName: true, phone: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
      <StickyHeader session={session} />
      <main className="mx-auto max-w-[1380px] px-8 py-10">
        <BookingClient
          session={session}
          customerInfo={customerInfo}
          customerPets={customerPets.map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
          }))}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            price: s.price,
            durationMinutes: s.durationMinutes,
          }))}
          doctors={doctors}
        />
      </main>
    </div>
  );
}
