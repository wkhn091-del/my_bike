import type { EventContent } from "@/lib/content/types";
import { formatDayMonth, formatShekels, inPlace } from "@/lib/format";
import { Marquee } from "@/motion/Marquee";

/** Only confirmed facts, so the strip never promises anything the day does not deliver. */
export function FactsMarquee({ event }: { event: EventContent }) {
  const facts = [
    `${event.title} ${inPlace(event.region)}`,
    `שישי ${formatDayMonth(event.date)}`,
    `${event.capacity} רוכבים`,
    `${formatShekels(event.priceAgorot)} הכול כלול`,
    "ארוחות לאורך היום",
    "סדנת טכניקה בשטח",
    "צלם שרוכב איתכם",
    "החזר מלא עד 14 יום לפני",
  ];
  return (
    <div className="border-t border-cream/10 bg-olive-deep py-3 text-cream sm:py-4 md:py-5">
      <span className="sr-only">{facts.join(" · ")}</span>
      <div aria-hidden="true">
        <Marquee duration={38} gap="1.25rem">
          {facts.map((fact) => (
            <span
              key={fact}
              className="flex items-center gap-4 font-display text-[1.1rem] whitespace-nowrap sm:gap-8 sm:text-[clamp(1.05rem,0.9rem+1.2vw,1.75rem)]"
            >
              <bdi>{fact}</bdi>
              <span className="size-1.5 rounded-full bg-cream/40 sm:size-2" />
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
