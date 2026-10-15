import Image from "next/image";
import { CtaLink } from "@/components/ui/CtaLink";
import { Icon } from "@/components/ui/Icon";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { PublicAvailability } from "@/lib/checkout/service";
import type { EventContent } from "@/lib/content/types";
import { formatShekels, formatShortDate } from "@/lib/format";
import { MAX_TICKETS_PER_ORDER } from "@/lib/pricing/calculate";
import { Magnetic } from "@/motion/Magnetic";
import { Reveal } from "@/motion/Reveal";
import { SplitReveal } from "@/motion/SplitReveal";
import { IllustrativeTag } from "./IllustrativeTag";

type Props = { event: EventContent; availability: PublicAvailability; open: boolean };

export function PriceAndPeace({ event, availability, open }: Props) {
  const soldOut = availability.seatsLeft === 0;
  const earlyLeft = event.early ? Math.min(event.early.seats, availability.earlySeatsLeft) : 0;
  const hasDiscounts = Boolean((event.early && earlyLeft > 0) || event.friendDiscountAgorot);

  return (
    <section aria-labelledby="price-title" className="section relative overflow-hidden" id="price">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 hidden w-24 bg-[radial-gradient(ellipse_at_0%_40%,rgba(74,93,58,0.12),transparent_70%)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 hidden w-24 bg-[radial-gradient(ellipse_at_100%_60%,rgba(224,122,46,0.1),transparent_70%)] lg:block"
      />

      <div className="container-x mx-auto grid max-w-6xl items-start gap-10 md:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 text-center md:text-start">
          <SplitReveal id="price-title" className="text-h2">
            כמה זה עולה, ומה אם משהו משתנה
          </SplitReveal>

          <div className="relative mt-8 overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgba(31,33,28,0.45)] ring-1 ring-charcoal/10">
            <div className="relative aspect-[16/10] min-h-[16rem]">
              <Image
                src={ILLUSTRATIVE.price.src}
                alt={ILLUSTRATIVE.price.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                placeholder="blur"
                className="object-cover object-[50%_40%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-charcoal/10" />
              <IllustrativeTag className="top-4 start-4 bottom-auto" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-micro font-semibold tracking-[0.18em] text-cream/70">מחיר לרוכב</p>
                <p className="mt-2 font-sans text-[clamp(2.25rem,1.7rem+3vw,4.75rem)] leading-none font-black tracking-tight text-cream">
                  <bdi>{formatShekels(event.priceAgorot)}</bdi>
                </p>
                <p className="mt-2 text-small text-cream/80">כולל מע״מ · הכול כלול ביום</p>
              </div>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {event.early && earlyLeft > 0 ? (
              <div className="rounded-2xl border border-line bg-cream/70 p-4 backdrop-blur-sm">
                <dt className="text-small text-charcoal-soft">מחיר מוקדם · {event.early.seats} ראשונים</dt>
                <dd className="mt-1 text-h3 font-bold">
                  <bdi>{formatShekels(event.early.priceAgorot)}</bdi>
                  <span className="ms-2 text-small font-normal text-olive-deep">
                    נשארו <bdi>{earlyLeft}</bdi>
                  </span>
                </dd>
              </div>
            ) : null}
            {event.friendDiscountAgorot ? (
              <div className="rounded-2xl border border-line bg-cream/70 p-4 backdrop-blur-sm">
                <dt className="text-small text-charcoal-soft">באים עם חברים</dt>
                <dd className="mt-1 font-semibold">
                  <bdi>{formatShekels(event.friendDiscountAgorot)}</bdi> הנחה לכל כרטיס (2–{MAX_TICKETS_PER_ORDER})
                </dd>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-charcoal/15 bg-olive/[0.06] p-4">
                <dt className="text-small text-charcoal-soft">מה כלול</dt>
                <dd className="mt-1 text-small font-semibold text-charcoal">מסלול · ארוחות · סדנאות · צלם</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-small text-charcoal-soft">
            יש לכם קוד קופון מהאינסטגרם? מזינים אותו בהרשמה.
            {hasDiscounts ? " בכל הזמנה מקבלים את ההנחה הכי משתלמת, אוטומטית." : ""}
          </p>
        </div>

        <div className="mx-auto w-full max-w-lg rounded-[1.5rem] border border-charcoal/8 bg-gradient-to-b from-cream to-cream-deep/40 p-5 shadow-[0_24px_60px_-40px_rgba(31,33,28,0.35)] md:mx-0 md:max-w-none md:rounded-[1.75rem] md:p-8">
          <p className="text-center text-micro font-semibold tracking-[0.16em] text-olive md:text-start">שקט נפשי</p>
          <Reveal as="ul" stagger className="mt-5 grid gap-5 md:mt-6 md:gap-6">
            <li className="flex gap-3 md:gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-olive/10 md:size-11">
                <Icon name="refund" className="size-5 text-olive md:size-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.05rem] font-bold md:text-h3">ביטול</h3>
                <p className="mt-1 text-[0.9rem] leading-relaxed text-charcoal-soft md:text-base">ביטול עד 14 יום לפני האירוע: החזר מלא. אחר כך אפשר להעביר את הכרטיס לחבר, בלי עמלה.</p>
              </div>
            </li>
            <li className="flex gap-3 md:gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-olive/10 md:size-11">
                <Icon name="cloudRain" className="size-5 text-olive md:size-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.05rem] font-bold md:text-h3">גשם</h3>
                <p className="mt-1 text-[0.9rem] leading-relaxed text-charcoal-soft md:text-base">
                  אם יירד גשם, האירוע עובר ל
                  {event.rainDate ? <bdi>{formatShortDate(event.rainDate)}</bdi> : "תאריך חלופי"}. מי שלא יכול
                  להגיע בתאריך החדש מקבל החזר מלא.
                </p>
              </div>
            </li>
            <li className="flex gap-3 md:gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-olive/10 md:size-11">
                <Icon name="shieldCheck" className="size-5 text-olive md:size-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.05rem] font-bold md:text-h3">תשלום</h3>
                <p className="mt-1 text-[0.9rem] leading-relaxed text-charcoal-soft md:text-base">תשלום מאובטח בדף הסליקה של Cardcom. חשבונית מס/קבלה נשלחת למייל מיד אחרי התשלום.</p>
              </div>
            </li>
          </Reveal>

          <div className="mt-10">
            <Magnetic className="w-full">
              <CtaLink href="/register" location="price" className="btn-primary w-full px-9">
                {soldOut ? "לרשימת ההמתנה" : open ? `אני רוצה מקום ב${event.title}` : "לעדכון כשההרשמה נפתחת"}
              </CtaLink>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
