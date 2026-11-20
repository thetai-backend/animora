import React from "react";
import { redirect } from "next/navigation";
import { PawPrint, User, Phone, MapPin, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateVn, formatGender, formatSpecies } from "@/lib/format";
import { RolePortalShell } from "@/components/RolePortalShell";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap");
  }

  const { notice } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      pets: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    redirect("/dang-nhap");
  }

  return (
    <RolePortalShell
      session={session}
      pageTitle={`Xin chào, ${user.fullName}`}
      pageSubtitle="Khu vực quản lý hồ sơ cá nhân, sổ sức khỏe thú cưng và lịch hẹn của bạn tại ANIMORA."
      notice={notice}
    >
      <div className="grid grid-cols-12 gap-8">
        {/* Hồ sơ chủ nuôi */}
        <div className="col-span-4 rounded-3xl border border-[#0F766E]/12 bg-white p-7">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
            <User className="h-5 w-5 text-[#0F766E]" />
            Thông tin tài khoản
          </h2>

          <div className="mt-5 space-y-3.5 text-sm">
            <div>
              <p className="text-xs font-semibold text-[#476268]">Họ và tên</p>
              <p className="font-bold text-[#132A2E]">{user.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#476268]">Email xác thực</p>
              <p className="inline-flex items-center gap-1.5 font-semibold text-[#132A2E]">
                {user.email}
                {user.emailVerified && (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#476268]">
              <Phone className="h-4 w-4 text-[#0F766E]" />
              <span>{user.phone || "Chưa cập nhật số điện thoại"}</span>
            </div>
            <div className="flex items-start gap-2 text-[#476268]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
              <span>{user.address || "Chưa cập nhật địa chỉ"}</span>
            </div>
          </div>
        </div>

        {/* Danh sách Thú cưng */}
        <div className="col-span-8 rounded-3xl border border-[#0F766E]/12 bg-white p-7">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#132A2E]">
              <PawPrint className="h-5 w-5 text-[#F97316]" />
              Danh sách Thú cưng của bạn ({user.pets.length})
            </h2>
            <span className="rounded-full bg-[#FAF9F6] px-3 py-1 text-xs font-semibold text-[#476268]">
              Tính năng thêm/sửa thú cưng & đặt lịch mở ở Giai đoạn 2
            </span>
          </div>

          {user.pets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0F766E]/25 bg-[#FAF9F6] p-10 text-center">
              <p className="text-sm font-bold text-[#132A2E]">
                Bạn chưa thêm hồ sơ thú cưng nào.
              </p>
              <p className="mt-1 text-xs text-[#476268]">
                (Bạn có thể thử đăng nhập bằng tài khoản mẫu <strong>khachhang@animora.vn</strong> để xem trước 2 hồ sơ thú cưng mẫu: Bơ và Mochi.)
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-5">
              {user.pets.map((pet) => (
                <div
                  key={pet.id}
                  className="rounded-2xl border border-[#0F766E]/12 bg-[#FAF9F6] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-[#0F766E]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F766E]">
                        {formatSpecies(pet.species)} • {formatGender(pet.gender)}
                      </span>
                      <h3 className="mt-1.5 text-xl font-extrabold text-[#132A2E]">
                        {pet.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#476268]">
                        {pet.breed || "Chưa rõ giống"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      {pet.status === "ALIVE" ? "Đang theo dõi" : "Đã mất"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-[#132A2E]/8 pt-3 text-xs text-[#476268]">
                    <p>
                      <strong className="text-[#132A2E]">Ngày sinh:</strong>{" "}
                      {formatDateVn(pet.birthDate)} •{" "}
                      <strong className="text-[#132A2E]">Triệt sản:</strong>{" "}
                      {pet.isNeutered ? "Đã triệt sản" : "Chưa"}
                    </p>
                    {pet.microchipCode && (
                      <p>
                        <strong className="text-[#132A2E]">Microchip:</strong>{" "}
                        <span className="font-mono">{pet.microchipCode}</span>
                      </p>
                    )}
                    {pet.allergies && (
                      <p>
                        <strong className="text-[#132A2E]">Dị ứng:</strong>{" "}
                        {pet.allergies}
                      </p>
                    )}
                    {pet.vaccinationHistory && (
                      <p>
                        <strong className="text-[#132A2E]">Tiêm phòng:</strong>{" "}
                        {pet.vaccinationHistory}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RolePortalShell>
  );
}
