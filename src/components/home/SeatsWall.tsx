"use client";

import Image from "next/image";
import { useRef } from "react";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { gsap, useGSAP } from "@/motion/gsap";
import type { WallSeat } from "@/lib/db/orders";
import { IllustrativeTag } from "./IllustrativeTag";

type Props = { capacity: number; taken: number; named: WallSeat[]; open: boolean };

/**
 * Full-bleed premium seats panel: trail photo + live meter + side status cards.
 */
export function SeatsWall({ capacity, taken, named, open }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const filled = Math.min(taken, capacity);
  const pct = capacity > 0 ? (filled / capacity) * 100 : 0;
  const left = Math.max(0, capacity - filled);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const fill = fillRef.current;
        const counter = counterRef.current;
        if (fill) {
          gsap.fromTo(
            fill,
            { scaleX: 0 },
            {
              scaleX: pct / 100,
              duration: 1.4,
              ease: "power3.out",
              transformOrigin: "right center",
              scrollTrigger: { trigger: root, start: "top 75%", once: true },
            },
          );
        }
        if (counter && filled > 0) {
          const state = { value: 0 };
          gsap.to(state, {
            value: filled,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: root, start: "top 75%", once: true },
            onUpdate: () => {
              counter.textContent = String(Math.round(state.value));
            },
          });
        }
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [filled, capacity, pct] },
  );

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] ring-1 ring-cream/15 md:min-h-[28rem]">
        <Image
          src={ILLUSTRATIVE.route.src}
          alt={ILLUSTRATIVE.route.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 70vw"
          placeholder="blur"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-charcoal/10" />
        <IllustrativeTag className="top-4 start-4 bottom-auto" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-9">
          <p className="text-micro font-semibold tracking-wide text-cream/70">מקומות ליום הקהילה</p>
          <p className="mt-2 font-sans leading-none font-black tracking-tight">
            <bdi>
              <span ref={counterRef} className="text-[clamp(3.5rem,2.5rem+5vw,7rem)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {filled}
              </span>
              <span className="text-[clamp(1.6rem,1.2rem+2vw,2.75rem)] text-cream/70">/{capacity}</span>
            </bdi>
          </p>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-cream/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={capacity}
            aria-valuenow={filled}
            aria-valuetext={`${filled} מתוך ${capacity} מקומות`}
            aria-label="מקומות שנתפסו"
          >
            <div
              ref={fillRef}
              className="h-full origin-right rounded-full bg-gradient-to-l from-sunset to-[#f0a35a]"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-[1.5rem] border border-cream/12 bg-cream/[0.06] p-5 backdrop-blur-sm md:p-6">
          <p className="text-micro font-semibold tracking-[0.16em] text-sunset">סטטוס</p>
          <p className="mt-3 text-lead text-cream/90" aria-live="polite">
            {filled === 0 ? (
              open ? (
                <>ההרשמה נפתחה. המסלול מחכה לרוכב הראשון.</>
              ) : (
                <>
                  <bdi>{capacity}</bdi> מקומות בלבד. ההרשמה נפתחת בקרוב.
                </>
              )
            ) : filled >= capacity ? (
              <>
                כל <bdi>{capacity}</bdi> המקומות נתפסו. אפשר להצטרף לרשימת ההמתנה.
              </>
            ) : (
              <>
                נשארו <bdi>{left}</bdi> מקומות אמיתיים מהשרת.
              </>
            )}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-cream/12 bg-gradient-to-br from-sunset/20 to-cream/[0.04] p-5 md:p-6">
          <p className="text-micro font-semibold tracking-[0.16em] text-cream/60">למה מוגבל</p>
          <p className="mt-3 text-small text-cream/80">
            הקבוצה קטנה בכוונה — כדי שיואב יכיר כל רוכב, והיום יישאר אישי ולא המוני.
          </p>
          {named.length ? (
            <p className="mt-4 text-small text-cream/65">
              כבר בפנים: {named
                .slice(0, 12)
                .map((seat) => seat.label)
                .join(" · ")}
              {named.length > 12 ? " ועוד" : ""}
            </p>
          ) : null}
        </div>

        <div className="hidden rounded-[1.5rem] border border-dashed border-cream/15 p-5 lg:block md:p-6">
          <p className="text-micro font-semibold tracking-[0.16em] text-cream/50">מה מחכה בשטח</p>
          <ul className="mt-3 space-y-2 text-small text-cream/75">
            <li>מסלול מודרך בלי לרדוף</li>
            <li>ארוחות לאורך היום</li>
            <li>סדנת טכניקה + צלם</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
