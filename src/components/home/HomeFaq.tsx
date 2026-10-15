import { Icon } from "@/components/ui/Icon";
import type { FaqItem } from "@/lib/content/types";
import { Reveal } from "@/motion/Reveal";
import { SplitReveal } from "@/motion/SplitReveal";

/** Native <details>: keyboard and screen-reader friendly, no height animation (A-3 rule 4). */
export function HomeFaq({ items }: { items: FaqItem[] }) {
  const sideHints = items.slice(0, 3);
  const rest = items.length > 3 ? items : items;

  return (
    <section id="faq" aria-labelledby="faq-title" className="section relative overflow-hidden bg-cream-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-8 start-0 hidden w-px bg-gradient-to-b from-transparent via-olive/35 to-transparent lg:block"
        style={{ insetInlineStart: "max(1.25rem, calc((100% - 72rem) / 2 + 0.5rem))" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-8 end-0 hidden w-px bg-gradient-to-b from-transparent via-sunset/30 to-transparent lg:block"
        style={{ insetInlineEnd: "max(1.25rem, calc((100% - 72rem) / 2 + 0.5rem))" }}
      />

      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <p className="text-micro font-semibold tracking-[0.18em] text-olive">שאלות ותשובות</p>
          <SplitReveal id="faq-title" className="mt-3 text-h2">
            שאלות שרוכבים שואלים
          </SplitReveal>
          <p className="mt-4 max-w-sm text-lead text-charcoal-soft">התשובות הקצרות בצד — והפירוט המלא ברשימה. בלי לנחש.</p>

          {sideHints.length ? (
            <Reveal stagger className="mt-8 hidden gap-3 lg:grid">
              {sideHints.map((item, index) => (
                <a
                  key={item.question}
                  href={`#faq-item-${index}`}
                  className="rounded-2xl border border-charcoal/8 bg-cream/80 p-4 shadow-[0_12px_40px_-28px_rgba(31,33,28,0.4)] transition-[border-color,transform] duration-[var(--motion-fast)] hover:border-olive/40 hover:-translate-y-0.5"
                >
                  <span className="text-micro font-bold text-sunset">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-2 block text-small font-semibold text-charcoal">{item.question}</span>
                </a>
              ))}
            </Reveal>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-charcoal/8 bg-cream/70 p-2 shadow-[0_30px_70px_-45px_rgba(31,33,28,0.45)] backdrop-blur-sm md:p-3">
          <div className="divide-y divide-line overflow-hidden rounded-[1.35rem] border border-line bg-cream">
            {rest.map((item, index) => (
              <details key={item.question} id={`faq-item-${index}`} className="group px-5 md:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lead font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <Icon
                    name="chevronDown"
                    className="size-6 shrink-0 text-olive transition-transform duration-[var(--motion-fast)] group-open:rotate-180"
                  />
                </summary>
                <div className="pb-5 measure">
                  {item.answer.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="mt-2 first:mt-0 text-charcoal-soft">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
