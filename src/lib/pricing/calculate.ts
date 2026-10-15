/**
 * Price engine (PROJECT_BRIEF stage 2, section ד). Runs on the server only: the browser sends a
 * quantity and a coupon code, never a price. All amounts are integer agorot, VAT included.
 *
 * Rule 5 of the matrix: one discount per order. Every eligible option is priced and the cheapest
 * for the buyer wins. On a tie, the option that spends no scarce resource wins
 * (friend discount, then coupon, then early-bird seats), so early seats stay available for others.
 */

export const MAX_TICKETS_PER_ORDER = 4;

export type PricingConfig = {
  regularAgorot: number;
  early: { priceAgorot: number; seats: number } | null;
  /** Per ticket, when buying 2 or more. */
  friendDiscountAgorot: number | null;
};

export type Availability = {
  seatsLeft: number;
  earlySeatsLeft: number;
};

export type AppliedCoupon = { code: string; amountOffAgorot: number };

export type DiscountKind = "none" | "early" | "friend" | "coupon";

export type QuoteLine = { label: string; amountAgorot: number };

export type Quote = {
  status: "ok";
  requestedQuantity: number;
  quantity: number;
  quantityClamped: boolean;
  subtotalAgorot: number;
  discountAgorot: number;
  totalAgorot: number;
  discount: DiscountKind;
  earlyTickets: number;
  couponCode: string | null;
  lines: QuoteLine[];
};

export type QuoteResult = Quote | { status: "sold_out" };

type Option = {
  kind: DiscountKind;
  total: number;
  earlyTickets: number;
  lines: QuoteLine[];
};

const TIE_PREFERENCE: Record<DiscountKind, number> = { none: 0, friend: 1, coupon: 2, early: 3 };

function ticketsLabel(quantity: number): string {
  return quantity === 1 ? "כרטיס אחד" : `${quantity} כרטיסים`;
}

export function calculateOrder(
  requestedQuantity: number,
  config: PricingConfig,
  availability: Availability,
  coupon: AppliedCoupon | null,
): QuoteResult {
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new RangeError("quantity must be a positive integer");
  }
  const seatsLeft = Math.max(0, Math.floor(availability.seatsLeft));
  if (seatsLeft === 0) return { status: "sold_out" };

  const quantity = Math.min(requestedQuantity, MAX_TICKETS_PER_ORDER, seatsLeft);
  const regular = config.regularAgorot;
  const subtotal = quantity * regular;

  const options: Option[] = [
    {
      kind: "none",
      total: subtotal,
      earlyTickets: 0,
      lines: [{ label: `${ticketsLabel(quantity)} × מחיר רגיל`, amountAgorot: subtotal }],
    },
  ];

  const earlyLeft = Math.max(0, Math.floor(availability.earlySeatsLeft));
  if (config.early && config.early.priceAgorot < regular && earlyLeft > 0) {
    const earlyTickets = Math.min(quantity, earlyLeft);
    const regularTickets = quantity - earlyTickets;
    const lines: QuoteLine[] = [
      { label: `${ticketsLabel(earlyTickets)} × מחיר מוקדם`, amountAgorot: earlyTickets * config.early.priceAgorot },
    ];
    if (regularTickets > 0) {
      lines.push({ label: `${ticketsLabel(regularTickets)} × מחיר רגיל`, amountAgorot: regularTickets * regular });
    }
    options.push({
      kind: "early",
      total: earlyTickets * config.early.priceAgorot + regularTickets * regular,
      earlyTickets,
      lines,
    });
  }

  const friend = config.friendDiscountAgorot;
  if (friend && friend > 0 && quantity >= 2) {
    const unit = Math.max(0, regular - friend);
    options.push({
      kind: "friend",
      total: quantity * unit,
      earlyTickets: 0,
      lines: [{ label: `${ticketsLabel(quantity)} × מחיר חברים`, amountAgorot: quantity * unit }],
    });
  }

  if (coupon && coupon.amountOffAgorot > 0) {
    const off = Math.min(coupon.amountOffAgorot, subtotal);
    options.push({
      kind: "coupon",
      total: subtotal - off,
      earlyTickets: 0,
      lines: [
        { label: `${ticketsLabel(quantity)} × מחיר רגיל`, amountAgorot: subtotal },
        { label: `קוד ${coupon.code}`, amountAgorot: -off },
      ],
    });
  }

  const best = options.reduce((winner, option) => {
    if (option.total < winner.total) return option;
    if (option.total === winner.total && option.kind !== "none" && winner.kind !== "none") {
      return TIE_PREFERENCE[option.kind] < TIE_PREFERENCE[winner.kind] ? option : winner;
    }
    return winner;
  });

  return {
    status: "ok",
    requestedQuantity,
    quantity,
    quantityClamped: quantity < requestedQuantity,
    subtotalAgorot: subtotal,
    discountAgorot: subtotal - best.total,
    totalAgorot: best.total,
    discount: best.kind,
    earlyTickets: best.earlyTickets,
    couponCode: best.kind === "coupon" && coupon ? coupon.code : null,
    lines: best.lines,
  };
}

export type CouponRecord = {
  code: string;
  amountOffAgorot: number;
  validUntil: string | null;
  maxUses: number | null;
  active: boolean;
};

export type CouponStatus = "none" | "applied" | "not_found" | "expired" | "used_up" | "not_best";

/** Decides whether a coupon from the CMS may be offered to calculateOrder. */
export function checkCoupon(record: CouponRecord | null, usedCount: number, now: Date): { coupon: AppliedCoupon | null; status: CouponStatus } {
  if (!record || !record.active) return { coupon: null, status: "not_found" };
  if (record.validUntil && new Date(record.validUntil).getTime() < now.getTime()) return { coupon: null, status: "expired" };
  if (record.maxUses !== null && usedCount >= record.maxUses) return { coupon: null, status: "used_up" };
  return { coupon: { code: record.code, amountOffAgorot: record.amountOffAgorot }, status: "applied" };
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}
