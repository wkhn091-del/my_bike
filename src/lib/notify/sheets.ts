import "server-only";
import { createSign } from "node:crypto";
import { serverEnv } from "@/lib/env/server";
import { reportError } from "@/lib/observability/report";

/**
 * Appends a row to Yoav's private Google Sheet through a service account (no SDK: one signed JWT).
 * Tabs: "הזמנות", "ליווי", "המתנה". The sheet is shared with the service account email only + Yoav.
 */
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const email = serverEnv.GOOGLE_SA_EMAIL as string;
  const key = (serverEnv.GOOGLE_SA_PRIVATE_KEY as string).replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status}`);
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/** RAW input already stops formulas; the quote prefix keeps a pasted copy safe in Excel too. */
export function sheetSafe(value: string | number | boolean | null): string {
  if (value === null) return "";
  const text = String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export type SheetTab = "הזמנות" | "ליווי" | "המתנה";

export async function appendRow(tab: SheetTab, values: Array<string | number | boolean | null>): Promise<void> {
  if (!serverEnv.GOOGLE_SHEET_ID || !serverEnv.GOOGLE_SA_EMAIL) return;
  try {
    const range = encodeURIComponent(`${tab}!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${serverEnv.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [values.map(sheetSafe)] }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Sheets append failed: ${response.status}`);
  } catch (error) {
    reportError("sheets", error, { tab });
  }
}
