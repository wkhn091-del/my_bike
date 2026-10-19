import Image from "next/image";
import type { CSSProperties } from "react";
import { CtaLink } from "@/components/ui/CtaLink";
import type { EventContent } from "@/lib/content/types";
import type { PublicAvailability } from "@/lib/checkout/service";
import { formatDayMonth, formatShekels, formatWeekday, inPlace } from "@/lib/format";
import { home, type HeroCard } from "@/content/home";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { Magnetic } from "@/motion/Magnetic";
import type { HeroProof as HeroProofData } from "@/lib/content/proof";
import { HeroProof } from "./HeroProof";

type Props = { event: EventContent; availability: PublicAvailability; open: boolean; proof: HeroProofData };

/** 3 columns from home.hero.cards. */
const COLS = [0, 1, 2].map((col) => home.hero.cards.filter((_, i) => i % 3 === col));

/** Repeat column cards so one set is tall enough to always cover the arch viewport. */
function packColumn(cards: HeroCard[], copies = 3): HeroCard[] {
  return Array.from({ length: copies }, () => cards).flat();
}

function ArchCard({ card }: { card: HeroCard }) {
  return (
    <div className="hero-card-tile">
      <div className="relative h-full w-full">
        <Image
          src={card.src}
          alt=""
          fill
          quality={90}
          sizes="(max-width: 768px) 40vw, 220px"
          className={`object-cover ${card.focus}`}
          placeholder="empty"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-transparent px-2 pb-2.5 pt-10">
          <p className="text-center text-[0.65rem] font-bold leading-tight text-cream">{card.title}</p>
        </div>
      </div>
    </div>
  );
}

function ArchCollage() {
  return (
    <div className="relative flex justify-center px-4 pb-4 md:h-full md:items-center md:justify-center md:self-stretch md:px-6 md:pb-8 md:pt-[calc(var(--header-h)+0.5rem)]">
      <div className="hero-arch-float" aria-hidden="true">
        <div className="hero-arch hero-arch-mask">
          <div className="hero-arch-grid">
            {COLS.map((colCards, col) => {
              const packed = packColumn(colCards, 3);
              return (
                <div key={col} className={`hero-arch-col hero-arch-col-${col}`}>
                  {/* ×2 identical packed sets → translateY(-50%) seamless upward loop */}
                  <div className="hero-arch-track">
                    {[0, 1].map((dup) => (
                      <div key={dup} className="hero-arch-set">
                        {packed.map((card, row) => (
                          <ArchCard key={`${card.title}-${col}-${dup}-${row}`} card={card} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Public hero copy unchanged — only the illustrative visual is the arched card mosaic.
 * Mobile: copy → arch (soft fade). Desktop: copy | arch (hard cut).
 */
export function Hero({ event, availability, open, proof }: Props) {
  const soldOut = availability.seatsLeft === 0;
  const place = inPlace(event.region);
  const earlyLeft = event.early ? Math.min(event.early.seats, availability.earlySeatsLeft) : 0;
  const image = event.heroImage
    ? { src: event.heroImage.url, alt: event.heroImage.alt, blur: event.heroImage.lqip }
    : { src: ILLUSTRATIVE.hero.src, alt: ILLUSTRATIVE.hero.alt, blur: null };

  return (
    <section id="hero" aria-labelledby="hero-title" className="hero-stage relative isolate overflow-x-clip text-cream">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder={typeof image.src === "string" ? (image.blur ? "blur" : "empty") : "blur"}
          blurDataURL={image.blur ?? undefined}
          className="hero-settle object-cover object-[50%_35%]"
        />
      </div>

      {/* Soft wash for copy only — leave the photo open around the floating arch */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/45 via-transparent to-charcoal/20 md:bg-gradient-to-l md:from-charcoal/40 md:via-transparent md:to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-4 pb-8 pt-[calc(var(--header-h)+0.75rem)] md:grid md:min-h-[100svh] md:grid-cols-2 md:items-center md:gap-8 md:pb-12 md:pt-[calc(var(--header-h)+1rem)]">
        {/* Same copy as public — wording, hierarchy, CTA */}
        <div className="hero-copy flex w-full flex-col items-center px-4 text-center drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:px-6 md:items-start md:px-10 md:text-start lg:px-12">
          <div className="pointer-events-auto flex w-full justify-center md:justify-start">
            <HeroProof proof={proof} />
          </div>

          <p
            className="hero-in mt-2.5 text-[0.75rem] font-semibold tracking-wide text-cream/80 sm:mt-3 sm:text-[0.78rem]"
            style={{ "--d": "100ms" } as CSSProperties}
          >
            {formatWeekday(event.date)} <bdi>{formatDayMonth(event.date)}</bdi> · {place}
          </p>

          <h1
            id="hero-title"
            className="hero-display mt-1.5 max-w-[13ch] drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] sm:mt-2 sm:max-w-[14ch]"
          >
            <span className="hero-line">
              <span style={{ "--i": 0 } as CSSProperties}>די לרכוב לבד</span>
            </span>{" "}
            <span className="hero-line">
              <span style={{ "--i": 1 } as CSSProperties}>{place}</span>
            </span>
          </h1>

          <p
            className="hero-in mt-2.5 max-w-[34ch] text-[0.88rem] leading-snug text-cream/90 sm:mt-3 sm:max-w-md sm:text-[0.95rem] sm:leading-relaxed md:mt-4 md:max-w-lg md:text-lead"
            style={{ "--d": "550ms" } as CSSProperties}
          >
            <bdi className="font-bold text-cream">{formatShekels(event.priceAgorot)}</bdi> הכול כלול ·{" "}
            <bdi>{event.capacity}</bdi> רוכבים בלי להישאר מאחור · מדריך, אוכל וצלם
          </p>

          {open && event.early && earlyLeft > 0 ? (
            <p className="hero-in mt-2 text-[0.8rem] text-cream/80 sm:text-small" style={{ "--d": "650ms" } as CSSProperties}>
              מחיר מוקדם <bdi>{formatShekels(event.early.priceAgorot)}</bdi> · נשארו <bdi>{earlyLeft}</bdi> מקומות במחיר הזה
            </p>
          ) : null}

          <div
            className="hero-in pointer-events-auto mt-4 w-full max-w-xs sm:mt-5 sm:max-w-sm md:max-w-none"
            style={{ "--d": "750ms" } as CSSProperties}
          >
            <Magnetic className="w-full md:w-auto">
              <CtaLink
                href="/register"
                id="hero-cta"
                location="hero"
                className="btn-primary w-full min-h-11 touch-manipulation px-5 text-[0.95rem] sm:min-h-12 sm:px-6 sm:text-base md:min-h-14 md:w-auto md:px-9 md:text-lead"
              >
                {soldOut
                  ? "לרשימת ההמתנה"
                  : open
                    ? `שמרו מקום · ${formatShekels(event.priceAgorot)}`
                    : `רשמו אותי לפתיחה · ${event.capacity} בלבד`}
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
                    <bdi>{event.capacity}</bdi> מקומות בלבד · בלי התחייבות עד שנפתח
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Only change: illustrative arch collage */}
        <ArchCollage />
      </div>
    </section>
  );
}
