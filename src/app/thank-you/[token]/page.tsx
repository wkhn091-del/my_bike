import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoachingForm } from "@/components/home/CoachingForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Bib } from "@/components/thank-you/Bib";
import { DetailsForm, type ParticipantDefaults } from "@/components/thank-you/DetailsForm";
import { PaymentPending } from "@/components/thank-you/PaymentPending";
import { PurchaseTracker } from "@/components/thank-you/PurchaseTracker";
import { confirmFromCardcom, readOrderToken } from "@/lib/checkout/service";
import { getSiteContent } from "@/lib/content/get";
import { getOrder, getParticipants, type OrderRow } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db/pool";
import { turnstileSiteKey } from "@/lib/env/public";
import { serverEnv, siteUrl } from "@/lib/env/server";
import { firstName, formatShortDate, inPlace } from "@/lib/format";
import { reportError } from "@/lib/observability/report";

export const metadata: Metadata = {
  title: "אתם בפנים",
  robots: { index: false, follow: false },
};

async function loadOrder(token: string): Promise<OrderRow | null> {
  const orderId = readOrderToken(token);
  if (!orderId || !hasDatabase) return null;
  let order = await getOrder(orderId);
  if (order?.status === "held" && order.cardcom_low_profile_id && serverEnv.PAYMENTS_MODE !== "mock") {
    try {
      order = (await confirmFromCardcom(order.cardcom_low_profile_id)) ?? order;
    } catch (error) {
      reportError("thank-you-confirm", error);
    }
  }
  return order;
}

export default async function ThankYouPage({ params }: PageProps<"/thank-you/[token]">) {
  const { token } = await params;
  const order = await loadOrder(token);
  if (!order) notFound();
  const { event, settings } = await getSiteContent();

  if (order.status !== "paid") {
    return (
      <>
        <Header showCta={false} />
        <main id="main" className="section">
          <div className="container-x max-w-xl">
            {order.status === "held" ? (
              <PaymentPending whatsapp={settings.whatsapp} />
            ) : (
              <div className="text-center">
                <h1 className="text-h2">התשלום לא הושלם ולא חויבתם</h1>
                <p className="mt-4">
                  <Link href="/register" className="btn-primary">
                    לניסיון נוסף
                  </Link>
                </p>
              </div>
            )}
          </div>
        </main>
        <Footer settings={settings} />
      </>
    );
  }

  const participants = await getParticipants(order.id);
  const defaults: ParticipantDefaults[] = Array.from({ length: order.quantity }, (_, index) => {
    const row = participants.find((p) => p.position === index + 1);
    return {
      fullName: row?.full_name ?? (index === 0 ? order.full_name : ""),
      phone: row?.phone ?? "",
      birthDate: row?.birth_date ?? "",
      parentName: row?.parent_name ?? "",
      parentPhone: row?.parent_phone ?? "",
      parentEmail: row?.parent_email ?? "",
    };
  });
  const name = firstName(order.full_name);
  const shareText = `נרשמתי ל${event.title} של RideWithYoav ב-${formatShortDate(event.date)} ${inPlace(event.region)}. בא/ה איתי? ${siteUrl}`;

  return (
    <>
      <Header showCta={false} />
      <main id="main">
        <section className="section pt-10 md:pt-16">
          <div className="container-x max-w-2xl">
            <h1 className="text-center text-display">{name}, אתם בפנים!</h1>
            <div className="mt-10">
              <Bib
                firstName={name}
                seat={order.seat_start ?? 0}
                capacity={event.capacity}
                eventTitle={event.title}
                dateLabel={formatShortDate(event.date)}
                region={event.region}
                shareText={shareText}
              />
            </div>

            <h2 className="mt-14 text-h2">מה קורה עכשיו</h2>
            <ol className="mt-4 grid gap-3 text-lead">
              <li>אישור וחשבונית כבר בדרך למייל.</li>
              <li>{order.details_submitted_at ? "הפרטים שלכם נשמרו. אפשר לעדכן אותם למטה." : "עוד דקה: השלמת פרטים קצרה (כאן למטה)."}</li>
              <li>לפני האירוע נשלח מייל עם נקודת המפגש ומה להביא.</li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="details-title" className="section bg-cream-deep">
          <div className="container-x max-w-2xl">
            <h2 id="details-title" className="text-h2">
              השלמת פרטים
            </h2>
            <p className="mt-2 mb-8 text-charcoal-soft">סוג אופניים ופרטי הרוכבים. לוקח דקה.</p>
            <DetailsForm token={token} quantity={order.quantity} eventDate={event.date} bikeType={order.bike_type ?? ""} participants={defaults} />
          </div>
        </section>

        <section aria-labelledby="next-title" className="section">
          <div className="container-x grid items-start gap-10 md:grid-cols-2">
            <div>
              <h2 id="next-title" className="text-h2">
                רוצים להמשיך להתקדם גם אחרי?
              </h2>
              {settings.coachingText ? <p className="mt-4 text-lead">{settings.coachingText}</p> : null}
            </div>
            <CoachingForm
              turnstileKey={turnstileSiteKey()}
              responseDays={settings.coachingResponseDays}
              prefill={{ fullName: order.full_name, phone: order.phone }}
              source="thank_you"
            />
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <PurchaseTracker orderRef={order.id.slice(0, 8)} value={order.amount_agorot / 100} quantity={order.quantity} />
    </>
  );
}
