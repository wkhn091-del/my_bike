"use server";

import { redirect } from "next/navigation";
import { buildQuote, readOrderToken, startCheckout } from "@/lib/checkout/service";
import type { CheckoutState, QuoteView } from "@/lib/checkout/types";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";
import { requestContext } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { checkoutSchema, couponField, fieldErrors, quantityField } from "@/lib/validation/forms";

const MINUTE = 60_000;

const GENERIC_ERROR = "משהו השתבש אצלנו. הפרטים נשמרו, ואפשר ללחוץ שוב";
const RATE_LIMITED = "רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה";

/** Live total for the register form. Display only: startCheckout re-prices under the seat lock. */
export async function quoteAction(rawQuantity: unknown, rawCoupon: unknown, rawRetryToken: unknown): Promise<QuoteView> {
  const quantity = quantityField.safeParse(rawQuantity);
  const coupon = couponField.safeParse(rawCoupon);
  if (!quantity.success) return { status: "closed" };
  const retryId = typeof rawRetryToken === "string" && rawRetryToken.length <= 200 ? readOrderToken(rawRetryToken) : null;

  const { ip } = await requestContext();
  if (!(await rateLimit(`quote:ip:${await hashKey(ip)}`, 60, MINUTE))) return { status: "rate_limited" };

  try {
    return await buildQuote(quantity.data, coupon.success ? coupon.data : "", retryId);
  } catch (error) {
    reportError("quote", error);
    return { status: "closed" };
  }
}

export async function checkoutAction(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const { ip, sameOrigin } = await requestContext();
  if (!sameOrigin) {
    reportBlocked("origin", "checkout");
    return { status: "error", message: GENERIC_ERROR };
  }

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };

  const [ipOk, phoneOk] = await Promise.all([
    rateLimit(`checkout:ip:${await hashKey(ip)}`, 8, 10 * MINUTE),
    rateLimit(`checkout:phone:${await hashKey(parsed.data.phone)}`, 5, 10 * MINUTE),
  ]);
  if (!ipOk || !phoneOk) {
    reportBlocked("rate_limit", "checkout");
    return { status: "error", message: RATE_LIMITED };
  }

  if (!(await verifyTurnstile(formData, "checkout", ip))) {
    reportBlocked("turnstile", "checkout");
    return { status: "error", message: "לא הצלחנו לוודא שאתם לא רובוט. אפשר ללחוץ שוב" };
  }

  let url: string;
  try {
    const result = await startCheckout(parsed.data);
    switch (result.kind) {
      case "redirect":
        url = result.url;
        break;
      case "price_changed": {
        const quote = result.quote;
        const message =
          quote.status === "ok" && quote.quantity < parsed.data.quantity
            ? `נשארו רק ${quote.seatsLeft} מקומות. עדכנו את הכמות ל-${quote.quantity}`
            : quote.status === "ok"
              ? `המחיר השתנה לפני רגע. המחיר עכשיו: ${(quote.totalAgorot / 100).toLocaleString("he-IL")} ₪`
              : GENERIC_ERROR;
        return { status: "price_changed", quote, message };
      }
      case "sold_out":
        return { status: "sold_out" };
      case "closed":
        return { status: "error", message: "ההרשמה סגורה כרגע" };
      default:
        return { status: "error", message: "לא הצלחנו לפתוח את דף התשלום. לא חויבתם, ואפשר לנסות שוב" };
    }
  } catch (error) {
    reportError("checkout", error);
    return { status: "error", message: GENERIC_ERROR };
  }

  redirect(url);
}
