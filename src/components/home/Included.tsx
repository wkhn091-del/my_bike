import { Icon, type IconName } from "@/components/ui/Icon";
import type { EventContent } from "@/lib/content/types";
import { Reveal } from "@/motion/Reveal";
import { SplitReveal } from "@/motion/SplitReveal";

function iconFor(item: string): IconName {
  if (/ארוח|אוכל|קפה|הזנה/.test(item)) return "utensils";
  if (/צילום|צלם|תמונ/.test(item)) return "camera";
  if (/סדנ/.test(item)) return "users";
  if (/הדרכ|מדריך|יואב/.test(item)) return "bike";
  if (/רכב|תמיכ|עזרה/.test(item)) return "lifeBuoy";
  if (/מסלול/.test(item)) return "route";
  return "check";
}

/** The price is the anchor; everything it buys sits next to it (one column, not icon cards). */
export function Included({ event }: { event: EventContent }) {
  const shekels = (event.priceAgorot / 100).toLocaleString("he-IL");
  return (
    <section id="included" aria-labelledby="included-title" className="section bg-cream">
      <div className="container-x grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div className="md:sticky md:top-28 md:self-start">
          <p className="text-micro font-semibold tracking-[0.06em] text-olive-deep">מה מקבלים</p>
          <SplitReveal id="included-title" className="mt-3 text-h2">
            690 ₪. בלי הפתעות בקופה.
          </SplitReveal>
          <p className="mt-8 font-sans leading-none font-black tracking-tighter text-charcoal">
            <bdi>
              <span className="text-[clamp(5rem,3rem+9vw,10rem)]">{shekels}</span>
              <span className="ms-2 text-[clamp(2rem,1.4rem+3vw,4rem)]">₪</span>
            </bdi>
          </p>
          <p className="mt-4 text-lead text-charcoal-soft">לרוכב, כולל מע״מ. אין תוספות ואין עלויות נסתרות.</p>
        </div>

        <Reveal as="ul" stagger className="self-end border-t border-charcoal">
          {event.included.map((item, index) => (
            <li key={item} className="group flex items-center gap-5 border-b border-charcoal/15 py-7">
              <span className="w-8 font-sans text-small font-bold text-charcoal-soft" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-display text-h3 md:text-[1.75rem]">{item}</span>
              <Icon
                name={iconFor(item)}
                className="size-8 shrink-0 text-olive transition-transform duration-500 ease-[var(--ease-soft-out)] group-hover:-translate-y-1 group-hover:scale-110"
              />
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
