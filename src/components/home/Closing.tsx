import Image from "next/image";
import { CtaLink } from "@/components/ui/CtaLink";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { Magnetic } from "@/motion/Magnetic";
import { Parallax } from "@/motion/Parallax";
import { IllustrativeTag } from "./IllustrativeTag";
import type { PublicAvailability } from "@/lib/checkout/service";
import type { EventContent } from "@/lib/content/types";
import { formatShortDate, inPlace } from "@/lib/format";
import { SplitReveal } from "@/motion/SplitReveal";

export function Closing({ event, availability, open }: { event: EventContent; availability: PublicAvailability; open: boolean }) {
  const soldOut = availability.seatsLeft === 0;
  return (
    <section aria-labelledby="closing-title" className="relative isolate overflow-hidden bg-charcoal py-32 text-cream md:py-52">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Parallax speed={0.18} className="relative h-full w-full">
          <Image src={ILLUSTRATIVE.closing.src} alt="" fill sizes="100vw" placeholder="blur" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-charcoal/25" />
      </div>
      <IllustrativeTag className="bottom-3 start-3" />
      <div className="container-x text-center">
        <SplitReveal id="closing-title" className="mx-auto max-w-4xl text-[clamp(2.5rem,1.4rem+5vw,6rem)] leading-[1.02] tracking-[-0.02em]">
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
        <p className="mx-auto mt-4 text-lead measure">
          <bdi>{formatShortDate(event.date)}</bdi> {inPlace(event.region)}. רכיבה, אוכל, סדנאות וחבורה ברמה שלכם.
        </p>
        <div className="mt-10">
          <Magnetic className="w-full sm:w-auto">
            <CtaLink href="/register" location="closing" className="btn-primary w-full px-10 text-lead sm:w-auto">
              {soldOut ? "לרשימת ההמתנה" : open ? `אני רוצה מקום ב${event.title}` : "לעדכון כשההרשמה נפתחת"}
            </CtaLink>
          </Magnetic>
          {!soldOut ? <p className="mt-2 text-micro text-cream/85">החזר מלא עד 14 יום לפני האירוע</p> : null}
        </div>
      </div>
    </section>
  );
}
