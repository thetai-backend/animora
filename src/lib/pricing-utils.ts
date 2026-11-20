export interface PricedItem {
  category: string; // MEDICAL | SPA | SHOP | MEDICINE
  totalPrice: number;
}

export interface PromoInput {
  id: string;
  code: string | null;
  title: string;
  discountType: string; // PERCENT | FIXED
  discountValue: number;
  applicableScope: string; // ALL | MEDICAL | SPA | SHOP
}

export interface DiscountBreakdown {
  subtotal: number;
  eventDiscountAmount: number;
  couponDiscountAmount: number;
  totalAmount: number;
}

function scopeMatchesCategory(scope: string, category: string): boolean {
  if (scope === "ALL") return true;
  if (scope === "MEDICAL") return category === "MEDICAL" || category === "MEDICINE";
  return scope === category;
}

/**
 * Rule 9: Tính cộng dồn đa khuyến mãi đúng thứ tự kế toán:
 * 1) Trừ khuyến mãi Sự kiện/Dịch vụ trước (trên phần tiền phù hợp phạm vi).
 * 2) Trừ tiếp Mã giảm giá trên tổng tiền còn lại.
 * 3) Tổng thanh toán tối thiểu 0đ, không bao giờ âm.
 */
export function calculateInvoiceTotals(
  items: PricedItem[],
  eventPromo?: PromoInput | null,
  couponPromo?: PromoInput | null
): DiscountBreakdown {
  const subtotal = items.reduce((sum, item) => sum + Math.max(0, item.totalPrice), 0);

  let eventDiscountAmount = 0;
  if (eventPromo) {
    const eligibleSubtotal = items
      .filter((item) => scopeMatchesCategory(eventPromo.applicableScope, item.category))
      .reduce((sum, item) => sum + Math.max(0, item.totalPrice), 0);

    if (eligibleSubtotal > 0) {
      if (eventPromo.discountType === "PERCENT") {
        eventDiscountAmount = Math.round((eligibleSubtotal * eventPromo.discountValue) / 100);
      } else {
        eventDiscountAmount = Math.min(eligibleSubtotal, eventPromo.discountValue);
      }
    }
  }

  const afterEvent = Math.max(0, subtotal - eventDiscountAmount);

  let couponDiscountAmount = 0;
  if (couponPromo && afterEvent > 0) {
    if (couponPromo.discountType === "PERCENT") {
      couponDiscountAmount = Math.round((afterEvent * couponPromo.discountValue) / 100);
    } else {
      couponDiscountAmount = Math.min(afterEvent, couponPromo.discountValue);
    }
  }

  const totalAmount = Math.max(0, afterEvent - couponDiscountAmount);

  return {
    subtotal,
    eventDiscountAmount,
    couponDiscountAmount,
    totalAmount,
  };
}

/**
 * Tạo đường dẫn ảnh VietQR tĩnh tự điền sẵn số tiền và mã hóa đơn (img.vietqr.io).
 */
export function buildVietQrUrl(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  invoiceCode: string;
}): string {
  const bank = encodeURIComponent(params.bankCode || "MB");
  const acc = encodeURIComponent(params.accountNumber || "08889992468");
  const addInfo = encodeURIComponent(`ANIMORA ${params.invoiceCode}`);
  const accName = encodeURIComponent(params.accountName || "PHONG KHAM THU Y ANIMORA");
  return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${Math.max(
    0,
    Math.round(params.amount)
  )}&addInfo=${addInfo}&accountName=${accName}`;
}
