import type { PublicAvailability } from "@/lib/checkout/service";
import type { SiteContent } from "@/lib/content/types";
import { inPlace } from "@/lib/format";

export function eventJsonLd(content: SiteContent, availability: PublicAvailability, siteUrl: string) {
  const { event, settings } = content;
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${event.title} · RideWithYoav`,
    startDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.meetingPoint ?? event.region, address: { "@type": "PostalAddress", addressRegion: event.region, addressCountry: "IL" } },
    image: event.heroImage ? [event.heroImage.url] : undefined,
    description: `יום רכיבה מודרך ${inPlace(event.region)} עם ${event.capacity} רוכבים מהקהילה. ארוחות, סדנת טכניקה וצלם שרוכב איתכם — כלולים.`,
    organizer: { "@type": "Person", name: "יואב לוי", url: siteUrl },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/register`,
      price: (event.priceAgorot / 100).toFixed(2),
      priceCurrency: "ILS",
      availability: availability.seatsLeft > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    maximumAttendeeCapacity: event.capacity,
    remainingAttendeeCapacity: availability.seatsLeft,
    sameAs: settings.instagramUrl ?? undefined,
  };
}

/**
 * JSON-LD is data, not markup: JSON.stringify output with "<" escaped cannot open a tag,
 * so DOMPurify (an HTML sanitiser) does not apply here.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
