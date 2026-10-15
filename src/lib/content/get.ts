import "server-only";
import { draftMode } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { reportError } from "@/lib/observability/report";
import { CONTENT_TAG, sanityFresh, sanityPreview, sanityPublished } from "@/lib/sanity/client";
import { COUPON_QUERY, SITE_CONTENT_QUERY } from "@/lib/sanity/queries";
import type { CouponRecord } from "@/lib/pricing/calculate";
import { fallbackContent } from "./fallback";
import type { SiteContent, SiteImage } from "./types";

const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => value || null);
const shekels = z.number().int().min(0).max(100_000).nullish();

const imageSchema = z
  .object({
    url: z.url().nullish(),
    alt: z.string().max(200).nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
    lqip: z.string().max(4000).nullish(),
  })
  .nullish()
  .transform((image): SiteImage | null =>
    image?.url && image.width && image.height
      ? { url: image.url, alt: image.alt ?? "", width: image.width, height: image.height, lqip: image.lqip ?? null }
      : null,
  );

const rawSchema = z.object({
  settings: z
    .object({
      legalName: text(120),
      vatNumber: text(20),
      address: text(200),
      phone: text(20),
      whatsapp: text(20),
      email: text(120),
      answeringHours: text(120),
      accessibility: z.object({ name: text(80), phone: text(20), email: text(120) }).nullish(),
      instagramUrl: text(200),
      facebookUrl: text(200),
      stravaUrl: text(200),
      youtubeUrl: text(200),
      instagramFollowers: text(20),
      followersAsOf: text(10),
      coachingText: text(400),
      coachingResponseDays: z.number().int().min(1).max(30).nullish(),
      healthDeclaration: text(4000),
      google: z
        .object({
          rating: z.number().min(1).max(5).nullish(),
          reviewCount: z.number().int().min(1).max(100_000).nullish(),
          profileUrl: text(300),
          checkedAt: text(10),
        })
        .nullish(),
      pastEdition: z
        .object({
          riders: z.number().int().min(1).max(1000).nullish(),
          soldOut: z.boolean().nullish(),
          date: text(10),
        })
        .nullish(),
      credentials: z
        .array(z.object({ title: text(80), issuer: text(80), year: z.number().int().min(1980).max(2100).nullish(), url: text(300) }))
        .max(6)
        .nullish(),
    })
    .nullish(),
  event: z
    .object({
      title: text(60),
      date: text(10),
      rainDate: text(10),
      region: text(60),
      meetingPoint: text(200),
      parking: text(200),
      priceShekels: shekels,
      capacity: z.number().int().min(1).max(500).nullish(),
      earlyPriceShekels: shekels,
      earlySeats: z.number().int().min(0).max(500).nullish(),
      friendDiscountShekels: shekels,
      salesOpen: z.boolean().nullish(),
      schedule: z.array(z.object({ time: text(10), title: text(120), detail: text(200) })).max(20).nullish(),
      included: z.array(z.string().trim().max(160)).max(20).nullish(),
      route: z
        .object({
          km: z.number().min(0).max(400).nullish(),
          elevationM: z.number().min(0).max(8000).nullish(),
          terrain: text(80),
          bikes: text(160),
          fitText: text(300),
          paceText: text(300),
          stravaUrl: text(300),
        })
        .nullish(),
      photosDelivery: text(160),
      safety: text(600),
      heroImage: imageSchema,
      yoavImages: z.array(imageSchema).max(4).nullish(),
    })
    .nullish(),
  testimonials: z
    .array(z.object({ name: text(60), quote: text(220), image: imageSchema, verifiedParticipant: z.boolean().nullish() }))
    .nullish(),
  faq: z.array(z.object({ question: text(160), answer: text(1200) })).nullish(),
  gallery: z.array(imageSchema).nullish(),
});

function isHttps(url: string | null): string | null {
  return url && url.startsWith("https://") ? url : null;
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function mapContent(raw: unknown): SiteContent {
  const data = rawSchema.parse(raw);
  const fb = fallbackContent;
  const s = data.settings;
  const e = data.event;

  const priceAgorot = e?.priceShekels ? e.priceShekels * 100 : fb.event.priceAgorot;
  const earlyPrice = e?.earlyPriceShekels ? e.earlyPriceShekels * 100 : null;

  return {
    settings: {
      brand: fb.settings.brand,
      legalName: s?.legalName ?? null,
      vatNumber: s?.vatNumber ?? null,
      address: s?.address ?? null,
      phone: s?.phone ?? fb.settings.phone,
      whatsapp: s?.whatsapp?.replace(/\D/g, "") || fb.settings.whatsapp,
      email: s?.email ?? fb.settings.email,
      answeringHours: s?.answeringHours ?? null,
      accessibility: {
        name: s?.accessibility?.name ?? fb.settings.accessibility.name,
        phone: s?.accessibility?.phone ?? fb.settings.accessibility.phone,
        email: s?.accessibility?.email ?? fb.settings.accessibility.email,
      },
      instagramUrl: isHttps(s?.instagramUrl ?? null),
      facebookUrl: isHttps(s?.facebookUrl ?? null),
      stravaUrl: isHttps(s?.stravaUrl ?? null),
      youtubeUrl: isHttps(s?.youtubeUrl ?? null),
      instagramFollowers: s?.instagramFollowers ?? null,
      followersAsOf: s?.followersAsOf ?? null,
      coachingText: s?.coachingText ?? fb.settings.coachingText,
      coachingResponseDays: s?.coachingResponseDays ?? null,
      healthDeclaration: s?.healthDeclaration ?? null,
      proof: {
        google:
          s?.google?.rating && s.google.reviewCount && isHttps(s.google.profileUrl) && isIsoDate(s.google.checkedAt)
            ? {
                rating: Math.round(s.google.rating * 10) / 10,
                reviewCount: s.google.reviewCount,
                profileUrl: s.google.profileUrl as string,
                checkedAt: s.google.checkedAt,
              }
            : null,
        pastEdition:
          s?.pastEdition?.riders && isIsoDate(s.pastEdition.date)
            ? { riders: s.pastEdition.riders, soldOut: s.pastEdition.soldOut ?? false, date: s.pastEdition.date }
            : null,
        credentials: (s?.credentials ?? [])
          .filter((item) => item.title)
          .map((item) => ({ title: item.title as string, issuer: item.issuer, year: item.year ?? null, url: isHttps(item.url) })),
      },
    },
    event: {
      title: e?.title ?? fb.event.title,
      date: isIsoDate(e?.date ?? null) ? (e!.date as string) : fb.event.date,
      rainDate: isIsoDate(e?.rainDate ?? null) ? (e!.rainDate as string) : null,
      region: e?.region ?? fb.event.region,
      meetingPoint: e?.meetingPoint ?? null,
      parking: e?.parking ?? null,
      priceAgorot,
      capacity: e?.capacity ?? fb.event.capacity,
      early: earlyPrice && earlyPrice < priceAgorot && e?.earlySeats ? { priceAgorot: earlyPrice, seats: e.earlySeats } : null,
      friendDiscountAgorot: e?.friendDiscountShekels ? e.friendDiscountShekels * 100 : null,
      salesOpen: e?.salesOpen ?? fb.event.salesOpen,
      schedule: (e?.schedule ?? [])
        .filter((item) => item.time && item.title)
        .map((item) => ({ time: item.time as string, title: item.title as string, detail: item.detail })),
      included: e?.included?.length ? e.included : fb.event.included,
      route: {
        km: e?.route?.km ?? null,
        elevationM: e?.route?.elevationM ?? null,
        terrain: e?.route?.terrain ?? null,
        bikes: e?.route?.bikes ?? null,
        fitText: e?.route?.fitText ?? null,
        paceText: e?.route?.paceText ?? null,
        stravaUrl: isHttps(e?.route?.stravaUrl ?? null),
      },
      photosDelivery: e?.photosDelivery ?? null,
      safety: e?.safety ?? null,
      heroImage: e?.heroImage ?? null,
      yoavImages: (e?.yoavImages ?? []).filter((image): image is SiteImage => image !== null),
    },
    testimonials: (data.testimonials ?? [])
      .filter((item) => item.name && item.quote)
      .map((item) => ({ name: item.name as string, quote: item.quote as string, image: item.image, verified: item.verifiedParticipant ?? false })),
    faq: data.faq?.length
      ? data.faq
          .filter((item) => item.question && item.answer)
          .map((item) => ({ question: item.question as string, answer: item.answer as string }))
      : fb.faq,
    gallery: (data.gallery ?? []).filter((image): image is SiteImage => image !== null),
  };
}

/** One fetch per request (React cache); across requests the Data Cache holds it until Sanity publishes. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!sanityPublished) return fallbackContent;

  let preview = false;
  try {
    preview = (await draftMode()).isEnabled;
  } catch {
    /* outside a request scope (build-time metadata) */
  }

  try {
    const raw =
      preview && sanityPreview
        ? await sanityPreview.fetch(SITE_CONTENT_QUERY, {}, { cache: "no-store" })
        : await sanityPublished.fetch(SITE_CONTENT_QUERY, {}, { cache: "force-cache", next: { tags: [CONTENT_TAG] } });
    return mapContent(raw);
  } catch (error) {
    reportError("content", error);
    return fallbackContent;
  }
});

const couponSchema = z
  .object({
    code: z.string().regex(/^[A-Z0-9]{3,20}$/),
    amountOffShekels: z.number().int().min(1).max(10_000),
    validUntil: z.string().nullish(),
    maxUses: z.number().int().min(1).nullish(),
    active: z.boolean().nullish(),
  })
  .nullable();

export async function getCoupon(code: string): Promise<CouponRecord | null> {
  if (!sanityFresh) return null;
  const parsed = couponSchema.safeParse(await sanityFresh.fetch(COUPON_QUERY, { code }, { cache: "no-store" }));
  if (!parsed.success || !parsed.data) return null;
  return {
    code: parsed.data.code,
    amountOffAgorot: parsed.data.amountOffShekels * 100,
    validUntil: parsed.data.validUntil ?? null,
    maxUses: parsed.data.maxUses ?? null,
    active: parsed.data.active ?? true,
  };
}
