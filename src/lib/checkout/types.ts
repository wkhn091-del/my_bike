import type { CouponStatus, QuoteLine } from "@/lib/pricing/calculate";

/** What the browser is allowed to see about a price. Computed on the server, display only. */
export type QuoteView =
  | {
      status: "ok";
      quantity: number;
      quantityClamped: boolean;
      totalAgorot: number;
      subtotalAgorot: number;
      discountAgorot: number;
      discount: "none" | "early" | "friend" | "coupon";
      couponStatus: CouponStatus;
      lines: QuoteLine[];
      seatsLeft: number;
      earlySeatsLeft: number;
    }
  | { status: "sold_out" }
  | { status: "closed" }
  | { status: "rate_limited" };

export type CheckoutState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "price_changed"; quote: QuoteView; message: string }
  | { status: "error"; message: string }
  | { status: "sold_out" };
