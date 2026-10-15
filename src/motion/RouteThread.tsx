"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

/**
 * The dotted route from the logo, running down the reading edge of its positioned parent. It grows
 * with the scroll (scaleY) while a glowing rider rides its tip (translateY), so the page reads as one
 * journey that ends at the seats wall. `mix-blend-difference` keeps it visible on cream, dark and photos.
 * Server HTML and reduced motion: the full route, no rider.
 */
export function RouteThread() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      const parent = root?.parentElement;
      if (!root || !parent) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const line = root.querySelector("[data-thread-line]");
        const rider = root.querySelector("[data-thread-rider]");
        gsap.set(rider, { autoAlpha: 1 });
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: parent, start: "top 55%", end: "bottom 55%", scrub: 0.8, invalidateOnRefresh: true },
          })
          .fromTo(line, { scaleY: 0 }, { scaleY: 1 }, 0)
          .fromTo(rider, { y: 0 }, { y: () => parent.offsetHeight }, 0);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-1.5 z-30 w-3 mix-blend-difference md:start-[1.6vw]">
      <div
        data-thread-line=""
        className="absolute inset-y-0 start-[5px] w-[2px] origin-top"
        style={{ backgroundImage: "radial-gradient(circle, rgb(244 237 224) 1px, transparent 1.4px)", backgroundSize: "2px 9px" }}
      />
      <div data-thread-rider="" className="invisible absolute start-0 -top-1.5 size-3 rounded-full bg-cream shadow-[0_0_14px_4px_rgb(244_237_224/0.55)]" />
    </div>
  );
}
