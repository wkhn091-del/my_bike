import Image from "next/image";
import type { CSSProperties } from "react";
import { CtaLink } from "@/components/ui/CtaLink";
import type { EventContent } from "@/lib/content/types";
import type { PublicAvailability } from "@/lib/checkout/service";
import { formatDayMonth, formatShekels, formatWeekday, inPlace } from "@/lib/format";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { Magnetic } from "@/motion/Magnetic";
import type { HeroProof as HeroProofData } from "@/lib/content/proof";
import { HeroProof } from "./HeroProof";
import { IllustrativeTag } from "./IllustrativeTag";

type Props = { event: EventContent; availability: PublicAvailability; open: boolean; proof: HeroProofData };

/**
 * Full-viewport hero. Copy stays dead-center; mobile spacing is tightened so it fits the phone.
 */
export function Hero({ event, availability, open, proof }: Props) {
  const soldOut = availability.seatsLeft === 0;
  const place = inPlace(event.region);
  const earlyLeft = event.early ? Math.min(event.early.seats, availability.earlySeatsLeft) : 0;
  const usingCms = Boolean(event.heroImage);
  const image = event.heroImage
    ? { src: event.heroImage.url, alt: event.heroImage.alt, blur: event.heroImage.lqip }
    : { src: ILLUSTRATIVE.hero.src, alt: ILLUSTRATIVE.hero.alt, blur: null };

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate h-[100svh] h-[100dvh] max-h-[100dvh] overflow-hidden bg-charcoal text-cream"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder={typeof image.src === "string" ? (image.blur ? "blur" : "empty") : "blur"}
          blurDataURL={image.blur ?? undefined}
          className="hero-settle object-cover object-[68%_30%] md:object-[58%_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/65 via-charcoal/40 to-charcoal/80" />
      </div>

      {!usingCms ? (
        <IllustrativeTag className="top-[calc(var(--header-h)+0.35rem)] left-1/2 bottom-auto z-[1] -translate-x-1/2 text-[0.65rem] md:left-auto md:start-8 md:translate-x-0 md:text-[0.75rem]" />
      ) : null}

      {/* Centered on phone; ~24px nudge right on desktop — still clear of the edge */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-[1] w-full max-w-[100vw] -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 md:translate-x-[calc(-50%+1.5rem)] md:px-10">
        <div className="hero-copy mx-auto flex w-full max-w-[22rem] flex-col items-center text-center sm:max-w-md md:max-w-[40rem] md:items-start md:text-start">
          <div className="pointer-events-auto flex w-full justify-center md:justify-start">
            <HeroProof proof={proof} />
          </div>

          <p
            className="hero-in mt-2.5 text-[0.75rem] font-semibold tracking-wide text-cream/80 sm:mt-3 sm:text-[0.78rem]"
            style={{ "--d": "100ms" } as CSSProperties}
          >
            {event.title} · {formatWeekday(event.date)} <bdi>{formatDayMonth(event.date)}</bdi> · {place}
          </p>

          <h1
            id="hero-title"
            className="hero-display mt-1.5 max-w-[13ch] drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] sm:mt-2 sm:max-w-[14ch]"
          >
            <span className="hero-line">
              <span style={{ "--i": 0 } as CSSProperties}>די לרכוב לבד</span>
            </span>{" "}
            <span className="hero-line">
              <span style={{ "--i": 1 } as CSSProperties}>באותו מסלול</span>
            </span>
          </h1>

          <p
            className="hero-in mt-2.5 max-w-[34ch] text-[0.88rem] leading-snug text-cream/90 sm:mt-3 sm:max-w-md sm:text-[0.95rem] sm:leading-relaxed md:mt-4 md:max-w-xl md:text-lead"
            style={{ "--d": "550ms" } as CSSProperties}
          >
            {formatWeekday(event.date)} אחד {place} עם <bdi>{event.capacity}</bdi> רוכבים ברמה שלכם: מסלול מודרך, ארוחות,
            סדנאות וצלם. <bdi className="font-bold text-cream">{formatShekels(event.priceAgorot)}</bdi>, הכול כלול.
          </p>

          {open && event.early && earlyLeft > 0 ? (
            <p className="hero-in mt-2 text-[0.8rem] text-cream/80 sm:text-small" style={{ "--d": "650ms" } as CSSProperties}>
              מחיר מוקדם <bdi>{formatShekels(event.early.priceAgorot)}</bdi> · נשארו <bdi>{earlyLeft}</bdi> מקומות במחיר
              הזה
            </p>
          ) : null}

          <div className="hero-in pointer-events-auto mt-4 w-full max-w-xs sm:mt-5 sm:max-w-sm md:max-w-none" style={{ "--d": "750ms" } as CSSProperties}>
            <Magnetic className="w-full md:w-auto">
              <CtaLink
                href="/register"
                id="hero-cta"
                location="hero"
                className="btn-primary w-full min-h-11 touch-manipulation px-5 text-[0.95rem] sm:min-h-12 sm:px-6 sm:text-base md:min-h-14 md:w-auto md:px-9 md:text-lead"
              >
                {soldOut ? "לרשימת ההמתנה" : open ? `שמרו לי מקום ${place}` : "לעדכון כשההרשמה נפתחת"}
              </CtaLink>
            </Magnetic>
            <p className="mt-2 flex items-start justify-center gap-2 text-[0.72rem] leading-snug text-cream/80 sm:mt-2.5 sm:text-[0.78rem] md:justify-start md:text-micro">
              <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-sunset sm:size-2" aria-hidden="true" />
              <span>
                {soldOut ? (
                  <>
                    כל <bdi>{event.capacity}</bdi> המקומות נתפסו · אם מתפנה מקום, נודיע ראשונים
                  </>
                ) : open ? (
                  <>
                    החזר מלא עד 14 יום לפני · נשארו <bdi>{availability.seatsLeft}</bdi> מתוך <bdi>{event.capacity}</bdi>
                  </>
                ) : (
                  <>
                    <bdi>{event.capacity}</bdi> מקומות בלבד · ההרשמה נפתחת בקרוב
                  </>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
