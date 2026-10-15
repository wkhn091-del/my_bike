"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

const TURNS = 2;

/**
 * Bike-computer digits: every digit is a strip of 0-9 that rolls into place, the leftmost last.
 * The server HTML already shows the final number (strips parked on it); screen readers get plain text.
 */
export function Odometer({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = Math.round(value).toLocaleString("he-IL");
  const cells = [...text];
  const slots = TURNS * 10;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const strips = gsap.utils.toArray<HTMLElement>("[data-strip]", root);
        gsap.fromTo(strips, { y: 0, yPercent: 0 }, {
          y: 0,
          yPercent: (_, el: HTMLElement) => Number(el.dataset.strip),
          duration: 2.4,
          ease: "power4.out",
          stagger: { each: 0.12, from: "end" },
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" dir="ltr" className="inline-flex leading-none">
        {cells.map((char, i) => {
          const digit = Number(char);
          if (Number.isNaN(digit)) return <span key={i}>{char}</span>;
          const offset = (-((TURNS - 1) * 10 + digit) * 100) / slots;
          return (
            <span key={i} className="relative inline-block h-[1em] overflow-hidden">
              <span
                data-strip={offset}
                className="flex flex-col will-change-transform"
                style={{ transform: `translateY(${offset}%)` }}
              >
                {Array.from({ length: slots }, (_, n) => (
                  <span key={n} className="block h-[1em]">
                    {n % 10}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
