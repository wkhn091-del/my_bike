"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/** A timeline rail that fills from the top as the visitor scrolls through the day. Transform only. */
export function ScrollLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top 75%", end: "bottom 60%", scrub: 0.6 } },
      );
    },
    { scope: ref },
  );

  return <span ref={ref} aria-hidden="true" className={`pointer-events-none absolute origin-top ${className}`} />;
}
