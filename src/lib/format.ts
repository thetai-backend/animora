export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function formatSpecies(species: string): string {
  switch (species) {
    case "DOG":
      return "Chó";
    case "CAT":
      return "Mèo";
    case "BOTH":
      return "Chó & Mèo";
    default:
      return "Khác";
  }
}

export function formatGender(gender?: string | null): string {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa rõ";
}

export function formatDateVn(date: Date | string | null | undefined): string {
  if (!date) return "Chưa cập nhật";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTimeVn(date: Date | string | null | undefined): string {
  if (!date) return "Chưa cập nhật";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function slugifyVi(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function calculatePetAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return "";
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let months =
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) return "";
  if (months < 12) return `${Math.max(1, months)} tháng tuổi`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} tuổi ${remMonths} tháng` : `${years} tuổi`;
}

export function formatWorkStatus(status: string): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Đang trống",
        colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "IN_EXAM":
      return {
        label: "Đang khám",
        colorClass: "bg-amber-100 text-amber-800 border-amber-200",
      };
    default:
      return {
        label: "Đang nghỉ",
        colorClass: "bg-slate-200 text-slate-700 border-slate-300",
      };
  }
}

export function formatBookingStatus(status: string): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Đã xác nhận",
        colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "CHECKED_IN":
      return {
        label: "Đã Check-in",
        colorClass: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "IN_PROGRESS":
      return {
        label: "Đang khám",
        colorClass: "bg-amber-100 text-amber-800 border-amber-200",
      };
    case "COMPLETED":
      return {
        label: "Đã hoàn tất",
        colorClass: "bg-slate-200 text-slate-700 border-slate-300",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        colorClass: "bg-rose-100 text-rose-800 border-rose-200",
      };
    default:
      return {
        label: status,
        colorClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function formatShift(shift: string): string {
  switch (shift) {
    case "MORNING":
      return "Ca sáng (07:00 – 13:30)";
    case "AFTERNOON":
      return "Ca chiều (13:30 – 20:00)";
    case "FULL_DAY":
      return "Cả ngày (07:00 – 20:00)";
    default:
      return shift;
  }
}
