import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RegisterForm, type Prefill } from "@/components/register/RegisterForm";
import { WaitlistForm } from "@/components/register/WaitlistForm";
import { buildQuote, getAvailability, readOrderToken, salesAreOpen } from "@/lib/checkout/service";
import { getSiteContent } from "@/lib/content/get";
import { getOrder } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db/pool";
import { turnstileSiteKey } from "@/lib/env/public";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "הרשמה",
  description: "שומרים לכם מקום ביום הקהילה. 2 דקות, 4 פרטים.",
  alternates: { canonical: "/register" },
};

async function readRetry(params: Record<string, string | string[] | undefined>) {
  if (params.status !== "failed" || typeof params.t !== "string" || !hasDatabase) return null;
  const orderId = readOrderToken(params.t);
  if (!orderId) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status === "paid") redirect(`/thank-you/${params.t}`);
  if (order.status !== "held") return null;
  const minutesLeft = Math.max(0, Math.ceil((order.hold_expires_at.getTime() - Date.now()) / 60_000));
  const prefill: Prefill = {
    quantity: order.quantity,
    fullName: order.full_name,
    phone: order.phone,
    email: order.email,
    ridingLevel: order.riding_level,
    coupon: order.coupon_code ?? "",
  };
  return { orderId, token: params.t, minutesLeft, prefill };
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const { event, settings } = await getSiteContent();
  const availability = await getAvailability(event);
  const open = salesAreOpen(event);
  const retry = await readRetry(params);
  const soldOut = availability.seatsLeft === 0 && !retry;

  return (
    <>
      <Header showCta={false} />
      <main id="main" className="section pt-8 md:pt-16">
        <div className="container-x max-w-2xl">
          {!open || soldOut ? (
            <>
              <h1 className="text-h2">{soldOut ? `כל ${event.capacity} המקומות נתפסו` : "ההרשמה עוד לא נפתחה"}</h1>
              <p className="mt-3 text-lead">
                {soldOut
                  ? "אפשר להצטרף לרשימת ההמתנה, ואם מתפנה מקום נודיע ראשונים."
                  : "השאירו פרטים, ונעדכן אתכם ראשונים כשההרשמה נפתחת."}
              </p>
              <div className="mt-8">
                <WaitlistForm turnstileKey={turnstileSiteKey()} />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-h2">שומרים לכם מקום</h1>
              <p className="mt-2 text-lead text-charcoal-soft">
                {event.title}, <bdi>{formatLongDate(event.date)}</bdi> · 2 דקות, 4 פרטים
              </p>
              <RegisterForm
                initialQuote={await buildQuote(retry?.prefill.quantity ?? 1, retry?.prefill.coupon ?? "", retry?.orderId ?? null)}
                hasFriendDiscount={Boolean(event.friendDiscountAgorot)}
                turnstileKey={turnstileSiteKey()}
                prefill={retry?.prefill ?? null}
                retryToken={retry?.token ?? null}
                minutesLeft={retry?.minutesLeft ?? null}
              />
            </>
          )}
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
