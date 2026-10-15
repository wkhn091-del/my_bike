"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CONSENT_STORAGE_KEY, readConsent, type Consent } from "@/lib/analytics/consent";

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function writeConsent(value: Consent) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    /* Private mode: the choice holds for this page view only. */
  }
  listeners.forEach((listener) => listener());
}

export type AnalyticsIds = { ga: string | null; pixel: string | null; clarity: string | null };

function addScript(id: string, src: string, nonce: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.nonce = nonce;
  script.src = src;
  document.head.appendChild(script);
}

/** Loaded from our nonced bundle, so the CSP's 'strict-dynamic' admits them. Runs only after consent. */
function loadAnalytics(ids: AnalyticsIds, nonce: string) {
  if (ids.ga) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // gtag.js reads the arguments object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", ids.ga, { anonymize_ip: true });
    addScript("ga-loader", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga)}`, nonce);
  }
  if (ids.pixel && !window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    }) as NonNullable<Window["fbq"]>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    fbq("init", ids.pixel);
    fbq("track", "PageView");
    addScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js", nonce);
  }
  if (ids.clarity && !window.clarity) {
    const clarity = ((...args: unknown[]) => {
      (clarity.q = clarity.q ?? []).push(args);
    }) as NonNullable<Window["clarity"]>;
    window.clarity = clarity;
    addScript("clarity", `https://www.clarity.ms/tag/${encodeURIComponent(ids.clarity)}`, nonce);
  }
}

/** Rule 8: nothing pops over the page in the first 10 seconds unless the visitor has started scrolling. */
const BANNER_DELAY_MS = 10_000;

function useBannerReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const show = () => setReady(true);
    const timer = window.setTimeout(show, BANNER_DELAY_MS);
    window.addEventListener("scroll", show, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", show);
    };
  }, [ready]);
  return ready;
}

export function ConsentAndAnalytics({ ids, nonce }: { ids: AnalyticsIds; nonce: string }) {
  const consent = useSyncExternalStore<Consent | null | "pending">(subscribe, readConsent, () => "pending");
  const bannerReady = useBannerReady();
  const hasAnyTool = Boolean(ids.ga || ids.pixel || ids.clarity);

  useEffect(() => {
    if (consent === "granted") loadAnalytics(ids, nonce);
  }, [consent, ids, nonce]);

  if (!hasAnyTool || consent !== null || !bannerReady) return null;

  return (
    <div
      role="region"
      aria-label="הסכמה לעוגיות"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 mx-auto max-w-xl rounded-lg border border-line bg-cream p-4 shadow-soft md:bottom-6 md:inset-x-auto md:start-6"
    >
      <p className="text-small">
        אנחנו משתמשים בעוגיות כדי להבין מה עובד באתר ולהציג פרסום רלוונטי.{" "}
        <Link href="/cookies" className="link">
          מדיניות עוגיות
        </Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => writeConsent("granted")} className="btn-secondary w-full">
          מאשר/ת
        </button>
        <button type="button" onClick={() => writeConsent("denied")} className="btn-secondary w-full">
          רק הכרחיות
        </button>
      </div>
    </div>
  );
}
