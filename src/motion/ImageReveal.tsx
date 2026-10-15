"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * Photos open like a curtain from the bottom edge while the picture settles from a slight zoom.
 * Below the fold only. Reduced motion: the photo is simply there.
 */
export function ImageReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      el.removeAttribute("data-motion-pending");
      if (prefersReducedMotion()) return;
      const inner = el.firstElementChild;
      const tl = gsap.timeline({ delay, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out", clearProps: "clipPath" });
      if (inner) tl.fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`overflow-hidden ${className}`} data-motion-pending="">
      <div className="h-full w-full">{children}</div>
    </div>
  );
}
