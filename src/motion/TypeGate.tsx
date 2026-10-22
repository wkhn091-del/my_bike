"use client";

import { useId, useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";

const FONT_SIZE = 260;

/**
 * A full-screen word cut out of a tinted layer: the landscape glows through the letters and shows
 * faintly behind them. The word is measured and fitted edge to edge. Scrolling grows the layer until
 * the visitor passes "through" the word into the landscape, then `children` (the heading) rises in.
 * Only transform and opacity move. Server HTML and reduced motion get the finished state.
 */
export function TypeGate({ word, hint, media, children }: { word: string; hint: string; media: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const maskId = `gate-${useId().replace(/:/g, "")}`;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px)" }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;
        const layer = root.querySelector<SVGSVGElement>("[data-gate-layer]");
        const measure = root.querySelector<SVGTextElement>("[data-gate-measure]");
        const photo = root.querySelector("[data-gate-media]");
        const content = root.querySelector("[data-gate-content]");
        if (!layer || !measure) return;

        const fit = () => {
          const box = measure.getBBox();
          if (!box.width) return;
          const pad = box.width * (mobile ? 0.04 : 0.07);
          layer.setAttribute("viewBox", `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`);
        };
        fit();
        document.fonts?.ready.then(fit);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${window.innerHeight * (mobile ? 0.9 : 1.3)}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.fromTo(layer, { autoAlpha: 1, scale: 1 }, { scale: 12, duration: 1, ease: "power3.in" }, 0);
        tl.fromTo(root.querySelector("[data-gate-hint]"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.12 }, 0);
        tl.to(layer, { autoAlpha: 0, duration: 0.25 }, 0.72);
        tl.fromTo(photo, { scale: 1.3 }, { scale: 1, duration: 1 }, 0);
        tl.fromTo(content, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "expo.out" }, 0.8);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const textProps = {
    x: 500,
    y: 500,
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: FONT_SIZE,
    style: { fontFamily: "var(--font-display)" },
  } as const;

  return (
    <div
      ref={ref}
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-charcoal"
      aria-label={`${word} — ${hint} להמשך`}
    >
      <div data-gate-media="" className="absolute inset-0 will-change-transform">
        {media}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />

      <svg
        data-gate-layer=""
        aria-hidden="true"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none invisible absolute inset-0 h-full w-full overflow-visible will-change-transform"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-20000" y="-20000" width="41000" height="41000">
            <rect x="-20000" y="-20000" width="41000" height="41000" fill="white" />
            <text {...textProps} fill="black">
              {word}
            </text>
          </mask>
        </defs>
        <rect x="-20000" y="-20000" width="41000" height="41000" mask={`url(#${maskId})`} style={{ fill: "var(--color-charcoal)", fillOpacity: 0.86 }} />
        <text data-gate-measure="" {...textProps} fill="none" stroke="var(--color-cream)" strokeOpacity="0.35" strokeWidth="1.2">
          {word}
        </text>
      </svg>
      <p data-gate-hint="" aria-hidden="true" className="invisible absolute inset-x-0 bottom-[20%] text-center text-micro font-semibold tracking-[0.1em] text-cream/85">
        {hint}
      </p>
      <p className="sr-only">{hint} להמשך התוכן</p>

      <div data-gate-content="" className="absolute inset-x-0 bottom-0">
        {children}
      </div>
    </div>
  );
}
