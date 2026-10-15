/** Preference only. Never store tokens, prices or personal data in localStorage. */
export const CONSENT_STORAGE_KEY = "rwy_consent_v1";
export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}
