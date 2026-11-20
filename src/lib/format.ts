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
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
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
