"use client";

import { CONSENT_STORAGE_KEY } from "@/lib/analytics/consent";

/** Clears stored cookie preference so the banner can appear again. */
export function CookieChoiceReset() {
  return (
    <button
      type="button"
      className="btn-secondary mt-4"
      onClick={() => {
        try {
          window.localStorage.removeItem(CONSENT_STORAGE_KEY);
        } catch {
          /* private mode */
        }
        window.location.reload();
      }}
    >
      לשנות בחירת עוגיות
    </button>
  );
}
