import "server-only";
import type { AnalyticsIds } from "@/components/layout/ConsentAndAnalytics";

/** Public IDs are read on the server and passed down as props, after a format check. */
function match(value: string | undefined, pattern: RegExp): string | null {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : null;
}

export function analyticsIds(): AnalyticsIds {
  return {
    ga: match(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]{4,16}$/),
    pixel: match(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{10,20}$/),
    clarity: match(process.env.NEXT_PUBLIC_CLARITY_ID, /^[a-z0-9]{6,20}$/),
  };
}

export function turnstileSiteKey(): string | null {
  return match(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, /^[0-9A-Za-z_-]{10,128}$/);
}
