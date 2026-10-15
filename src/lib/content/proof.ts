import type { SiteSettings } from "./types";

/** Years Yoav has been riding: confirmed in PROJECT_BRIEF.md section 2. */
export const YEARS_RIDING = 15;

/** Full refund up to this many days before the event: the cancellation policy in the terms and the FAQ. */
export const REFUND_DAYS = 14;

/** A follower count older than this is no longer a fact, so it stops showing. */
const FOLLOWERS_MAX_AGE_DAYS = 120;

export type HeroProof =
  | { kind: "google"; rating: number; reviewCount: number; href: string }
  | { kind: "pastEdition"; riders: number; soldOut: boolean }
  | { kind: "followers"; followers: string }
  | { kind: "riskReduction"; refundDays: number };

function isFresh(isoDate: string, maxAgeDays: number, now: Date): boolean {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const ageDays = (now.getTime() - date.getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= maxAgeDays;
}

/**
 * The strongest real proof that exists today, in the order of Script 2 module A iron rule 8:
 * Google reviews, then numbers from the previous edition, then a dated follower count, and finally
 * risk reduction (refund policy and a guide on the whole route), which is always true. The hero slot is therefore never empty.
 */
export function pickHeroProof(settings: Pick<SiteSettings, "proof" | "instagramFollowers" | "followersAsOf">, now = new Date()): HeroProof {
  const { google, pastEdition } = settings.proof;
  if (google) return { kind: "google", rating: google.rating, reviewCount: google.reviewCount, href: google.profileUrl };
  if (pastEdition) return { kind: "pastEdition", riders: pastEdition.riders, soldOut: pastEdition.soldOut };
  if (settings.instagramFollowers && settings.followersAsOf && isFresh(settings.followersAsOf, FOLLOWERS_MAX_AGE_DAYS, now)) {
    return { kind: "followers", followers: settings.instagramFollowers };
  }
  return { kind: "riskReduction", refundDays: REFUND_DAYS };
}

/** Testimonials appear only as a real group: one lonely quote reads as staged. */
export const MIN_TESTIMONIALS = 2;
