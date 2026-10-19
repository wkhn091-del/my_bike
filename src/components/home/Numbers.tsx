import Image from "next/image";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { EventContent } from "@/lib/content/types";
import { formatDayMonth } from "@/lib/format";
import { Odometer } from "@/motion/Odometer";
import { Parallax } from "@/motion/Parallax";
import { TiltIn } from "@/motion/TiltIn";
import { IllustrativeTag } from "./IllustrativeTag";

/** A bike computer's data page. Every number here is a confirmed fact from PROJECT_BRIEF.md or Sanity. */
export function Numbers({ event }: { event: EventContent }) {
  const fields = [
    { title: "רוכבים", value: event.capacity, unit: "מקס׳", note: "ולא אחד יותר" },
    { title: "ניסיון", value: 15, unit: "שנים", note: "של יואב על האופניים" },
    { title: "מחיר", value: event.priceAgorot / 100, unit: "₪", note: "הכול כלול, כולל מע״מ" },
    { title: "ביטול", value: 14, unit: "ימים", note: "לפני האירוע: החזר מלא" },
  ];

  return (
    <section aria-label="במספרים" className="relative isolate overflow-hidden bg-cream py-20 md:py-32">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Parallax speed={0.2} className="relative h-full w-full">
          <Image src={ILLUSTRATIVE.closing.src} alt="" fill sizes="100vw" placeholder="blur" className="scale-110 object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-b from-cream/75 via-cream/35 to-cream/85" />
        <div className="absolute inset-0 m-auto size-[50vmax] rounded-full bg-sunset/15 blur-[120px]" />
      </div>
      <IllustrativeTag className="bottom-3 start-3" />
      <div className="container-x">
        <TiltIn className="mx-auto max-w-[68rem] will-change-transform">
          <div className="rounded-[2rem] bg-cream/92 p-2.5 shadow-[0_50px_100px_-30px_rgba(31,33,28,0.35)] ring-1 ring-charcoal/10 backdrop-blur-md md:p-3.5">
            <div className="overflow-hidden rounded-[1.5rem] border border-charcoal/8 bg-gradient-to-b from-white/80 to-cream/90 text-charcoal">
              <div className="flex items-center justify-between border-b border-charcoal/8 px-5 py-3 text-micro font-semibold tracking-wide text-charcoal-soft md:px-7">
                <span className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-sunset/70 motion-reduce:hidden" />
                    <span className="relative size-2.5 rounded-full bg-sunset" />
                  </span>
                  {event.title} · <bdi>{formatDayMonth(event.date)}</bdi>
                </span>
                <span aria-hidden="true" className="flex items-end gap-0.5">
                  <span className="h-1.5 w-1 rounded-sm bg-charcoal/40" />
                  <span className="h-2.5 w-1 rounded-sm bg-charcoal/40" />
                  <span className="h-3.5 w-1 rounded-sm bg-charcoal/40" />
                  <span className="ms-2 flex h-3.5 w-7 items-center rounded-[3px] border border-charcoal/35 p-px">
                    <span className="h-full w-4/5 rounded-[1px] bg-olive" />
                  </span>
                </span>
              </div>

              <dl className="grid grid-cols-2 md:grid-cols-4">
                {fields.map((field, i) => (
                  <div
                    key={field.title}
                    className={`flex flex-col px-5 py-7 md:px-7 md:py-10 ${i % 2 === 0 ? "border-e border-charcoal/8" : ""} ${i < 2 ? "border-b border-charcoal/8 md:border-b-0" : ""} ${i === 1 ? "md:border-e" : ""}`}
                  >
                    <dt className="text-micro font-semibold tracking-[0.18em] text-charcoal-soft">{field.title}</dt>
                    <dd className="mt-3 flex items-baseline gap-2">
                      <Odometer value={field.value} className="font-sans text-[clamp(3rem,2rem+4vw,5.5rem)] font-black tracking-tight text-charcoal" />
                      <span className="text-small font-bold text-olive-deep">{field.unit}</span>
                    </dd>
                    <dd className="mt-2 text-small text-charcoal-soft">{field.note}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </TiltIn>
      </div>
    </section>
  );
}
