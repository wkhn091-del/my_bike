import Image from "next/image";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { EventContent } from "@/lib/content/types";
import { formatDayMonth } from "@/lib/format";
import { Odometer } from "@/motion/Odometer";
import { Parallax } from "@/motion/Parallax";
import { TiltIn } from "@/motion/TiltIn";

/** A bike computer's data page. Every number here is a confirmed fact from PROJECT_BRIEF.md or Sanity. */
export function Numbers({ event }: { event: EventContent }) {
  const fields = [
    { title: "רוכבים", value: event.capacity, unit: "מקס׳", note: "ולא אחד יותר" },
    { title: "ניסיון", value: 15, unit: "שנים", note: "של יואב על האופניים" },
    { title: "מחיר", value: event.priceAgorot / 100, unit: "₪", note: "הכול כלול, כולל מע״מ" },
    { title: "ביטול", value: 14, unit: "ימים", note: "לפני האירוע: החזר מלא" },
  ];

  return (
    <section aria-label="במספרים" className="relative isolate overflow-hidden py-16 sm:py-20 md:py-32">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Parallax speed={0.2} className="relative h-full w-full">
          <Image
            src={ILLUSTRATIVE.closing.src}
            alt=""
            fill
            sizes="100vw"
            placeholder="blur"
            className="scale-110 object-cover object-[50%_40%]"
          />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/40 to-cream/85" />
        <div className="absolute inset-0 m-auto size-[50vmax] rounded-full bg-sunset/12 blur-[120px]" />
      </div>

      <div className="container-x">
        <TiltIn className="mx-auto max-w-[68rem] will-change-transform">
          <div className="rounded-[1.5rem] bg-cream/92 p-2 shadow-float ring-1 ring-charcoal/10 backdrop-blur-md sm:rounded-[2rem] sm:p-2.5 md:p-3.5">
            <div className="overflow-hidden rounded-[1.15rem] border border-charcoal/8 bg-gradient-to-b from-white/85 to-cream/92 text-charcoal sm:rounded-[1.5rem]">
              <div className="flex items-center justify-between border-b border-charcoal/8 px-4 py-2.5 text-micro font-semibold tracking-[0.08em] text-charcoal-soft sm:px-5 sm:py-3 md:px-7">
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
                    className={`flex flex-col px-4 py-5 sm:px-5 sm:py-7 md:px-7 md:py-10 ${i % 2 === 0 ? "border-e border-charcoal/8" : ""} ${i < 2 ? "border-b border-charcoal/8 md:border-b-0" : ""} ${i === 1 ? "md:border-e" : ""}`}
                  >
                    <dt className="text-micro font-semibold tracking-[0.08em] text-charcoal-soft">{field.title}</dt>
                    <dd className="mt-2 flex items-baseline gap-2 sm:mt-3">
                      <Odometer value={field.value} className="font-sans text-[clamp(2.4rem,1.6rem+4vw,5.5rem)] font-black tracking-tight text-charcoal" />
                      <span className="text-small font-bold text-olive-deep">{field.unit}</span>
                    </dd>
                    <dd className="mt-1.5 text-[0.8rem] text-charcoal-soft sm:mt-2 sm:text-small">{field.note}</dd>
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
