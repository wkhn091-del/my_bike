import "server-only";
import { headers } from "next/headers";

/**
 * Next.js rejects a Server Action whose Origin differs from the host, but lets a request with no
 * Origin header through. Browsers always send Origin on POST, so a missing one means a script.
 * Compares exact hosts (hostname + port), never `includes`.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.trim().toLowerCase();
  } catch {
    return false;
  }
}

export type RequestContext = { ip: string; sameOrigin: boolean };

/** Vercel sets x-real-ip; the first x-forwarded-for hop is the client elsewhere. */
export async function requestContext(): Promise<RequestContext> {
  const h = await headers();
  const ip = h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { ip, sameOrigin: isSameOrigin(h.get("origin"), h.get("x-forwarded-host") ?? h.get("host")) };
}
