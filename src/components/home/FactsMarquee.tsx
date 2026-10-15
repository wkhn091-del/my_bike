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
    "סדנאות מקצועיות",
    "צלם מקצועי",
    "החזר מלא עד 14 יום לפני",
  ];
  return (
    <div className="border-y border-cream/10 bg-olive-deep py-5 text-cream">
      <span className="sr-only">{facts.join(" · ")}</span>
      <div aria-hidden="true">
        <Marquee duration={38} gap="2.5rem">
          {facts.map((fact) => (
            <span key={fact} className="flex items-center gap-10 font-display text-[clamp(1.25rem,1rem+1vw,1.75rem)] whitespace-nowrap">
              <bdi>{fact}</bdi>
              <span className="size-2 rounded-full bg-cream/40" />
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
