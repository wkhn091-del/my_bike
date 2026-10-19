/** Preference only. Never store tokens, prices or personal data in localStorage. */
export const CONSENT_STORAGE_KEY = "rwy_consent_v1";

/** denied = essential only; measure = GA/Clarity; granted = measure + advertising pixel. */
export type Consent = "granted" | "measure" | "denied";

export function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "measure" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
