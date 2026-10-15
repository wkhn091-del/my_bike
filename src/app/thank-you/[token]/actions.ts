"use server";

import { after } from "next/server";
import { readOrderToken } from "@/lib/checkout/service";
import { getSiteContent } from "@/lib/content/get";
import { getOrder, saveOrderDetails, type ParticipantInput } from "@/lib/db/orders";
import { siteUrl, tokenSecret } from "@/lib/env/server";
import { ageOn } from "@/lib/format";
import { sendParentConsentRequest } from "@/lib/notify/email";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";
import { requestContext } from "@/lib/security/request";
import { createSignedToken } from "@/lib/security/signed-token";
import { detailsSchema, fieldErrors, MESSAGES } from "@/lib/validation/forms";

export type DetailsState =
  | { status: "idle" }
  | { status: "ok"; minorsNotified: number }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "error"; message: string };

const ADULT_AGE = 18;
const MIN_AGE = 16;

function readParticipants(formData: FormData, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const prefix = `p${index + 1}_`;
    const value = (name: string) => String(formData.get(prefix + name) ?? "");
    return {
      fullName: value("fullName"),
      phone: value("phone"),
      birthDate: value("birthDate"),
      parentName: value("parentName"),
      parentPhone: value("parentPhone"),
      parentEmail: value("parentEmail"),
    };
  });
}

/** Authorization is the signed order token, checked here on the server for every submission. */
export async function detailsAction(_previous: DetailsState, formData: FormData): Promise<DetailsState> {
  const { ip, sameOrigin } = await requestContext();
  if (!sameOrigin) {
    reportBlocked("origin", "details");
    return { status: "error", message: "משהו השתבש. אפשר לנסות שוב" };
  }
  if (!(await rateLimit(`details:ip:${await hashKey(ip)}`, 10, 10 * 60_000))) {
    return { status: "error", message: "רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה" };
  }

  const orderId = readOrderToken(String(formData.get("token") ?? ""));
  const order = orderId ? await getOrder(orderId) : null;
  if (!order || order.status !== "paid") return { status: "error", message: "הקישור לא תקף. אפשר לכתוב ליואב בוואטסאפ" };

  const parsed = detailsSchema.safeParse({
    bikeType: formData.get("bikeType") ?? "",
    participants: readParticipants(formData, order.quantity),
  });
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };

  const { event } = await getSiteContent();
  const errors: Record<string, string> = {};
  const participants: ParticipantInput[] = parsed.data.participants.map((p, index) => {
    const age = ageOn(p.birthDate, event.date);
    if (age < MIN_AGE) errors[`participants.${index}.birthDate`] = MESSAGES.tooYoung;
    const minor = age < ADULT_AGE;
    if (minor && (!p.parentName || !p.parentPhone || !p.parentEmail)) {
      errors[`participants.${index}.parentEmail`] = "לרוכב מתחת לגיל 18 צריך שם, טלפון ומייל של הורה";
    }
    return {
      position: index + 1,
      fullName: p.fullName,
      phone: p.phone,
      birthDate: p.birthDate,
      parent: minor && p.parentName && p.parentPhone && p.parentEmail ? { name: p.parentName, phone: p.parentPhone, email: p.parentEmail } : null,
    };
  });
  if (Object.keys(errors).length) return { status: "invalid", fieldErrors: errors };

  try {
    const saved = await saveOrderDetails(order.id, parsed.data.bikeType, participants);
    const minors = participants.filter((p) => p.parent);
    const ttlSeconds = Math.max(86_400, Math.floor((new Date(`${event.date}T23:59:59+02:00`).getTime() - Date.now()) / 1000) + 86_400);
    after(async () => {
      for (const minor of minors) {
        const participantId = saved.find((row) => row.position === minor.position)?.id;
        if (!participantId || !minor.parent) continue;
        const token = createSignedToken("consent", participantId, ttlSeconds, tokenSecret);
        await sendParentConsentRequest(minor.parent.email, minor.parent.name, minor.fullName, event, `${siteUrl}/consent/${token}`);
      }
    });
    return { status: "ok", minorsNotified: minors.length };
  } catch (error) {
    reportError("details", error);
    return { status: "error", message: "משהו השתבש אצלנו. הפרטים לא נשמרו, ואפשר ללחוץ שוב" };
  }
}
