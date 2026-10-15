import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteContent } from "@/lib/content/get";
import { getParticipantForConsent } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db/pool";
import { tokenSecret } from "@/lib/env/server";
import { formatLongDate } from "@/lib/format";
import { verifySignedToken } from "@/lib/security/signed-token";

export const metadata: Metadata = { title: "אישור הורה", robots: { index: false, follow: false } };

export default async function ConsentPage({ params }: PageProps<"/consent/[token]">) {
  const { token } = await params;
  const participantId = hasDatabase ? verifySignedToken("consent", token, tokenSecret) : null;
  const participant = participantId ? await getParticipantForConsent(participantId) : null;
  if (!participant || participant.order_status !== "paid") notFound();
  const { event, settings } = await getSiteContent();

  return (
    <>
      <Header showCta={false} />
      <main id="main" className="section pt-10">
        <div className="container-x max-w-2xl">
          <h1 className="text-h2">אישור הורה: {participant.full_name}</h1>
          <p className="mt-3 text-lead">
            {event.title} של <bdi dir="ltr">RideWithYoav</bdi>, <bdi>{formatLongDate(event.date)}</bdi>, {event.region}.
          </p>

          {participant.parent_consent_at ? (
            <p role="status" className="mt-8 rounded-lg bg-cream-deep p-6 text-lead font-semibold">
              האישור התקבל. תודה!
            </p>
          ) : (
            <>
              <div className="mt-8 grid gap-4 rounded-lg border border-line p-6">
                <h2 className="text-h3">מה מאשרים</h2>
                <p>
                  השתתפות ביום רכיבה מודרך בשטח, לפי{" "}
                  <Link href="/terms" target="_blank" className="link">
                    תנאי ההשתתפות
                  </Link>
                  . חבישת קסדה חובה לאורך כל הרכיבה.
                </p>
                <h2 className="text-h3" id="health">
                  הצהרת בריאות
                </h2>
                {settings.healthDeclaration ? (
                  settings.healthDeclaration.split(/\n{2,}/).map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)
                ) : (
                  <p>
                    הנוסח המלא מופיע ב
                    <Link href="/terms#health" target="_blank" className="link">
                      תנאי ההשתתפות
                    </Link>
                    .
                  </p>
                )}
              </div>
              <div className="mt-8">
                <ConsentForm token={token} />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
