import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/content/get";
import { claimFeedbackRecipients } from "@/lib/db/feedback";
import { hasDatabase } from "@/lib/db/pool";
import { serverEnv, siteUrl, tokenSecret } from "@/lib/env/server";
import { FEEDBACK_LINK_DAYS, isFeedbackDue } from "@/lib/feedback/schedule";
import { sendFeedbackRequest } from "@/lib/notify/email";
import { reportBlocked, reportError } from "@/lib/observability/report";
import { createSignedToken, timingSafeEqualString } from "@/lib/security/signed-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 100;

/** Vercel Cron, once a day. Sends the single post-event feedback email to every paid order. */
export async function GET(request: Request) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return new NextResponse(null, { status: 404 });
  if (!timingSafeEqualString(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    reportBlocked("origin", "cron_feedback");
    return new NextResponse(null, { status: 401 });
  }
  if (!hasDatabase) return NextResponse.json({ sent: 0, reason: "no_database" });

  const { event, settings } = await getSiteContent();
  if (!isFeedbackDue(event.date, new Date())) return NextResponse.json({ sent: 0, reason: "not_due" });

  try {
    const recipients = await claimFeedbackRecipients(BATCH);
    for (const order of recipients) {
      const token = createSignedToken("feedback", order.id, FEEDBACK_LINK_DAYS * 86_400, tokenSecret);
      await sendFeedbackRequest(order.email, order.full_name, event, settings, `${siteUrl}/feedback/${token}`);
    }
    return NextResponse.json({ sent: recipients.length });
  } catch (error) {
    reportError("cron_feedback", error);
    return new NextResponse(null, { status: 500 });
  }
}
