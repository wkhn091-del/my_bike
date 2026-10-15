"use server";

import { getParticipantForConsent, recordParentConsent } from "@/lib/db/orders";
import { tokenSecret } from "@/lib/env/server";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";
import { requestContext } from "@/lib/security/request";
import { verifySignedToken } from "@/lib/security/signed-token";
import { consentSchema, fieldErrors } from "@/lib/validation/forms";

export type ConsentState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "error"; message: string };

export async function consentAction(_previous: ConsentState, formData: FormData): Promise<ConsentState> {
  const { ip, sameOrigin } = await requestContext();
  if (!sameOrigin) {
    reportBlocked("origin", "consent");
    return { status: "error", message: "משהו השתבש. אפשר לנסות שוב" };
  }
  if (!(await rateLimit(`consent:ip:${await hashKey(ip)}`, 10, 10 * 60_000))) {
    return { status: "error", message: "רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה" };
  }

  const participantId = verifySignedToken("consent", String(formData.get("token") ?? ""), tokenSecret);
  const participant = participantId ? await getParticipantForConsent(participantId) : null;
  if (!participant || participant.order_status !== "paid") return { status: "error", message: "הקישור לא תקף או שפג תוקפו" };
  if (participant.parent_consent_at) return { status: "ok" };

  const parsed = consentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrors(parsed.error) };

  try {
    await recordParentConsent(participant.id, parsed.data.signedName);
    return { status: "ok" };
  } catch (error) {
    reportError("consent", error);
    return { status: "error", message: "משהו השתבש אצלנו. אפשר ללחוץ שוב" };
  }
}
