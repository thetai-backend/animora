import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền quản lý nhân sự" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "RECEPTIONIST", "DOCTOR"] } },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      title: true,
      specialty: true,
      experienceYears: true,
      bio: true,
      workStatus: true,
      createdAt: true,
      _count: {
        select: {
          doctorMedicalRecords: true,
          cashierInvoices: true,
          doctorInvoices: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Quản lý mới có quyền tạo tài khoản nhân viên" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const fullName = String(body.fullName || "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const role = ["MANAGER", "RECEPTIONIST", "DOCTOR"].includes(String(body.role))
    ? String(body.role)
    : "RECEPTIONIST";

  if (!email || !password || !fullName) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu khởi tạo" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: `Email "${email}" đã tồn tại trên hệ thống` }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone,
      address: body.address ? String(body.address).trim() : null,
      role,
      isActive: true,
      emailVerified: true,
      avatarUrl:
        body.avatarUrl
          ? String(body.avatarUrl).trim()
          : role === "DOCTOR"
          ? "/images/doctor-1.jpg"
          : null,
      title: body.title ? String(body.title).trim() : null,
      specialty: body.specialty ? String(body.specialty).trim() : null,
      experienceYears: body.experienceYears ? Number(body.experienceYears) : null,
      bio: body.bio ? String(body.bio).trim() : null,
      workStatus: "AVAILABLE",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      title: true,
      specialty: true,
      experienceYears: true,
      bio: true,
      avatarUrl: true,
    },
  });

  // Nếu tạo tài khoản Bác sĩ -> tự khởi tạo lịch trực mặc định 7 ngày để đặt lịch hoạt động ngay
  if (role === "DOCTOR") {
    for (let dow = 0; dow <= 6; dow++) {
      await prisma.workSchedule.upsert({
        where: { doctorId_dayOfWeek: { doctorId: created.id, dayOfWeek: dow } },
        update: {},
        create: {
          doctorId: created.id,
          dayOfWeek: dow,
          morningShift: true,
          afternoonShift: true,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/dat-lich");

  return NextResponse.json(
    {
      staff: created,
      message: `Đã tạo tài khoản nhân sự "${created.fullName}" (${role}) thành công!`,
    },
    { status: 201 }
  );
}
