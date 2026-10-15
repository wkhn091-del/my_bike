"use client";

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

export type TrackEvent =
  | { name: "cta_click"; location: string }
  | { name: "whatsapp_click"; location: string }
  | { name: "begin_checkout"; value: number; quantity: number }
  | { name: "purchase"; value: number; quantity: number; transactionId: string }
  | { name: "generate_lead"; form: "coaching" | "coaching_thank_you" | "waitlist" }
  | { name: "scroll_depth"; percent: number }
  | { name: "share"; method: "whatsapp" | "story" | "calendar" };

/** No-op until the visitor consents (the loaders only define gtag / fbq after consent). Never send PII. */
export function track(event: TrackEvent): void {
  if (typeof window === "undefined") return;
  const { gtag, fbq } = window;

  switch (event.name) {
    case "begin_checkout":
      gtag?.("event", "begin_checkout", { currency: "ILS", value: event.value, items: [{ item_name: "יום הקהילה", quantity: event.quantity }] });
      fbq?.("track", "InitiateCheckout", { currency: "ILS", value: event.value, num_items: event.quantity });
      return;
    case "purchase":
      gtag?.("event", "purchase", {
        currency: "ILS",
        value: event.value,
        transaction_id: event.transactionId,
        items: [{ item_name: "יום הקהילה", quantity: event.quantity }],
      });
      fbq?.("track", "Purchase", { currency: "ILS", value: event.value, num_items: event.quantity }, { eventID: event.transactionId });
      return;
    case "generate_lead":
      gtag?.("event", "generate_lead", { form: event.form });
      fbq?.("track", "Lead", { content_name: event.form });
      return;
    case "cta_click":
    case "whatsapp_click":
      gtag?.("event", event.name, { location: event.location });
      if (event.name === "whatsapp_click") fbq?.("track", "Contact");
      return;
    case "scroll_depth":
      gtag?.("event", "scroll_depth", { percent: event.percent });
      return;
    case "share":
      gtag?.("event", "share", { method: event.method, content_type: "community_day" });
      return;
  }
}
