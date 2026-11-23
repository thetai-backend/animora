import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ROLE_META,
  SESSION_COOKIE_NAME,
  SessionPayload,
  UserRole,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token";

export {
  ROLE_META,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
  type UserRole,
};

/**
 * Kiểm tra phiên đăng nhập kèm đối chiếu trạng thái isActive trực tiếp từ SQLite.
 * Rule 12 (Xóa mềm nhân sự): Nếu Quản lý chuyển tài khoản sang Ngừng hoạt động (isActive = false),
 * mọi session đang mở của tài khoản đó bị vô hiệu hóa ngay lập tức.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.APP_URL?.startsWith("https://")),
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
