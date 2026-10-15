import { describe, expect, it } from "vitest";
import { calculateOrder, checkCoupon, type PricingConfig, type Quote } from "./calculate";

/*
 * One test per row of the business-logic matrix (PROJECT_BRIEF stage 2, section ד).
 * The real E / F / C values are still pending from Yoav, so the tests use stand-ins:
 * R = 690, E = 590, F = 60, C = 50.
 */
const R = 69_000;
const E = 59_000;
const F = 6_000;
const C = 5_000;

const config: PricingConfig = { regularAgorot: R, early: { priceAgorot: E, seats: 20 }, friendDiscountAgorot: F };
const plenty = { seatsLeft: 60, earlySeatsLeft: 20 };

function ok(result: ReturnType<typeof calculateOrder>): Quote {
  if (result.status !== "ok") throw new Error(`expected a quote, got ${result.status}`);
  return result;
}

describe("calculateOrder — matrix", () => {
  it("1 ticket, early seats left → early price", () => {
    const quote = ok(calculateOrder(1, config, plenty, null));
    expect(quote.totalAgorot).toBe(E);
    expect(quote.discount).toBe("early");
    expect(quote.earlyTickets).toBe(1);
  });

  it("1 ticket, no early seats → regular price", () => {
    const quote = ok(calculateOrder(1, config, { seatsLeft: 40, earlySeatsLeft: 0 }, null));
    expect(quote.totalAgorot).toBe(R);
    expect(quote.discount).toBe("none");
  });

  it("2 tickets, N ≥ 2 → min(2E, 2(R−F))", () => {
    const quote = ok(calculateOrder(2, config, plenty, null));
    expect(quote.totalAgorot).toBe(Math.min(2 * E, 2 * (R - F)));
    expect(quote.discount).toBe("early");
  });

  it("2 tickets when the friend discount beats early → friend", () => {
    const generous = { ...config, friendDiscountAgorot: 20_000 };
    const quote = ok(calculateOrder(2, generous, plenty, null));
    expect(quote.totalAgorot).toBe(2 * (R - 20_000));
    expect(quote.discount).toBe("friend");
    expect(quote.earlyTickets).toBe(0);
  });

  it("3 tickets, N = 1 → min(E+2R, 3(R−F)) with a line per price", () => {
    const quote = ok(calculateOrder(3, config, { seatsLeft: 30, earlySeatsLeft: 1 }, null));
    expect(quote.totalAgorot).toBe(Math.min(E + 2 * R, 3 * (R - F)));
    expect(quote.discount).toBe("friend");
    expect(quote.lines.reduce((sum, line) => sum + line.amountAgorot, 0)).toBe(quote.totalAgorot);
  });

  it("1 ticket + valid coupon, N = 0 → R − C", () => {
    const quote = ok(calculateOrder(1, config, { seatsLeft: 30, earlySeatsLeft: 0 }, { code: "INSTA", amountOffAgorot: C }));
    expect(quote.totalAgorot).toBe(R - C);
    expect(quote.discount).toBe("coupon");
    expect(quote.couponCode).toBe("INSTA");
  });

  it("2 tickets + coupon → the best single discount, never stacked", () => {
    const quote = ok(calculateOrder(2, config, { seatsLeft: 30, earlySeatsLeft: 0 }, { code: "INSTA", amountOffAgorot: C }));
    expect(quote.totalAgorot).toBe(Math.min(2 * (R - F), 2 * R - C));
    expect(quote.discountAgorot).toBe(2 * R - quote.totalAgorot);
  });

  it("5 tickets requested → capped at 4", () => {
    const quote = ok(calculateOrder(5, config, plenty, null));
    expect(quote.quantity).toBe(4);
    expect(quote.quantityClamped).toBe(true);
  });

  it("3 requested but 2 left → 2 tickets, recalculated", () => {
    const quote = ok(calculateOrder(3, config, { seatsLeft: 2, earlySeatsLeft: 0 }, null));
    expect(quote.quantity).toBe(2);
    expect(quote.quantityClamped).toBe(true);
    expect(quote.totalAgorot).toBe(2 * (R - F));
  });

  it("early price ran out mid-form → the new, higher price is returned (caller asks to re-confirm)", () => {
    const before = ok(calculateOrder(1, config, { seatsLeft: 30, earlySeatsLeft: 1 }, null));
    const after = ok(calculateOrder(1, config, { seatsLeft: 30, earlySeatsLeft: 0 }, null));
    expect(after.totalAgorot).toBeGreaterThan(before.totalAgorot);
  });

  it("80 seats sold → sold_out", () => {
    expect(calculateOrder(1, config, { seatsLeft: 0, earlySeatsLeft: 0 }, null)).toEqual({ status: "sold_out" });
  });

  it("a coupon larger than the order never makes the total negative", () => {
    const quote = ok(calculateOrder(1, config, { seatsLeft: 30, earlySeatsLeft: 0 }, { code: "BIG", amountOffAgorot: 999_999 }));
    expect(quote.totalAgorot).toBe(0);
  });

  it("no discounts configured → plain regular price", () => {
    const bare: PricingConfig = { regularAgorot: R, early: null, friendDiscountAgorot: null };
    const quote = ok(calculateOrder(4, bare, plenty, null));
    expect(quote.totalAgorot).toBe(4 * R);
    expect(quote.discount).toBe("none");
  });

  it("rejects a non-integer quantity", () => {
    expect(() => calculateOrder(1.5, config, plenty, null)).toThrow(RangeError);
  });
});

describe("checkCoupon", () => {
  const now = new Date("2026-11-20T10:00:00Z");
  const base = { code: "INSTA", amountOffAgorot: C, validUntil: "2026-12-01T00:00:00Z", maxUses: 10, active: true };

  it("valid coupon → applied", () => {
    expect(checkCoupon(base, 3, now).status).toBe("applied");
  });
  it("expired coupon → expired, does not block the purchase", () => {
    expect(checkCoupon({ ...base, validUntil: "2026-11-01T00:00:00Z" }, 0, now)).toEqual({ coupon: null, status: "expired" });
  });
  it("used up → used_up", () => {
    expect(checkCoupon(base, 10, now).status).toBe("used_up");
  });
  it("unknown or inactive → not_found", () => {
    expect(checkCoupon(null, 0, now).status).toBe("not_found");
    expect(checkCoupon({ ...base, active: false }, 0, now).status).toBe("not_found");
  });
});
