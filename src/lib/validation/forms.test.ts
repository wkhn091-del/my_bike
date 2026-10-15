import { describe, expect, it } from "vitest";
import { checkoutSchema, coachingSchema, detailsSchema, feedbackSchema, MESSAGES } from "./forms";

describe("feedbackSchema", () => {
  it("accepts a rating, cleans the text and keeps publish consent off unless ticked", () => {
    const parsed = feedbackSchema.parse({ rating: "5", message: "  יום <b>מעולה</b>\u0007 ", publish: null });
    expect(parsed).toEqual({ rating: 5, message: "יום bמעולה/b", publish: false });
    expect(feedbackSchema.parse({ rating: "4", message: "טוב מאוד", publish: "on" }).publish).toBe(true);
  });

  it("rejects a missing or out-of-range rating", () => {
    for (const rating of ["", "0", "6", "3.5", "abc"]) {
      expect(feedbackSchema.safeParse({ rating, message: "טוב מאוד" }).success).toBe(false);
    }
  });

  it("caps the message at 600 characters", () => {
    expect(feedbackSchema.safeParse({ rating: "3", message: "א".repeat(600) }).success).toBe(true);
    expect(feedbackSchema.safeParse({ rating: "3", message: "א".repeat(601) }).success).toBe(false);
    expect(feedbackSchema.safeParse({ rating: "3", message: " " }).success).toBe(false);
  });
});

describe("coachingSchema source", () => {
  it("falls back to home for an unknown source", () => {
    const base = { fullName: "דנה כהן", phone: "0501234567" };
    expect(coachingSchema.parse({ ...base, source: "thank_you" }).source).toBe("thank_you");
    expect(coachingSchema.parse({ ...base, source: "evil" }).source).toBe("home");
  });
});

const valid = {
  quantity: "2",
  fullName: "  דנה   לוי ",
  phone: "052-784 1250",
  email: " Dana@Gmail.com ",
  ridingLevel: "beginner",
  coupon: "insta10",
  terms: "on",
  marketing: null,
  wall: "on",
  expectedTotal: "138000",
};

describe("checkoutSchema", () => {
  it("normalises a valid submission", () => {
    const result = checkoutSchema.parse(valid);
    expect(result).toMatchObject({
      quantity: 2,
      fullName: "דנה לוי",
      phone: "0527841250",
      email: "dana@gmail.com",
      coupon: "INSTA10",
      marketing: false,
      wall: true,
    });
  });

  it("accepts +972 numbers", () => {
    expect(checkoutSchema.parse({ ...valid, phone: "+972527841250" }).phone).toBe("0527841250");
  });

  it("rejects a landline with the approved message", () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: "04-6123456" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(MESSAGES.phone);
  });

  it("requires the terms box (never pre-checked)", () => {
    expect(checkoutSchema.safeParse({ ...valid, terms: null }).success).toBe(false);
  });

  it("caps quantity at 4 on the server too", () => {
    expect(checkoutSchema.safeParse({ ...valid, quantity: "5" }).success).toBe(false);
  });

  it("drops a malformed coupon instead of blocking the purchase", () => {
    expect(checkoutSchema.parse({ ...valid, coupon: "<script>" }).coupon).toBe("");
  });

  it("strips markup characters from names", () => {
    expect(checkoutSchema.parse({ ...valid, fullName: "דנה <b>לוי</b>" }).fullName).toBe("דנה bלוי/b");
  });
});

describe("detailsSchema", () => {
  it("accepts a rider without a phone", () => {
    const result = detailsSchema.parse({
      bikeType: "כביש",
      participants: [{ fullName: "אורי כהן", phone: "", birthDate: "1990-05-01" }],
    });
    expect(result.participants[0].phone).toBeNull();
  });

  it("rejects a birth date in the future", () => {
    expect(
      detailsSchema.safeParse({ bikeType: "כביש", participants: [{ fullName: "אורי כהן", phone: "", birthDate: "2999-01-01" }] }).success,
    ).toBe(false);
  });
});
