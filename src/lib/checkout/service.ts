import "server-only";
import { after } from "next/server";
import { getCoupon, getSiteContent } from "@/lib/content/get";
import type { EventContent } from "@/lib/content/types";
import {
  attachLowProfile,
  cancelHeldOrder,
  countCouponUses,
  getOrder,
  insertHeldOrder,
  markOrderPaid,
  readAvailability,
  type OrderRow,
} from "@/lib/db/orders";
import { hasDatabase, pool, withSeatLock } from "@/lib/db/pool";
import { serverEnv, siteUrl, tokenSecret } from "@/lib/env/server";
import { formatShekels, formatShortDate } from "@/lib/format";
import { sendOrderConfirmation, notifyOrderPaid } from "@/lib/notify/email";
import { appendRow } from "@/lib/notify/sheets";
import { reportError } from "@/lib/observability/report";
import { createPaymentPage, fetchPaymentResult } from "@/lib/payments/cardcom";
import { calculateOrder, checkCoupon, type CouponStatus, type PricingConfig } from "@/lib/pricing/calculate";
import { createSignedToken, verifySignedToken } from "@/lib/security/signed-token";
import type { CheckoutInput } from "@/lib/validation/forms";
import type { QuoteView } from "./types";

const DAY = 60 * 60 * 24;
/** Capability-URL window: at least a week, at most 45 days, or a week past the event — whichever is sooner of the caps. */
const ORDER_TOKEN_TTL_MIN = DAY * 7;
const ORDER_TOKEN_TTL_MAX = DAY * 45;

export function pricingConfig(event: EventContent): PricingConfig {
  return { regularAgorot: event.priceAgorot, early: event.early, friendDiscountAgorot: event.friendDiscountAgorot };
}

function orderTokenTtlSeconds(eventDate: string): number {
  const until = new Date(`${eventDate}T23:59:59+02:00`).getTime() + DAY * 7 * 1000;
  const fromEvent = Math.floor((until - Date.now()) / 1000);
  return Math.min(ORDER_TOKEN_TTL_MAX, Math.max(ORDER_TOKEN_TTL_MIN, fromEvent));
}

export type PublicAvailability = { seatsLeft: number; earlySeatsLeft: number; taken: number; live: boolean };

/** Seat counts for the public page. Without a database (local preview) it shows a full, unsold event. */
export async function getAvailability(event: EventContent, excludeOrderId: string | null = null): Promise<PublicAvailability> {
  const earlySeats = event.early?.seats ?? 0;
  if (!pool) return { seatsLeft: event.capacity, earlySeatsLeft: earlySeats, taken: 0, live: false };
  try {
    const result = await readAvailability(pool, event.capacity, earlySeats, excludeOrderId);
    return { ...result, live: true };
  } catch (error) {
    reportError("availability", error);
    return { seatsLeft: event.capacity, earlySeatsLeft: earlySeats, taken: 0, live: false };
  }
}

export function salesAreOpen(event: EventContent): boolean {
  return event.salesOpen && hasDatabase;
}

async function resolveCoupon(code: string, usesCounter: (code: string) => Promise<number>) {
  if (!code) return { coupon: null, status: "none" as CouponStatus };
  const record = await getCoupon(code);
  const uses = record ? await usesCounter(record.code) : 0;
  return checkCoupon(record, uses, new Date());
}

/** `retryOrderId`: the buyer's own abandoned hold, which startCheckout releases, so it must not count against them. */
export async function buildQuote(quantity: number, couponCode: string, retryOrderId: string | null = null): Promise<QuoteView> {
  const { event } = await getSiteContent();
  if (!event.salesOpen) return { status: "closed" };
  const availability = await getAvailability(event, retryOrderId);
  const { coupon, status: couponStatus } = await resolveCoupon(couponCode, (code) =>
    pool ? countCouponUses(pool, code) : Promise.resolve(0),
  );
  const result = calculateOrder(quantity, pricingConfig(event), availability, coupon);
  if (result.status === "sold_out") return { status: "sold_out" };
  return {
    status: "ok",
    quantity: result.quantity,
    quantityClamped: result.quantityClamped,
    totalAgorot: result.totalAgorot,
    subtotalAgorot: result.subtotalAgorot,
    discountAgorot: result.discountAgorot,
    discount: result.discount,
    couponStatus: couponStatus === "applied" && result.discount !== "coupon" ? "not_best" : couponStatus,
    lines: result.lines,
    seatsLeft: availability.seatsLeft,
    earlySeatsLeft: availability.earlySeatsLeft,
  };
}

export function orderToken(orderId: string, eventDate?: string): string {
  const ttl = eventDate ? orderTokenTtlSeconds(eventDate) : ORDER_TOKEN_TTL_MAX;
  return createSignedToken("order", orderId, ttl, tokenSecret);
}

export function readOrderToken(token: string): string | null {
  return verifySignedToken("order", token, tokenSecret);
}

export type StartResult =
  | { kind: "redirect"; url: string }
  | { kind: "price_changed"; quote: QuoteView }
  | { kind: "sold_out" }
  | { kind: "closed" }
  | { kind: "failed" };

/**
 * Re-prices under the seat lock, holds the seats for 15 minutes, then opens a Cardcom page.
 * If the price the buyer saw is no longer the price (early seats ran out, a seat was taken),
 * nothing is held and the new quote goes back for an explicit re-confirmation.
 */
export async function startCheckout(input: CheckoutInput): Promise<StartResult> {
  const { event } = await getSiteContent();
  if (!salesAreOpen(event)) return { kind: "closed" };

  const orderId = crypto.randomUUID();
  const retryId = input.retryToken ? readOrderToken(input.retryToken) : null;

  const held = await withSeatLock(async (client) => {
    if (retryId) await cancelHeldOrder(client, retryId);
    const availability = await readAvailability(client, event.capacity, event.early?.seats ?? 0);
    const { coupon, status: couponStatus } = await resolveCoupon(input.coupon, (code) => countCouponUses(client, code));
    const result = calculateOrder(input.quantity, pricingConfig(event), availability, coupon);
    if (result.status === "sold_out") return { kind: "sold_out" as const };

    if (result.totalAgorot !== input.expectedTotal || result.quantity !== input.quantity) {
      const quote: QuoteView = {
        status: "ok",
        quantity: result.quantity,
        quantityClamped: result.quantityClamped,
        totalAgorot: result.totalAgorot,
        subtotalAgorot: result.subtotalAgorot,
        discountAgorot: result.discountAgorot,
        discount: result.discount,
        couponStatus: couponStatus === "applied" && result.discount !== "coupon" ? "not_best" : couponStatus,
        lines: result.lines,
        seatsLeft: availability.seatsLeft,
        earlySeatsLeft: availability.earlySeatsLeft,
      };
      return { kind: "price_changed" as const, quote };
    }

    await insertHeldOrder(client, {
      id: orderId,
      quote: result,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      ridingLevel: input.ridingLevel,
      marketingOptIn: input.marketing,
      wallOptIn: input.wall,
    });
    return { kind: "held" as const, quote: result };
  });

  if (held.kind !== "held") return held;

  const token = orderToken(orderId, event.date);
  const thankYouUrl = `${siteUrl}/thank-you/${token}`;

  if (serverEnv.PAYMENTS_MODE === "mock") {
    // Defense in depth: env schema already forbids DEMO_PUBLIC+DATABASE_URL.
    if (process.env.DEMO_PUBLIC === "1" || serverEnv.VERCEL_ENV === "production") {
      reportError("mock-checkout-blocked", new Error("Mock checkout refused outside local/dev"));
      await withSeatLock((client) => cancelHeldOrder(client, orderId)).catch((cancelError) => reportError("cancel-hold", cancelError));
      return { kind: "failed" };
    }
    await confirmOrder(orderId, held.quote.totalAgorot, null);
    return { kind: "redirect", url: thankYouUrl };
  }

  try {
    const description = `${held.quote.quantity === 1 ? "כרטיס" : `${held.quote.quantity} כרטיסים`} ל${event.title}, ${formatShortDate(event.date)}`;
    const page = await createPaymentPage({
      orderId,
      amountAgorot: held.quote.totalAgorot,
      description,
      buyer: { fullName: input.fullName, email: input.email, phone: input.phone },
      successUrl: thankYouUrl,
      failedUrl: `${siteUrl}/register?status=failed&t=${encodeURIComponent(token)}`,
      webhookUrl: `${siteUrl}/api/cardcom/webhook`,
    });
    await attachLowProfile(orderId, page.lowProfileId);
    return { kind: "redirect", url: page.url };
  } catch (error) {
    reportError("cardcom-create", error);
    await withSeatLock((client) => cancelHeldOrder(client, orderId)).catch((cancelError) => reportError("cancel-hold", cancelError));
    return { kind: "failed" };
  }
}

/** Marks paid (idempotent) and, on the first transition only, sends emails and the Sheets row after the response. */
async function confirmOrder(orderId: string, paidAgorot: number, transactionId: number | null): Promise<OrderRow | null> {
  const before = await getOrder(orderId);
  if (!before) return null;
  if (before.amount_agorot !== paidAgorot) {
    reportError("payment-amount-mismatch", new Error(`Order ${orderId} paid ${paidAgorot}, expected ${before.amount_agorot}`));
    return null;
  }
  const result = await markOrderPaid(orderId, transactionId);
  if (!result) return null;
  if (result.transitioned) {
    const paid = result.order;
    if (result.heldExpired) reportError("paid-after-hold", new Error(`Order ${orderId} paid after its hold expired`));
    after(async () => {
      const { event, settings } = await getSiteContent();
      await Promise.all([
        sendOrderConfirmation(paid, event, settings, `${siteUrl}/thank-you/${orderToken(paid.id, event.date)}`),
        notifyOrderPaid(paid, { heldExpired: result.heldExpired }),
        appendRow("הזמנות", [
          new Date().toISOString(),
          paid.id.slice(0, 8),
          paid.full_name,
          paid.phone,
          paid.email,
          paid.quantity,
          formatShekels(paid.amount_agorot),
          paid.discount_kind,
          paid.coupon_code,
          paid.riding_level,
          paid.seat_start,
          paid.marketing_opt_in ? "כן" : "לא",
        ]),
      ]);
    });
  }
  return result.order;
}

/** Webhook and thank-you page both land here; Cardcom's API is the only source of truth. */
export async function confirmFromCardcom(lowProfileId: string): Promise<OrderRow | null> {
  const payment = await fetchPaymentResult(lowProfileId);
  if (!payment) return null;
  const order = await getOrder(payment.orderId);
  if (!order || order.cardcom_low_profile_id !== payment.lowProfileId) {
    reportError("cardcom-mismatch", new Error(`LowProfile ${lowProfileId} does not match order ${payment.orderId}`));
    return null;
  }
  return confirmOrder(order.id, payment.amountAgorot, payment.transactionId);
}
