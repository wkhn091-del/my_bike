import Image from "next/image";
import { MIN_TESTIMONIALS } from "@/lib/content/proof";
import type { SiteContent } from "@/lib/content/types";
import type { WallSeat } from "@/lib/db/orders";
import { Reveal } from "@/motion/Reveal";
import { SplitReveal } from "@/motion/SplitReveal";
import { SeatsWall } from "./SeatsWall";

/** Social proof, real scarcity and community in one element, all from live server data (P14, P25, P20). */
export function WallSection({ content, taken, named, open }: { content: SiteContent; taken: number; named: WallSeat[]; open: boolean }) {
  const { event, testimonials } = content;
  return (
    <section aria-labelledby="wall-title" className="section relative overflow-hidden bg-charcoal text-cream">
      <div className="container-x relative">
        <p className="text-micro font-semibold tracking-wide text-cream/60">מקומות אמיתיים</p>
        <SplitReveal id="wall-title" className="mt-3 text-h2">
          מי כבר על המסלול
        </SplitReveal>
        <div className="mt-6">
          <SeatsWall capacity={event.capacity} taken={taken} named={named} open={open} />
        </div>

        {testimonials.length >= MIN_TESTIMONIALS ? (
          <Reveal stagger className="mt-16 grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <figure key={`${item.name}-${item.quote.slice(0, 12)}`} className="rounded-lg border border-cream/10 bg-cream/5 p-7">
                <blockquote className="font-display text-h3">“{item.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 text-small font-semibold text-cream/75">
                  {item.image ? (
                    <Image src={item.image.url} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
                  ) : null}
                  <span>
                    {item.name}
                    {item.verified ? <span className="mt-0.5 block text-micro font-normal text-cream/60">השתתף/ה ביום הקהילה</span> : null}
                  </span>
                </figcaption>
              </figure>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
