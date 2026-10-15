"use server";

import { insertCoachingLead, insertWaitlist } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db/pool";
import { notifyLead } from "@/lib/notify/email";
import { appendRow } from "@/lib/notify/sheets";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";
import { requestContext } from "@/lib/security/request";
import { verifyTurnstile, type TurnstileAction } from "@/lib/security/turnstile";
import { coachingSchema, fieldErrors, waitlistSchema } from "@/lib/validation/forms";

export type LeadState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "error"; message: string };

const TEN_MINUTES = 10 * 60_000;

async function guard(formData: FormData, action: TurnstileAction, phone: string): Promise<LeadState | null> {
  const { ip, sameOrigin } = await requestContext();
  if (!sameOrigin) {
    reportBlocked("origin", action);
    return { status: "error", message: "משהו השתבש. אפשר לנסות שוב" };
  }
  const [ipOk, phoneOk] = await Promise.all([
    rateLimit(`${action}:ip:${await hashKey(ip)}`, 5, TEN_MINUTES),
    rateLimit(`${action}:phone:${await hashKey(phone)}`, 3, TEN_MINUTES),
  ]);
  if (!ipOk || !phoneOk) {
    reportBlocked("rate_limit", action);
    return { status: "error", message: "רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה" };
  }
  if (!(await verifyTurnstile(formData, action, ip))) {
    reportBlocked("turnstile", action);
    return { status: "error", message: "לא הצלחנו לוודא שאתם לא רובוט. אפשר ללחוץ שוב" };
  }
  return null;
}

export async function coachingAction(_previous: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = coachingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };
  const blocked = await guard(formData, "coaching", parsed.data.phone);
  if (blocked) return blocked;

  try {
    const { fullName, phone, marketing, source } = parsed.data;
    const sourceLabel = source === "thank_you" ? "עמוד התודה (קנה/תה כרטיס)" : "דף הבית";
    if (hasDatabase) await insertCoachingLead(fullName, phone, marketing, source);
    await Promise.all([
      notifyLead("coaching", { שם: fullName, טלפון: phone, דיוור: marketing ? "כן" : "לא", מקור: sourceLabel }),
      appendRow("ליווי", [new Date().toISOString(), fullName, phone, marketing ? "כן" : "לא", sourceLabel]),
    ]);
    return { status: "ok" };
  } catch (error) {
    reportError("coaching-lead", error);
    return { status: "error", message: "משהו השתבש אצלנו. אפשר לנסות שוב או לכתוב ליואב בוואטסאפ" };
  }
}

export async function waitlistAction(_previous: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = waitlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };
  const blocked = await guard(formData, "waitlist", parsed.data.phone);
  if (blocked) return blocked;

  try {
    const { fullName, phone, email, quantity } = parsed.data;
    if (hasDatabase) await insertWaitlist(fullName, phone, email, quantity);
    await Promise.all([
      notifyLead("waitlist", { שם: fullName, טלפון: phone, מייל: email, כמות: String(quantity) }),
      appendRow("המתנה", [new Date().toISOString(), fullName, phone, email, quantity]),
    ]);
    return { status: "ok" };
  } catch (error) {
    reportError("waitlist", error);
    return { status: "error", message: "משהו השתבש אצלנו. אפשר לנסות שוב" };
  }
}
