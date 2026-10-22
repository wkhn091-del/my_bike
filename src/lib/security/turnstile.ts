import "server-only";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import { reportError } from "@/lib/observability/report";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export const TURNSTILE_FIELD = "cf-turnstile-response";
export type TurnstileAction = "checkout" | "coaching" | "waitlist" | "feedback" | "details" | "consent";

const tokenSchema = z.string().min(1).max(2048);

const verifySchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

/**
 * Without a secret: Preview/Production always fail closed.
 * Local/CI may skip only when NODE_ENV is development|test, or TURNSTILE_BYPASS=1.
 * Cloudflare outages fail closed when a secret is configured.
 */
export async function verifyTurnstile(formData: FormData, expectedAction: TurnstileAction, ip: string): Promise<boolean> {
  const secretKey = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (serverEnv.VERCEL_ENV === "production" || serverEnv.VERCEL_ENV === "preview") {
      return false;
    }
    return (
      serverEnv.NODE_ENV === "development" ||
      serverEnv.NODE_ENV === "test" ||
      process.env.TURNSTILE_BYPASS === "1"
    );
  }

  const token = tokenSchema.safeParse(formData.get(TURNSTILE_FIELD));
  if (!token.success) return false;

  const body = new URLSearchParams({ secret: secretKey, response: token.data, idempotency_key: crypto.randomUUID() });
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!response.ok) throw new Error(`Turnstile siteverify responded ${response.status}`);
    const result = verifySchema.parse(await response.json());
    return result.success && result.action === expectedAction;
  } catch (error) {
    reportError("turnstile", error);
    return false;
  }
}
