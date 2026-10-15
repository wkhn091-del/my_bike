"use server";

import { after } from "next/server";
import { getFeedbackOrder, insertFeedback } from "@/lib/db/feedback";
import { hasDatabase } from "@/lib/db/pool";
import { tokenSecret } from "@/lib/env/server";
import { notifyFeedback } from "@/lib/notify/email";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";
import { requestContext } from "@/lib/security/request";
import { verifySignedToken } from "@/lib/security/signed-token";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { feedbackSchema, fieldErrors } from "@/lib/validation/forms";

export type FeedbackState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "error"; message: string };

const TEN_MINUTES = 10 * 60_000;
const BAD_LINK = "הקישור לא תקף. אפשר לכתוב ליואב בוואטסאפ";

/** Authorization is the signed feedback token, checked here on the server for every submission. */
export async function feedbackAction(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const { ip, sameOrigin } = await requestContext();
  if (!sameOrigin) {
    reportBlocked("origin", "feedback");
    return { status: "error", message: "משהו השתבש. אפשר לנסות שוב" };
  }

  const orderId = hasDatabase ? verifySignedToken("feedback", String(formData.get("token") ?? ""), tokenSecret) : null;
  if (!orderId) return { status: "error", message: BAD_LINK };

  const [ipOk, orderOk] = await Promise.all([
    rateLimit(`feedback:ip:${await hashKey(ip)}`, 5, TEN_MINUTES),
    rateLimit(`feedback:order:${await hashKey(orderId)}`, 3, TEN_MINUTES),
  ]);
  if (!ipOk || !orderOk) {
    reportBlocked("rate_limit", "feedback");
    return { status: "error", message: "רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה" };
  }

  const parsed = feedbackSchema.safeParse({
    rating: formData.get("rating") ?? "",
    message: formData.get("message") ?? "",
    publish: formData.get("publish") ?? undefined,
  });
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };

  if (!(await verifyTurnstile(formData, "feedback", ip))) {
    reportBlocked("turnstile", "feedback");
    return { status: "error", message: "לא הצלחנו לוודא שאתם לא רובוט. אפשר ללחוץ שוב" };
  }

  try {
    const order = await getFeedbackOrder(orderId);
    if (!order || order.status !== "paid" || !order.requested) return { status: "error", message: BAD_LINK };
    const { rating, message, publish } = parsed.data;
    const saved = await insertFeedback(order.id, rating, message, publish);
    if (saved) after(() => notifyFeedback(order.full_name, rating, message, publish));
    return { status: "ok" };
  } catch (error) {
    reportError("feedback", error);
    return { status: "error", message: "משהו השתבש אצלנו. המשוב לא נשמר, ואפשר ללחוץ שוב" };
  }
}
