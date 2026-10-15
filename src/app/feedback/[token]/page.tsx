import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteContent } from "@/lib/content/get";
import { getFeedbackOrder } from "@/lib/db/feedback";
import { hasDatabase } from "@/lib/db/pool";
import { turnstileSiteKey } from "@/lib/env/public";
import { tokenSecret } from "@/lib/env/server";
import { firstName, formatLongDate } from "@/lib/format";
import { verifySignedToken } from "@/lib/security/signed-token";

export const metadata: Metadata = { title: "משוב על יום הקהילה", robots: { index: false, follow: false } };

export default async function FeedbackPage({ params }: PageProps<"/feedback/[token]">) {
  const { token } = await params;
  const orderId = hasDatabase ? verifySignedToken("feedback", token, tokenSecret) : null;
  const order = orderId ? await getFeedbackOrder(orderId) : null;
  if (!order || order.status !== "paid" || !order.requested) notFound();
  const { event, settings } = await getSiteContent();

  return (
    <>
      <Header showCta={false} />
      <main id="main" className="section pt-10">
        <div className="container-x max-w-2xl">
          <h1 className="text-h2">{firstName(order.full_name)}, איך היה?</h1>
          <p className="mt-3 text-lead">
            {event.title} של <bdi dir="ltr">RideWithYoav</bdi>, <bdi>{formatLongDate(event.date)}</bdi>.
          </p>
          <div className="mt-8">
            {order.answered ? (
              <p role="status" className="rounded-lg bg-cream-deep p-6 text-lead font-semibold">
                המשוב שלך כבר אצלנו. תודה!
              </p>
            ) : (
              <FeedbackForm token={token} turnstileKey={turnstileSiteKey()} />
            )}
          </div>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
