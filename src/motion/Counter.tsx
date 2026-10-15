"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/** Counts up to a real number when it scrolls into view. The final number is in the HTML for SEO and no-JS. */
export function Counter({ to, duration = 2, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => Math.round(n).toLocaleString("he-IL");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const state = { value: 0 };
      el.textContent = format(0);
      gsap.to(state, {
        value: to,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(state.value);
        },
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    },
    { scope: ref, dependencies: [to, duration] },
  );

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(to)}
    </span>
  );
}
