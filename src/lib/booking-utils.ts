import { prisma } from "@/lib/prisma";

export const OPEN_MINUTES = 7 * 60; // 07:00
export const CLOSE_MINUTES = 20 * 60; // 20:00
export const MORNING_END_MINUTES = 13 * 60 + 30; // 13:30
export const LUNCH_START_MINUTES = 12 * 60; // 12:00
export const LUNCH_END_MINUTES = 13 * 60 + 30; // 13:30
export const SLOT_STEP = 30;

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToTime(hhmm: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(hhmm) + durationMinutes);
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayOfWeekFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getDay();
}

export function generateBookingCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `ANM-${digits}`;
}

export function generateShortCode(prefix: string): string {
  const now = new Date();
  const stamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${rand}`;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Quy tắc quá giờ hẹn 20 phút (Rule 4):
 * Nếu lịch hẹn có trạng thái CONFIRMED và đã quá 20 phút so với startTime (của hôm nay hoặc ngày trước) -> màu Đỏ.
 */
export function isBookingLate20Min(
  bookingDate: string,
  startTime: string,
  status: string
): boolean {
  if (status !== "CONFIRMED") return false;
  const [y, m, d] = bookingDate.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  const scheduled = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  const diffMs = Date.now() - scheduled.getTime();
  return diffMs > 20 * 60 * 1000;
}

export function getShiftRange(shift: string): { start: number; end: number } {
  if (shift === "MORNING") {
    return { start: OPEN_MINUTES, end: MORNING_END_MINUTES };
  }
  if (shift === "AFTERNOON") {
    return { start: MORNING_END_MINUTES, end: CLOSE_MINUTES };
  }
  return { start: OPEN_MINUTES, end: CLOSE_MINUTES };
}

export interface SlotAvailability {
  time: string;
  available: boolean;
  availableDoctorIds: string[];
  reason?: string;
}

/**
 * Tính toán toàn bộ các slot 30 phút (07:00 - 20:00) cho 1 ngày & tổng thời lượng dịch vụ.
 * Tôn trọng: WorkSchedule, ClinicSettings.lunchBreakEnabled (12:00-13:30), DoctorLeave, và Booking hiện có.
 */
export async function computeDayAvailability(params: {
  date: string;
  durationMinutes: number;
  doctorId?: string | null;
}) {
  const duration = Math.max(30, Math.ceil(params.durationMinutes / 30) * 30);
  const dayOfWeek = getDayOfWeekFromDateStr(params.date);

  const [settings, doctors, schedules, leaves, bookings] = await Promise.all([
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
    prisma.user.findMany({
      where: {
        role: "DOCTOR",
        isActive: true,
        ...(params.doctorId ? { id: params.doctorId } : {}),
      },
      select: {
        id: true,
        fullName: true,
        title: true,
        specialty: true,
        workStatus: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.workSchedule.findMany({
      where: { dayOfWeek },
    }),
    prisma.doctorLeave.findMany({
      where: { leaveDate: params.date },
    }),
    prisma.booking.findMany({
      where: {
        bookingDate: params.date,
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        doctorId: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  const lunchEnabled = settings?.lunchBreakEnabled ?? false;
  const lunchStart = timeToMinutes(settings?.lunchStart || "12:00");
  const lunchEnd = timeToMinutes(settings?.lunchEnd || "13:30");

  // Đếm số lịch hẹn trong ngày của mỗi bác sĩ để dùng cho "Phòng khám tự phân công"
  const bookingCountByDoctor: Record<string, number> = {};
  for (const doc of doctors) {
    bookingCountByDoctor[doc.id] = 0;
  }
  for (const b of bookings) {
    if (b.doctorId && bookingCountByDoctor[b.doctorId] !== undefined) {
      bookingCountByDoctor[b.doctorId] += 1;
    }
  }

  const slots: SlotAvailability[] = [];

  for (let startMin = OPEN_MINUTES; startMin + duration <= CLOSE_MINUTES; startMin += SLOT_STEP) {
    const endMin = startMin + duration;
    const timeStr = minutesToTime(startMin);

    if (lunchEnabled && rangesOverlap(startMin, endMin, lunchStart, lunchEnd)) {
      slots.push({
        time: timeStr,
        available: false,
        availableDoctorIds: [],
        reason: "Nghỉ trưa (12:00 – 13:30)",
      });
      continue;
    }

    const availableDoctorIds: string[] = [];

    for (const doc of doctors) {
      const sched = schedules.find((s) => s.doctorId === doc.id);
      const morningOk = sched ? sched.morningShift : true;
      const afternoonOk = sched ? sched.afternoonShift : true;

      // Kiểm tra ca trực phủ kín khoảng [startMin, endMin)
      const needsMorning = startMin < MORNING_END_MINUTES;
      const needsAfternoon = endMin > MORNING_END_MINUTES;
      if ((needsMorning && !morningOk) || (needsAfternoon && !afternoonOk)) {
        continue;
      }

      // Kiểm tra lịch nghỉ (DoctorLeave)
      const docLeaves = leaves.filter((l) => l.doctorId === doc.id);
      const blockedByLeave = docLeaves.some((l) => {
        const range = getShiftRange(l.shift);
        return rangesOverlap(startMin, endMin, range.start, range.end);
      });
      if (blockedByLeave) continue;

      // Kiểm tra trùng lịch booking hiện có
      const docBookings = bookings.filter((b) => b.doctorId === doc.id);
      const blockedByBooking = docBookings.some((b) =>
        rangesOverlap(
          startMin,
          endMin,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        )
      );
      if (blockedByBooking) continue;

      availableDoctorIds.push(doc.id);
    }

    // Sắp xếp bác sĩ trống theo số lịch ít nhất trong ngày
    availableDoctorIds.sort(
      (a, b) => (bookingCountByDoctor[a] ?? 0) - (bookingCountByDoctor[b] ?? 0)
    );

    slots.push({
      time: timeStr,
      available: availableDoctorIds.length > 0,
      availableDoctorIds,
      reason: availableDoctorIds.length === 0 ? "Đã kín lịch" : undefined,
    });
  }

  return {
    date: params.date,
    durationMinutes: duration,
    lunchBreakEnabled: lunchEnabled,
    doctors,
    bookingCountByDoctor,
    slots,
  };
}
