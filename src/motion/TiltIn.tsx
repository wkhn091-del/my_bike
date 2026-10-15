"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";

/** A device that lies back and stands up as it scrolls in (rotateX + translate only). Reduced motion: upright. */
export function TiltIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { rotationX: 28, y: 60, transformPerspective: 1400, transformOrigin: "50% 100%" },
          { rotationX: 0, y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: 0.8 } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
