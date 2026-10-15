import { describe, expect, it } from "vitest";
import { pickHeroProof, REFUND_DAYS } from "./proof";
import type { Proof } from "./types";

const empty: Proof = { google: null, pastEdition: null, credentials: [] };
const now = new Date("2026-10-14T12:00:00Z");

describe("pickHeroProof", () => {
  it("falls back to risk reduction when nothing else is filled", () => {
    expect(pickHeroProof({ proof: empty, instagramFollowers: null, followersAsOf: null }, now)).toEqual({ kind: "riskReduction", refundDays: REFUND_DAYS });
  });

  it("prefers Google over every other proof", () => {
    const proof: Proof = {
      ...empty,
      google: { rating: 4.9, reviewCount: 37, profileUrl: "https://g.page/r/abc", checkedAt: "2026-10-01" },
      pastEdition: { riders: 64, soldOut: true, date: "2025-11-07" },
    };
    expect(pickHeroProof({ proof, instagramFollowers: "18K", followersAsOf: "2026-10-01" }, now)).toEqual({
      kind: "google",
      rating: 4.9,
      reviewCount: 37,
      href: "https://g.page/r/abc",
    });
  });

  it("uses the previous edition before followers", () => {
    const proof: Proof = { ...empty, pastEdition: { riders: 64, soldOut: false, date: "2025-11-07" } };
    expect(pickHeroProof({ proof, instagramFollowers: "18K", followersAsOf: "2026-10-01" }, now).kind).toBe("pastEdition");
  });

  it("shows followers only with a recent date", () => {
    expect(pickHeroProof({ proof: empty, instagramFollowers: "18K", followersAsOf: "2026-09-01" }, now)).toEqual({ kind: "followers", followers: "18K" });
    expect(pickHeroProof({ proof: empty, instagramFollowers: "18K", followersAsOf: "2026-05-21" }, now).kind).toBe("riskReduction");
    expect(pickHeroProof({ proof: empty, instagramFollowers: "18K", followersAsOf: null }, now).kind).toBe("riskReduction");
  });

  it("ignores a follower date in the future", () => {
    expect(pickHeroProof({ proof: empty, instagramFollowers: "18K", followersAsOf: "2027-01-01" }, now).kind).toBe("riskReduction");
  });
});
