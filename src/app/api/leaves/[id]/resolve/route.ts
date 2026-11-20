import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Không có quyền thao tác" }, { status: 403 });
  }

  const { id } = await context.params;
  const updated = await prisma.doctorLeave.update({
    where: { id },
    data: { resolvedByReceptionist: true },
  });

  return NextResponse.json({ leave: updated });
}
