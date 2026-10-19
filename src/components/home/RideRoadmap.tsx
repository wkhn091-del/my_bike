"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { SiteImage } from "@/lib/content/types";
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { IllustrativeTag } from "./IllustrativeTag";

type StagePhoto =
  | { kind: "static"; src: StaticImageData; alt: string }
  | { kind: "remote"; src: string; alt: string; lqip?: string | null };

type Stage = {
  id: string;
  label: string;
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

const STAGES: Stage[] = [
  {
    id: "01",
    label: "יציאה",
    title: "מתכנסים ויוצאים לשטח",
    description: "נקודת מפגש, חימום קצר, והקבוצה יוצאת יחד אל שבילי הגליל.",
    cta: { href: "#price", label: "לשמירת מקום" },
  },
  {
    id: "02",
    label: "עוצרים לאכול",
    title: "ארוחות לאורך היום",
    description: "עוצרים לאכול יחד, בלי לסחוב כלום ובלי לתכנן.",
    cta: { href: "#price", label: "לשמירת מקום" },
  },
  {
    id: "03",
    label: "לומדים בשטח",
    title: "לומדים טכניקה על הסינגל",
    description: "לומדים עליות, ירידות וקווים — ומיישמים עוד באותו יום.",
    cta: { href: "#route", label: "על המסלול" },
  },
  {
    id: "04",
    label: "מסיימים יחד",
    title: "מסיימים יחד בשקיעה",
    description: "מסיימים יחד בתצפית, בלי להתפזר בדרך חזרה.",
    cta: { href: "#price", label: "אני בפנים" },
  },
];

/* Keep nodes inset so they never clip off the locked 16:9 frame edges */
const NODE_T = [0.06, 0.35, 0.65, 0.94] as const;

const PATH_DESKTOP =
  "M 72 270 C 180 270 210 78 360 78 S 540 270 690 270 S 860 78 1128 110";

/** Mobile wave — x stays 56–344 inside 400-wide viewBox so nodes stay on-screen. */
const PATH_MOBILE = "M 56 260 C 110 260 130 56 200 56 S 290 260 344 200";

const VIEW_DESKTOP = { w: 1200, h: 360 };
const VIEW_MOBILE = { w: 400, h: 360 };

function stagePhotos(_gallery: SiteImage[]): StagePhoto[] {
  // Always use curated MTB day-stage landscapes — gallery photos belong in Moments, not here.
  return ILLUSTRATIVE.dayStages.map((photo) => ({ kind: "static" as const, src: photo.src, alt: photo.alt }));
}

function StageImage({ photo, priority }: { photo: StagePhoto; priority?: boolean }) {
  if (photo.kind === "static") {
    return (
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="100vw"
        priority={priority}
        placeholder="blur"
        className="object-cover object-center"
      />
    );
  }
  return (
    <Image
      src={photo.src}
      alt=""
      fill
      sizes="100vw"
      priority={priority}
      placeholder={photo.lqip ? "blur" : "empty"}
      blurDataURL={photo.lqip ?? undefined}
      className="object-cover object-center"
    />
  );
}

export function RideRoadmap({ gallery = [] }: { gallery?: SiteImage[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const photos = stagePhotos(gallery);
  const usingIllustrative = true;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 768px)",
        },
        (context) => {
          const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
          const stage = root.querySelector<HTMLElement>("[data-roadmap-stage]");
          const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", root);
          const bgs = gsap.utils.toArray<HTMLElement>("[data-bg-stage]", root);
          const tabs = gsap.utils.toArray<HTMLElement>("[data-tab]", root);
          const nodes = gsap.utils.toArray<HTMLElement>("[data-node]", root);
          const svg = root.querySelector<SVGSVGElement>("[data-roadmap-svg]");
          const base = root.querySelector<SVGPathElement>("[data-path-base]");
          const fill = root.querySelector<SVGPathElement>("[data-path-fill]");
          const glow = root.querySelector<SVGPathElement>("[data-path-glow]");
          if (!stage || panels.length === 0 || !svg || !base || !fill || !glow || nodes.length === 0) return;

          const pathD = desktop ? PATH_DESKTOP : PATH_MOBILE;
          const view = desktop ? VIEW_DESKTOP : VIEW_MOBILE;
          base.setAttribute("d", pathD);
          fill.setAttribute("d", pathD);
          glow.setAttribute("d", pathD);
          svg.setAttribute("viewBox", `0 0 ${view.w} ${view.h}`);
          const pathFrame = root.querySelector<HTMLElement>("[data-path-frame]");
          // Explicit svh — % height collapses when the flex parent only has min-height
          if (pathFrame) pathFrame.style.height = desktop ? "min(34svh, 15rem)" : "min(30svh, 12rem)";

          panels.forEach((panel) => {
            panel.classList.remove("invisible", "opacity-0");
            gsap.set(panel, { clearProps: "transform" });
          });
          // Opacity only — no y motion so UI stays locked over the photo
          gsap.set(panels, { autoAlpha: 0, y: 0, clearProps: "transform" });
          gsap.set(panels[0]!, { autoAlpha: 1, y: 0 });
          bgs.forEach((bg) => bg.classList.remove("opacity-0"));
          gsap.set(bgs, { autoAlpha: 0, y: 0, x: 0, scale: 1 });
          if (bgs[0]) gsap.set(bgs[0], { autoAlpha: 1 });
          tabs.forEach((tab, i) => tab.setAttribute("data-active", i === 0 ? "true" : "false"));
          nodes.forEach((n, i) => {
            if (i === 0) n.setAttribute("data-active", "true");
            else n.removeAttribute("data-active");
          });

          const stroke = desktop
            ? { base: 22, glow: 26, fill: 14 }
            : { base: 14, glow: 18, fill: 10 };
          base.setAttribute("stroke-width", String(stroke.base));
          glow.setAttribute("stroke-width", String(stroke.glow));
          fill.setAttribute("stroke-width", String(stroke.fill));

          const length = fill.getTotalLength();
          gsap.set([fill, glow], { strokeDasharray: length, strokeDashoffset: length });

          const placeNodes = () => {
            if (!pathFrame) return;
            const len = fill.getTotalLength();
            const ctm = fill.getScreenCTM();
            const frameRect = pathFrame.getBoundingClientRect();
            if (!ctm || frameRect.width < 2 || frameRect.height < 2) return;
            const svgPt = svg.createSVGPoint();
            nodes.forEach((node, i) => {
              const t = NODE_T[i] ?? 0;
              const pt = fill.getPointAtLength(len * t);
              svgPt.x = pt.x;
              svgPt.y = pt.y;
              const screen = svgPt.matrixTransform(ctm);
              gsap.set(node, {
                left: screen.x - frameRect.left,
                top: screen.y - frameRect.top,
                xPercent: -50,
                yPercent: -50,
              });
            });
          };
          placeNodes();
          // Layout may settle after pin — place again on next frames
          requestAnimationFrame(() => {
            placeNodes();
            requestAnimationFrame(placeNodes);
          });

          if (!motion) {
            gsap.set([fill, glow], { strokeDashoffset: 0 });
            nodes.forEach((n) => n.setAttribute("data-active", "true"));
            gsap.set(panels, { autoAlpha: 0, y: 0 });
            gsap.set(panels[panels.length - 1]!, { autoAlpha: 1 });
            gsap.set(bgs, { autoAlpha: 0 });
            if (bgs[bgs.length - 1]) gsap.set(bgs[bgs.length - 1]!, { autoAlpha: 1 });
            return;
          }

          root.dataset.roadmap = "on";
          let activeIndex = 0;
          let scrollTrigger: ScrollTrigger | undefined;

          const setActive = (next: number) => {
            if (next === activeIndex) return;
            const prev = activeIndex;
            activeIndex = next;

            nodes.forEach((node, i) => {
              if (i <= next) node.setAttribute("data-active", "true");
              else node.removeAttribute("data-active");
            });
            tabs.forEach((tab, i) => {
              const on = i === next;
              tab.setAttribute("data-active", on ? "true" : "false");
              tab.setAttribute("aria-selected", on ? "true" : "false");
            });
            gsap.killTweensOf([...panels, ...bgs]);
            panels.forEach((panel, i) => {
              const active = i === next;
              panel.setAttribute("aria-hidden", active ? "false" : "true");
              if (active) panel.removeAttribute("inert");
              else panel.setAttribute("inert", "");
            });

            if (bgs[prev]) gsap.to(bgs[prev]!, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut", overwrite: true });
            if (bgs[next]) gsap.to(bgs[next]!, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut", overwrite: true });
            if (panels[prev]) gsap.to(panels[prev]!, { autoAlpha: 0, duration: 0.2, ease: "power2.inOut", overwrite: true });
            if (panels[next]) gsap.to(panels[next]!, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut", overwrite: true });
          };

          const goTo = (index: number) => {
            const st = scrollTrigger;
            if (!st) {
              setActive(index);
              return;
            }
            const t = NODE_T[index] ?? 0;
            // Instant jump — no smooth scroll (avoids the stage/photo sliding up/down)
            window.scrollTo({ top: st.start + (st.end - st.start) * t, behavior: "auto" });
            setActive(index);
          };

          /* Fixed multiplier — avoid reading innerHeight inside scrub (mobile chrome thrash). */
          const pinDistance = desktop ? () => window.innerHeight * 2.6 : () => window.innerHeight * 2.2;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${pinDistance()}`,
              pin: true,
              scrub: 0.85,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                let idx = 0;
                for (let i = 0; i < NODE_T.length; i++) {
                  if (self.progress >= (NODE_T[i] ?? 0) - 0.02) idx = i;
                }
                setActive(idx);
              },
              onRefresh: () => placeNodes(),
            },
          });

          scrollTrigger = tl.scrollTrigger;
          tl.to([fill, glow], { strokeDashoffset: 0, duration: 1 }, 0);

          const onJump = (event: Event) => {
            const el = event.currentTarget as HTMLElement;
            goTo(Number(el.dataset.index ?? "0"));
          };
          [...nodes, ...tabs].forEach((el) => el.addEventListener("click", onJump));

          return () => {
            [...nodes, ...tabs].forEach((el) => el.removeEventListener("click", onJump));
            delete root.dataset.roadmap;
          };
        },
      );

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [] },
  );

  return (
    <section
      ref={rootRef}
      id="day"
      aria-labelledby="roadmap-title"
      className="roadmap-section relative overflow-hidden bg-[#121410] text-cream data-[roadmap=on]:select-none"
    >
      {/* Full-bleed locked stage — photo fills the viewport; UI stays on top of it */}
      <div
        data-roadmap-stage=""
        className="roadmap-stage relative min-h-[100svh]"
      >
        <div data-roadmap-lock="" className="absolute inset-0 overflow-hidden">
          {/* Stage photos — full bleed, no side bars */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {STAGES.map((stage, index) => (
              <div key={stage.id} data-bg-stage="" className={`absolute inset-0 ${index === 0 ? "" : "opacity-0"}`}>
                <StageImage photo={photos[index]!} priority={index === 0} />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-charcoal/45 via-charcoal/15 to-charcoal/55" />
            {usingIllustrative ? <IllustrativeTag className="z-[1]" /> : null}
          </div>
        </div>

        {/* UI locked over the full-bleed photo */}
        <div className="relative z-10 flex h-[100svh] min-h-[100svh] flex-col justify-between px-4 pb-3 pt-[calc(var(--header-h)+0.5rem)] md:px-10 md:pb-4 md:pt-[calc(var(--header-h)+1rem)]">
            <div className="mx-auto w-full max-w-4xl shrink-0">
              <div className="hidden flex-wrap justify-between gap-x-4 gap-y-1 text-micro font-semibold text-cream/70 md:flex" role="tablist" aria-label="שלבי היום">
                {STAGES.map((stage, index) => (
                  <button
                    key={stage.id}
                    type="button"
                    role="tab"
                    data-tab=""
                    data-index={index}
                    data-active={index === 0 ? "true" : "false"}
                    aria-selected={index === 0}
                    className="roadmap-tab shrink-0 pb-1 text-cream/70 transition-colors data-[active=true]:text-cream data-[active=true]:shadow-[inset_0_-2px_0_0_rgb(244_237_224/0.85)]"
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
              <div className="mx-auto mt-0 hidden h-px max-w-4xl bg-cream/20 md:mt-1.5 md:block" />

              <p className="mt-2 text-center text-[0.65rem] font-semibold tracking-[0.16em] text-cream/55 md:mt-3 md:text-micro">
                מפת היום
              </p>
              <h2 id="roadmap-title" className="sr-only">
                מסלול היום ברכיבה
              </h2>

              <div className="relative mx-auto mt-1 text-center" style={{ height: "7.75rem" }}>
                {STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    data-panel=""
                    role="tabpanel"
                    className={`absolute inset-x-0 top-0 ${index === 0 ? "" : "invisible opacity-0"}`}
                    aria-hidden={index === 0 ? undefined : true}
                    {...(index === 0 ? {} : { inert: true })}
                  >
                    <p className="text-[0.65rem] font-semibold tracking-wide text-sunset md:text-micro">
                      {stage.id} · {stage.label}
                    </p>
                    <p className="mt-0.5 font-display text-[clamp(1.15rem,3.6vw,2.35rem)] leading-[1.12] tracking-[-0.02em]">
                      {stage.title}
                    </p>
                    <p className="mx-auto mt-1 hidden max-w-xl text-[0.95rem] leading-snug text-cream/85 md:mt-1.5 md:block">
                      {stage.description}
                    </p>
                    <p className="mx-auto mt-1 line-clamp-2 max-w-sm text-[0.8rem] leading-snug text-cream/85 md:hidden">
                      {stage.description}
                    </p>
                    {stage.cta ? (
                      <p className="mt-1.5 md:mt-2">
                        <Link
                          href={stage.cta.href}
                          className="inline-flex rounded-full border border-cream/25 bg-charcoal/40 px-3.5 py-1 text-[0.75rem] font-semibold text-cream backdrop-blur-md transition hover:border-sunset/50 hover:bg-sunset/20 md:px-5 md:py-1.5 md:text-small"
                        >
                          {stage.cta.label}
                        </Link>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full shrink-0" data-path-frame="" style={{ height: "min(34svh, 15rem)" }}>
              <svg
                data-roadmap-svg=""
                viewBox="0 0 1200 360"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <filter id="roadmap-glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="roadmap-accent" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c45f1f" />
                    <stop offset="50%" stopColor="#e07a2e" />
                    <stop offset="100%" stopColor="#ea8c45" />
                  </linearGradient>
                </defs>
                <path data-path-base="" d={PATH_DESKTOP} fill="none" stroke="rgb(244 237 224 / 0.22)" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
                <path data-path-glow="" d={PATH_DESKTOP} fill="none" stroke="url(#roadmap-accent)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} filter="url(#roadmap-glow)" />
                <path data-path-fill="" d={PATH_DESKTOP} fill="none" stroke="url(#roadmap-accent)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" filter="url(#roadmap-glow)" />
              </svg>

              {STAGES.map((stage, index) => (
                <button
                  key={stage.id}
                  type="button"
                  data-node=""
                  data-index={index}
                  aria-label={`${stage.id} ${stage.label}`}
                  className="roadmap-node absolute left-0 top-0 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[0.85rem] border border-white/20 bg-charcoal/60 text-[0.75rem] font-bold tracking-wide text-cream/55 backdrop-blur-md hover:border-sunset/40 md:size-14 md:rounded-[1.05rem] md:text-small"
                >
                  <span className="roadmap-node-glow pointer-events-none absolute inset-0 rounded-[inherit]" />
                  <span className="relative tabular-nums">{stage.id}</span>
                </button>
              ))}
            </div>

            <p className="shrink-0 text-center text-[0.65rem] text-cream/70 md:text-micro">גללו או לחצו על שלב</p>
        </div>
      </div>
    </section>
  );
}
