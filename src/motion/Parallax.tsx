"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * Image drift for the "Yoav" section only (A-3: speed 0.1, transform only). The wrapper must
 * have overflow: hidden; the content is scaled slightly so the drift never shows an empty edge.
 */
export function Parallax({ children, className, speed = 0.1 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const shift = speed * 50;
      gsap.fromTo(
        el,
        { yPercent: -shift, scale: 1 + Math.abs(speed) },
        {
          yPercent: shift,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    { scope: ref, dependencies: [speed] },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
