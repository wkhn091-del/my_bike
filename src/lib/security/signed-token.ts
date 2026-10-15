import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compact HMAC-signed tokens for links sent by email or shown after payment:
 * `<purpose>.<id>.<expiresAtSeconds>.<signature>`. The purpose is part of the signed payload,
 * so a thank-you token can never be replayed as a parent-consent token.
 */
export type TokenPurpose = "order" | "consent" | "feedback";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSignedToken(purpose: TokenPurpose, id: string, ttlSeconds: number, secret: string, now = Date.now()): string {
  if (!UUID.test(id)) throw new Error("Signed tokens carry UUIDs only");
  const expires = Math.floor(now / 1000) + ttlSeconds;
  const payload = `${purpose}.${id}.${expires}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the id when the token is authentic, unexpired and for this purpose; otherwise null. */
export function verifySignedToken(purpose: TokenPurpose, token: string, secret: string, now = Date.now()): string | null {
  if (token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [tokenPurpose, id, expires, signature] = parts;
  if (tokenPurpose !== purpose || !UUID.test(id) || !/^\d{10}$/.test(expires)) return null;

  const expected = Buffer.from(sign(`${tokenPurpose}.${id}.${expires}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) * 1000 < now) return null;
  return id;
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
