import Image from "next/image";
import type { CSSProperties } from "react";
import { CtaLink } from "@/components/ui/CtaLink";
import type { EventContent } from "@/lib/content/types";
import type { PublicAvailability } from "@/lib/checkout/service";
import { formatDayMonth, formatShekels, formatWeekday, inPlace } from "@/lib/format";
import { home, type HeroCard } from "@/content/home";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { Magnetic } from "@/motion/Magnetic";
import { FactsMarquee } from "./FactsMarquee";

type Props = { event: EventContent; availability: PublicAvailability; open: boolean };

/**
 * Reference hero: small half-peek cards in a tight arc across the full width,
 * bottoms tucked behind the olive facts strip.
 */
const FAN = [
  { r: -7, sink: 18, dark: true },
  { r: -5, sink: 12, dark: false },
  { r: -3, sink: 6, dark: false },
  { r: -1.5, sink: 2, dark: false },
  { r: 0, sink: 0, dark: false },
  { r: 1.5, sink: 2, dark: false },
  { r: 3, sink: 6, dark: false },
  { r: 5, sink: 12, dark: false },
  { r: 7, sink: 18, dark: true },
] as const;

function FanCard({ card, index }: { card: HeroCard; index: number }) {
  const fan = FAN[index] ?? FAN[2]!;
  return (
    <article
      className={`hero-fan-card ${fan.dark ? "hero-fan-card--dark" : "hero-fan-card--light"}`}
      style={
        {
          "--r": fan.r,
          "--sink": `${fan.sink}px`,
          "--i": index,
        } as CSSProperties
      }
    >
      <div className="hero-fan-chrome">
        <div className="hero-fan-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="hero-fan-card-title">{card.title}</p>
      </div>
      <div className="hero-fan-card-photo">
        <Image
          src={card.src}
          alt=""
          fill
          quality={90}
          sizes="(max-width: 639px) 32vw, (max-width: 767px) 28vw, 11vw"
          className={`object-cover ${card.focus}`}
        />
      </div>
    </article>
  );
}

function HeroFan() {
  const cards = home.hero.cards.slice(0, FAN.length);
  return (
    <div className="hero-fan" aria-hidden="true">
      {cards.map((card, index) => (
        <FanCard key={`${card.title}-${index}`} card={card} index={index} />
      ))}
    </div>
  );
}

export function Hero({ event, availability, open }: Props) {
  const soldOut = availability.seatsLeft === 0;
  const place = inPlace(event.region);
  const earlyLeft = event.early ? Math.min(event.early.seats, availability.earlySeatsLeft) : 0;
  const bg = event.heroImage
    ? { src: event.heroImage.url, alt: event.heroImage.alt, blur: event.heroImage.lqip }
    : { src: ILLUSTRATIVE.hero.src, alt: ILLUSTRATIVE.hero.alt, blur: null };

  const ctaLabel = soldOut
    ? "לרשימת ההמתנה"
    : open
      ? `שמרו מקום · ${formatShekels(event.priceAgorot)}`
      : `שמרו מקום · ${event.capacity} בלבד`;

  const ctaHint = soldOut ? (
    <>
      כל <bdi>{event.capacity}</bdi> המקומות נתפסו · אם מתפנה מקום, נודיע ראשונים
    </>
  ) : open ? (
    <>
      החזר מלא עד 14 יום לפני · נשארו <bdi>{availability.seatsLeft}</bdi> מתוך <bdi>{event.capacity}</bdi>
    </>
  ) : (
    <>
      החזר מלא עד 14 יום לפני · בלי חיוב עד שההרשמה נפתחת
    </>
  );

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="hero-stage-light relative isolate flex min-h-[calc(100svh-var(--header-h))] max-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={bg.src}
          alt={bg.alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder={typeof bg.src === "string" ? (bg.blur ? "blur" : "empty") : "blur"}
          blurDataURL={bg.blur ?? undefined}
          className="object-cover object-[50%_38%] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/35 via-transparent to-cream/20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-4 pt-10 sm:px-6 sm:pt-3 md:pt-4">
        <div className="flex shrink-0 flex-col items-center text-center">
          <p
            className="hero-in text-[0.8125rem] font-semibold tracking-[0.06em] text-olive-deep sm:text-micro"
            style={{ "--d": "80ms" } as CSSProperties}
          >
            <bdi>{formatDayMonth(event.date)}</bdi> · {event.title} · מדריך, אוכל וצלם
          </p>

          <h1 id="hero-title" className="hero-centered-display mt-2 max-w-[18ch] sm:max-w-[22ch]">
            <span
              className="hero-in block text-charcoal drop-shadow-[0_1px_14px_rgb(244_237_224/0.9)]"
              style={{ "--d": "140ms" } as CSSProperties}
            >
              מקום ביום.
            </span>
            <span className="hero-in hero-accent-word mt-1 block" style={{ "--d": "260ms" } as CSSProperties}>
              בלי להישאר מאחור
            </span>
          </h1>

          <p
            className="hero-in mt-2.5 max-w-[32ch] text-base leading-relaxed text-charcoal sm:max-w-[38ch] sm:text-[0.95rem]"
            style={{ "--d": "420ms" } as CSSProperties}
          >
            {formatWeekday(event.date)} {place} עם יואב · <bdi>{event.capacity}</bdi> רוכבים ·{" "}
            <bdi className="font-bold">{formatShekels(event.priceAgorot)}</bdi> הכול כלול
          </p>

          {open && event.early && earlyLeft > 0 ? (
            <p className="hero-in mt-1 hidden text-small text-olive-deep sm:block" style={{ "--d": "500ms" } as CSSProperties}>
              מחיר מוקדם <bdi>{formatShekels(event.early.priceAgorot)}</bdi> · נשארו <bdi>{earlyLeft}</bdi> במחיר הזה
            </p>
          ) : null}

          <div className="hero-in pointer-events-auto mt-4 w-full max-w-sm sm:mt-3.5 sm:max-w-xs" style={{ "--d": "560ms" } as CSSProperties}>
            <Magnetic className="w-full">
              <CtaLink
                href="/register"
                id="hero-cta"
                location="hero"
                className="btn-primary w-full min-h-12 touch-manipulation px-6 text-base sm:px-8 sm:text-base md:min-h-14 md:text-lead"
              >
                {ctaLabel}
              </CtaLink>
            </Magnetic>
            <p className="mt-2 text-center text-[0.8125rem] leading-snug text-charcoal sm:text-micro">{ctaHint}</p>
          </div>
        </div>

        {/* Spacer pushes the peek band to the bottom edge above the marquee */}
        <div className="min-h-0 flex-1" aria-hidden="true" />
      </div>

      {/* Half-peek cards + olive strip — matches the reference composition */}
      <div className="hero-peek relative z-20 mt-auto w-full shrink-0">
        <div className="hero-fan-slot hero-in" style={{ "--d": "620ms" } as CSSProperties}>
          <HeroFan />
          <p className="sr-only">רגעים מיום הקהילה: רכיבה, מסלול, סדנה ושקיעה</p>
        </div>
        <div className="hero-peek-marquee relative z-10">
          <FactsMarquee event={event} />
        </div>
      </div>
    </section>
  );
}
