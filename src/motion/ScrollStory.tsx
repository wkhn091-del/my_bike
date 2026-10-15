"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";

export type StoryScene = { key: string; media: ReactNode; badge?: ReactNode; step: string; title: string; detail: string };

/**
 * A pinned, scroll-driven film: each scene's photo settles from a slow zoom (Ken Burns) and dissolves
 * into the next, while its caption rises out of a mask and a day-progress bar fills.
 * Server HTML and reduced motion get the finished state: the scenes stacked one under the other.
 */
export function ScrollStory({ scenes }: { scenes: StoryScene[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px)" },
        (context) => {
          const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
          if (!motion) return;
          root.dataset.story = "on";

          const stage = root.querySelector<HTMLElement>("[data-stage]");
          const sceneEls = gsap.utils.toArray<HTMLElement>("[data-scene]", root);
          const steps = gsap.utils.toArray<HTMLElement>("[data-step]", root);
          const progress = root.querySelector("[data-progress]");
          if (!stage || sceneEls.length === 0) return;
          /* Shorter pin distance: the old full-viewport-per-scene felt “stuck” and fought conversion. */
          const perScene = mobile ? 0.42 : 0.55;

          gsap.set(sceneEls.slice(1), { autoAlpha: 0 });
          sceneEls.slice(1).forEach((scene) => gsap.set(scene.querySelectorAll("[data-line]"), { yPercent: 110 }));
          gsap.set(steps, { opacity: 0.4 });
          gsap.set(steps[0] ?? [], { opacity: 1 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${window.innerHeight * perScene * sceneEls.length}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: sceneEls.length }, 0);
          sceneEls.forEach((scene, index) => {
            const media = scene.querySelector("[data-media]");
            const lines = scene.querySelectorAll("[data-line]");
            if (media) tl.fromTo(media, { scale: 1.18 }, { scale: 1, duration: 1.3 }, Math.max(0, index - 0.3));
            if (index > 0) {
              tl.to(scene, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut" }, index - 0.3);
              tl.to(lines, { yPercent: 0, duration: 0.35, ease: "expo.out", stagger: 0.06 }, index - 0.1);
              if (steps[index]) tl.to(steps[index], { opacity: 1, duration: 0.2 }, index - 0.1);
            }
            if (index < sceneEls.length - 1) {
              tl.to(lines, { yPercent: -110, duration: 0.25, ease: "power2.in", stagger: 0.04 }, index + 0.6);
            }
          });
          tl.to({}, { duration: 0.4 });

          return () => {
            delete root.dataset.story;
          };
        },
      );
      return () => mm.revert();
    },
    { scope: ref, dependencies: [scenes.length] },
  );

  return (
    <div ref={ref} className="group/story">
      <div data-stage="" className="relative group-data-[story=on]/story:h-[100svh] group-data-[story=on]/story:overflow-hidden">
        {scenes.map((scene, index) => (
          <figure
            key={scene.key}
            data-scene=""
            className="relative h-[85svh] overflow-hidden group-data-[story=on]/story:absolute group-data-[story=on]/story:inset-0 group-data-[story=on]/story:h-full"
            style={{ zIndex: index + 1 }}
          >
            <div data-media="" className="absolute inset-0 will-change-transform">
              {scene.media}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-charcoal/10" />
            {scene.badge}
            <figcaption className="container-x absolute inset-x-0 bottom-0 pb-14 md:pb-20">
              <span className="block overflow-hidden">
                <span data-line="" className="block text-micro font-semibold tracking-wide text-cream/70">
                  {String(index + 1).padStart(2, "0")} · {scene.step}
                </span>
              </span>
              <span className="mt-2 block overflow-hidden pb-[0.12em]">
                <span data-line="" className="block max-w-4xl font-display text-[clamp(2.5rem,1.4rem+5vw,6rem)] leading-[1.02] tracking-[-0.02em]">
                  {scene.title}
                </span>
              </span>
              <span className="mt-3 block overflow-hidden">
                <span data-line="" className="block max-w-xl text-lead text-cream/80">
                  {scene.detail}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}

        <div aria-hidden="true" className="container-x absolute inset-x-0 top-[calc(var(--header-h)+1.25rem)] z-50 hidden group-data-[story=on]/story:block">
          <div className="flex justify-between gap-4 text-micro font-semibold text-cream">
            {scenes.map((scene) => (
              <span key={scene.key} data-step="">
                {scene.step}
              </span>
            ))}
          </div>
          <div className="mt-3 h-px w-full bg-cream/20">
            <span data-progress="" className="block h-full w-full origin-right bg-cream" />
          </div>
        </div>
      </div>
    </div>
  );
}
