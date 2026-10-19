import { Icon } from "@/components/ui/Icon";
import type { EventContent } from "@/lib/content/types";
import { Reveal } from "@/motion/Reveal";
import { ScrollLine } from "@/motion/ScrollLine";
import { SplitReveal } from "@/motion/SplitReveal";

/** An hour-by-hour timeline, not numbered steps (anti-template check). */
export function DaySchedule({ event }: { event: EventContent }) {
  return (
    <section aria-labelledby="day-title" className="section bg-cream-deep">
      <div className="container-x">
        <SplitReveal id="day-title" className="text-h2">
          ככה נראה {event.title}
        </SplitReveal>
        <p className="mt-4 text-lead measure">מהבוקר ועד השקיעה, הכול מתוכנן. אתם רק מביאים אופניים וקסדה.</p>

        {event.schedule.length ? (
          <div className="relative mt-10">
            <ScrollLine className="start-0 top-0 h-full w-[2px] bg-olive" />
            <Reveal as="ol" stagger className="border-s-2 border-olive/20 ps-6">
              {event.schedule.map((item) => (
                <li key={`${item.time}-${item.title}`} className="relative pb-8 last:pb-0">
                  <span className="absolute -start-[33px] top-2 size-4 rounded-full border-2 border-olive bg-cream" aria-hidden="true" />
                  <p className="text-h3 font-bold text-olive">
                    <bdi dir="ltr">{item.time}</bdi>
                  </p>
                  <p className="text-lead font-semibold">{item.title}</p>
                  {item.detail ? <p className="text-charcoal-soft">{item.detail}</p> : null}
                </li>
              ))}
            </Reveal>
          </div>
        ) : (
          <p className="mt-8 rounded-md border border-line bg-cream p-5 measure">השעות המדויקות ונקודת המפגש יפורסמו כאן, ויישלחו במייל לכל מי שנרשם.</p>
        )}

        <p className="mt-8 flex items-start gap-3 measure">
          <Icon name="camera" className="mt-1 size-6 shrink-0 text-olive" />
          <span>לאורך כל היום: צלם שרוכב איתכם.{event.photosDelivery ? ` התמונות נשלחות אליכם ${event.photosDelivery}.` : ""}</span>
        </p>
      </div>
    </section>
  );
}
