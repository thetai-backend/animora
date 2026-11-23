import { SignJWT, jwtVerify } from "jose";

export type UserRole = "MANAGER" | "RECEPTIONIST" | "DOCTOR" | "CUSTOMER";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export const SESSION_COOKIE_NAME = "animora_session";

export const ROLE_META: Record<
  UserRole,
  {
    label: string;
    dashboardPath: string;
    badgeClass: string;
    description: string;
  }
> = {
  MANAGER: {
    label: "Quản lý",
    dashboardPath: "/quan-ly",
    badgeClass: "bg-[#0F766E] text-white",
    description: "Toàn quyền nhân sự, kho, sự kiện, CMS và báo cáo doanh thu",
  },
  RECEPTIONIST: {
    label: "Lễ tân",
    dashboardPath: "/le-tan",
    badgeClass: "bg-[#F97316] text-white",
    description: "Điều phối lịch trực, tiếp đón khách, thu ngân POS và in A4",
  },
  DOCTOR: {
    label: "Bác sĩ",
    dashboardPath: "/bac-si",
    badgeClass: "bg-[#0D9488] text-white",
    description: "Khám bệnh, ghi bệnh án S.O.A.P, kê đơn và cập nhật trạng thái trực",
  },
  CUSTOMER: {
    label: "Khách hàng",
    dashboardPath: "/tai-khoan",
    badgeClass: "bg-[#132A2E] text-white",
    description: "Quản lý hồ sơ cá nhân, danh sách thú cưng và lịch hẹn",
  },
};

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "animora-clinic-super-secret-jwt-key-2026-local-dev";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}
