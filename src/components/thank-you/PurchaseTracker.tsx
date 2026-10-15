"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

function alreadySent(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Fires the purchase conversion once per order per browser session. The id is a non-personal order prefix. */
export function PurchaseTracker({ orderRef, value, quantity }: { orderRef: string; value: number; quantity: number }) {
  useEffect(() => {
    const key = `rwy_purchase_${orderRef}`;
    if (alreadySent(key)) return;
    // Analytics loads after consent; give the loader a moment before sending.
    const timer = window.setTimeout(() => {
      if (alreadySent(key)) return;
      try {
        window.sessionStorage.setItem(key, "1");
      } catch {
        /* storage blocked: tracking twice is better than never */
      }
      track({ name: "purchase", value, quantity, transactionId: orderRef });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [orderRef, value, quantity]);
  return null;
}
