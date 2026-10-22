import Image from "next/image";
import { CtaLink } from "@/components/ui/CtaLink";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { Magnetic } from "@/motion/Magnetic";
import { Parallax } from "@/motion/Parallax";
import type { PublicAvailability } from "@/lib/checkout/service";
import type { EventContent } from "@/lib/content/types";
import { formatShortDate, inPlace } from "@/lib/format";
import { SplitReveal } from "@/motion/SplitReveal";

/** Final CTA band above the footer — full-bleed ride photo with a warm olive wash. */
export function Closing({ event, availability, open }: { event: EventContent; availability: PublicAvailability; open: boolean }) {
  const soldOut = availability.seatsLeft === 0;
  return (
    <section id="closing" aria-labelledby="closing-title" className="relative isolate overflow-hidden py-16 text-cream sm:py-24 md:py-48">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Parallax speed={0.18} className="relative h-full w-full">
          <Image
            src={ILLUSTRATIVE.closing.src}
            alt=""
            fill
            sizes="100vw"
            placeholder="blur"
            className="object-cover object-[50%_40%] scale-105"
          />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141c10]/92 via-olive-deep/55 to-[#2a3a20]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(224_122_46/0.18),transparent_55%)]" />
      </div>

      <div className="container-x px-4 text-center">
        <SplitReveal id="closing-title" className="mx-auto max-w-4xl text-[clamp(1.85rem,1.1rem+4vw,6rem)] leading-[1.08] tracking-[-0.02em] sm:leading-[1.02]">
          {soldOut ? (
            <>כל {event.capacity} המקומות נתפסו</>
          ) : open ? (
            <>
              נשארו <bdi>{availability.seatsLeft}</bdi> מקומות ל{event.title}
            </>
          ) : (
            <>
              <bdi>{event.capacity}</bdi> מקומות ל{event.title}
            </>
          )}
        </SplitReveal>
        <p className="mx-auto mt-3 max-w-[36ch] text-[0.95rem] leading-relaxed text-cream/90 sm:mt-4 sm:max-w-none sm:text-lead">
          <bdi>{formatShortDate(event.date)}</bdi> {inPlace(event.region)}. רכיבה, אוכל, סדנת טכניקה וחבורה שלא בורחת קדימה.
        </p>
        <div className="mx-auto mt-7 w-full max-w-sm sm:mt-10 sm:max-w-none">
          <Magnetic className="w-full sm:w-auto">
            <CtaLink href="/register" location="closing" className="btn-primary w-full min-h-12 px-6 text-[0.95rem] sm:w-auto sm:px-10 sm:text-lead">
              {soldOut
                ? "לרשימת ההמתנה"
                : open
                  ? `אני רוצה מקום ב${event.title}`
                  : `שמרו מקום · ${event.capacity} בלבד`}
            </CtaLink>
          </Magnetic>
          {!soldOut ? <p className="mt-2 text-[0.75rem] text-cream/85 sm:text-micro">החזר מלא עד 14 יום לפני האירוע</p> : null}
        </div>
      </div>
    </section>
  );
}
