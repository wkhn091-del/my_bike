import { describe, expect, it } from "vitest";
import { isFeedbackDue, israelDate } from "./schedule";

describe("feedback schedule", () => {
  it("uses the Israeli date, not UTC", () => {
    expect(israelDate(new Date("2027-01-08T22:30:00Z"))).toBe("2027-01-09");
    expect(israelDate(new Date("2027-01-08T21:30:00Z"))).toBe("2027-01-08");
  });

  it("is not due on the event day or before it", () => {
    expect(isFeedbackDue("2027-01-08", new Date("2027-01-08T15:00:00Z"))).toBe(false);
    expect(isFeedbackDue("2027-01-08", new Date("2027-01-01T08:00:00Z"))).toBe(false);
  });

  it("is due from the next morning for a week", () => {
    expect(isFeedbackDue("2027-01-08", new Date("2027-01-09T07:00:00Z"))).toBe(true);
    expect(isFeedbackDue("2027-01-08", new Date("2027-01-15T07:00:00Z"))).toBe(true);
    expect(isFeedbackDue("2027-01-08", new Date("2027-01-16T07:00:00Z"))).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(isFeedbackDue("8.1.2027", new Date("2027-01-09T07:00:00Z"))).toBe(false);
  });
});
