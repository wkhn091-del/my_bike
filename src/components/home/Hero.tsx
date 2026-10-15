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
 * Mobile + desktop: copy vertically centered in the viewport.
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
      className="relative isolate flex min-h-[100svh] min-h-[100dvh] flex-col overflow-hidden bg-charcoal text-cream"
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
          className="hero-settle object-cover object-[68%_28%] md:object-[58%_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/45 to-charcoal/90" />
        <div className="absolute inset-x-0 top-0 h-[var(--header-h)] bg-gradient-to-b from-charcoal/55 to-transparent" />
      </div>

      {!usingCms ? (
        <IllustrativeTag className="top-[calc(var(--header-h)+0.35rem)] left-1/2 bottom-auto z-[1] -translate-x-1/2 text-[0.65rem] md:left-auto md:start-8 md:translate-x-0 md:text-[0.75rem]" />
      ) : null}

      {/* Vertically centered in the screen */}
      <div className="hero-copy pointer-events-none relative z-[1] flex flex-1 flex-col justify-center px-0 pt-[var(--header-h)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:pb-16">
        <div className="container-x mx-auto w-full max-w-xl text-center md:max-w-[42rem] md:text-start">
          <div className="pointer-events-auto inline-flex max-w-full justify-center md:justify-start">
            <HeroProof proof={proof} />
          </div>
          <p
            className="hero-in mt-3 text-[0.78rem] font-semibold tracking-wide text-cream/80 sm:text-micro"
            style={{ "--d": "100ms" } as CSSProperties}
          >
            {event.title} · {formatWeekday(event.date)} <bdi>{formatDayMonth(event.date)}</bdi> · {place}
          </p>
          <h1 id="hero-title" className="hero-display mx-auto mt-2 max-w-[14ch] drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] md:mx-0 md:max-w-[12ch]">
            <span className="hero-line">
              <span style={{ "--i": 0 } as CSSProperties}>די לרכוב לבד</span>
            </span>{" "}
            <span className="hero-line">
              <span style={{ "--i": 1 } as CSSProperties}>באותו מסלול</span>
            </span>
          </h1>
          <p
            className="hero-in mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-cream/90 md:mx-0 md:mt-4 md:max-w-xl md:text-lead"
            style={{ "--d": "550ms" } as CSSProperties}
          >
            {formatWeekday(event.date)} אחד {place} עם <bdi>{event.capacity}</bdi> רוכבים ברמה שלכם: מסלול מודרך, ארוחות,
            סדנאות וצלם. <bdi className="font-bold text-cream">{formatShekels(event.priceAgorot)}</bdi>, הכול כלול.
          </p>
          {open && event.early && earlyLeft > 0 ? (
            <p className="hero-in mt-2 text-small text-cream/80" style={{ "--d": "650ms" } as CSSProperties}>
              מחיר מוקדם <bdi>{formatShekels(event.early.priceAgorot)}</bdi> · נשארו <bdi>{earlyLeft}</bdi> מקומות במחיר
              הזה
            </p>
          ) : null}

          <div className="hero-in pointer-events-auto mx-auto mt-5 max-w-sm md:mx-0 md:max-w-none" style={{ "--d": "750ms" } as CSSProperties}>
            <Magnetic className="w-full md:w-auto">
              <CtaLink
                href="/register"
                id="hero-cta"
                location="hero"
                className="btn-primary w-full min-h-12 touch-manipulation px-6 text-base md:min-h-14 md:w-auto md:px-9 md:text-lead"
              >
                {soldOut ? "לרשימת ההמתנה" : open ? `שמרו לי מקום ${place}` : "לעדכון כשההרשמה נפתחת"}
              </CtaLink>
            </Magnetic>
            <p className="mt-2.5 flex items-start justify-center gap-2 text-[0.78rem] leading-snug text-cream/80 md:justify-start md:text-micro">
              <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-sunset md:mt-0.5" aria-hidden="true" />
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
