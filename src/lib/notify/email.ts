import "server-only";
import { Resend } from "resend";
import type { EventContent, SiteSettings } from "@/lib/content/types";
import type { OrderRow } from "@/lib/db/orders";
import { serverEnv } from "@/lib/env/server";
import { escapeHtml as e, firstName, formatLongDate, formatShekels, RIDING_LEVEL_LABEL } from "@/lib/format";
import { reportError } from "@/lib/observability/report";

const resend = serverEnv.RESEND_API_KEY ? new Resend(serverEnv.RESEND_API_KEY) : null;

function layout(body: string): string {
  return `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#F4EDE0;font-family:Arial,sans-serif;color:#1F211C">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;line-height:1.7;font-size:17px">${body}
<p style="margin-top:32px;font-size:14px;color:#4A4C45">RideWithYoav</p></div></body></html>`;
}

async function send(kind: string, to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  if (!resend) {
    console.info(`[mail:skipped] ${kind} (RESEND_API_KEY not set)`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: serverEnv.MAIL_FROM, to, subject, html, replyTo });
    if (error) throw new Error(`${error.name}: ${error.message}`);
  } catch (error) {
    reportError("email", error, { kind });
  }
}

export async function sendOrderConfirmation(order: OrderRow, event: EventContent, settings: SiteSettings, thankYouUrl: string): Promise<void> {
  const name = e(firstName(order.full_name));
  const seats = order.quantity === 1 ? "המקום שלך" : `${order.quantity} המקומות שלכם`;
  const html = layout(`
<h1 style="font-size:26px;margin:0 0 16px">${name}, אתם בפנים!</h1>
<p>${seats} ב${e(event.title)} שמור${order.quantity === 1 ? "" : "ים"}: ${e(formatLongDate(event.date))}, ${e(event.region)}.</p>
<p>שילמתם <bdi>${e(formatShekels(order.amount_agorot))}</bdi> כולל מע״מ. החשבונית נשלחת אליכם בנפרד מ-Cardcom.</p>
<p><strong>עוד צעד קטן:</strong> השלמת פרטים קצרה (סוג אופניים ופרטי החברים).</p>
<p><a href="${e(thankYouUrl)}" style="display:inline-block;background:#E07A2E;color:#1F211C;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:bold">להשלמת הפרטים</a></p>
<p style="font-size:15px">ביטול עד 14 יום לפני האירוע: החזר מלא. אחר כך אפשר להעביר את הכרטיס לחבר, בלי עמלה.<br>
שאלות? וואטסאפ או טלפון: <bdi>${e(settings.phone)}</bdi></p>`);
  await send("order_confirmation", order.email, `אתם בפנים! ${event.title}, ${formatLongDate(event.date)}`, html, settings.email);
}

export async function notifyOrderPaid(order: OrderRow, flags: { heldExpired: boolean }): Promise<void> {
  if (!serverEnv.NOTIFY_EMAIL) return;
  const warning = flags.heldExpired
    ? `<p style="color:#A3261B"><strong>שימו לב:</strong> התשלום הגיע אחרי שתם זמן השמירה. לבדוק שלא עברנו את מספר המקומות.</p>`
    : "";
  const html = layout(`
<h1 style="font-size:22px;margin:0 0 16px">הזמנה חדשה: ${order.quantity} ${order.quantity === 1 ? "כרטיס" : "כרטיסים"}</h1>${warning}
<p>שם: ${e(order.full_name)}<br>טלפון: <bdi>${e(order.phone)}</bdi><br>מייל: <bdi>${e(order.email)}</bdi><br>
רמה: ${RIDING_LEVEL_LABEL[order.riding_level]}<br>סכום: <bdi>${e(formatShekels(order.amount_agorot))}</bdi>${order.coupon_code ? ` (קוד ${e(order.coupon_code)})` : ""}<br>
מקומות: <bdi>${order.seat_start ?? "?"}</bdi>${order.quantity > 1 ? `–<bdi>${(order.seat_start ?? 0) + order.quantity - 1}</bdi>` : ""}<br>
דיוור: ${order.marketing_opt_in ? "כן" : "לא"}</p>`);
  await send("order_notify", serverEnv.NOTIFY_EMAIL, `הזמנה חדשה ליום הקהילה (${order.quantity})`, html);
}

export async function sendParentConsentRequest(
  parentEmail: string,
  parentName: string,
  riderName: string,
  event: EventContent,
  consentUrl: string,
): Promise<void> {
  const html = layout(`
<h1 style="font-size:24px;margin:0 0 16px">שלום ${e(firstName(parentName))},</h1>
<p>${e(riderName)} נרשם/ה ל${e(event.title)} של RideWithYoav: ${e(formatLongDate(event.date))}, ${e(event.region)}.</p>
<p>רוכבים מתחת לגיל 18 משתתפים רק עם אישור הורה. האישור לוקח דקה:</p>
<p><a href="${e(consentUrl)}" style="display:inline-block;background:#E07A2E;color:#1F211C;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:bold">לקריאה ולאישור</a></p>
<p style="font-size:15px">הקישור אישי ותקף עד יום האירוע.</p>`);
  await send("parent_consent", parentEmail, `אישור הורה: ${riderName} ב${event.title}`, html);
}

/** No discount, raffle or gift for answering: the review stays honest and legal to publish. */
export async function sendFeedbackRequest(
  to: string,
  fullName: string,
  event: EventContent,
  settings: SiteSettings,
  feedbackUrl: string,
): Promise<void> {
  const html = layout(`
<h1 style="font-size:24px;margin:0 0 16px">${e(firstName(fullName))}, תודה שרכבת איתנו</h1>
<p>איך היה ב${e(event.title)}? שתי שאלות קצרות: דירוג וכמה מילים. זה עוזר לנו לשפר את היום הבא.</p>
<p><a href="${e(feedbackUrl)}" style="display:inline-block;background:#E07A2E;color:#1F211C;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:bold">לכתוב משוב</a></p>
<p style="font-size:15px">הקישור אישי ותקף ל-30 יום. בלי הטבה ובלי התחייבות: כותבים רק אם בא לכם.<br>
נפרסם ציטוט רק אם תסמנו שמותר.</p>`);
  await send("feedback_request", to, `איך היה ב${event.title}?`, html, settings.email);
}

export async function notifyFeedback(fullName: string, rating: number, message: string, publishConsent: boolean): Promise<void> {
  if (!serverEnv.NOTIFY_EMAIL) return;
  const html = layout(`
<h1 style="font-size:22px;margin:0 0 16px">משוב חדש: <bdi>${rating}</bdi> מתוך <bdi>5</bdi></h1>
<p>שם: ${e(fullName)}<br>מותר לפרסם: ${publishConsent ? "כן" : "לא"}</p>
<p style="white-space:pre-wrap;background:#fff;padding:16px;border-radius:12px">${e(message)}</p>
${publishConsent ? `<p style="font-size:15px">לפרסום: להעתיק ל-Studio תחת "המלצות", מקור "משתתף/ת ביום קהילה קודם", לסמן "הגיעה מטופס המשוב של הזמנה ששולמה" ו"יש אישור בכתב לפרסם" (איפה האישור שמור: טופס המשוב באתר).</p>` : ""}`);
  await send("feedback_notify", serverEnv.NOTIFY_EMAIL, `משוב חדש מיום הקהילה (${rating}/5)`, html);
}

export async function notifyLead(kind: "coaching" | "waitlist", fields: Record<string, string>): Promise<void> {
  if (!serverEnv.NOTIFY_EMAIL) return;
  const title = kind === "coaching" ? "פנייה חדשה לליווי שנתי" : "הצטרפות לרשימת ההמתנה";
  const rows = Object.entries(fields)
    .map(([label, value]) => `${e(label)}: <bdi>${e(value)}</bdi>`)
    .join("<br>");
  await send(kind, serverEnv.NOTIFY_EMAIL, title, layout(`<h1 style="font-size:22px;margin:0 0 16px">${title}</h1><p>${rows}</p>`));
}

/** Staff ping when a parent consent lands — review if the signer looks off. */
export async function notifyParentConsent(riderName: string, signedName: string, expectedParentName: string | null): Promise<void> {
  if (!serverEnv.NOTIFY_EMAIL) return;
  const html = layout(`
<h1 style="font-size:22px;margin:0 0 16px">אישור הורה חדש</h1>
<p>רוכב/ת: ${e(riderName)}<br>
שם חתום: ${e(signedName)}<br>
שם הורה בהזמנה: ${e(expectedParentName ?? "—")}</p>
<p style="font-size:15px">אם השם לא נראה תואם — בדקו מול המשפחה לפני האירוע.</p>`);
  await send("consent_notify", serverEnv.NOTIFY_EMAIL, `אישור הורה: ${riderName}`, html);
}
