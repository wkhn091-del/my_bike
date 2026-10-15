"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * Desktop-only cursor: a dot that tracks the pointer exactly and a ring that follows on a spring.
 * Links and buttons swell the ring; elements with `data-cursor="label"` open it into a labelled lens.
 * Touch screens and reduced-motion visitors keep the native cursor and never mount the effect.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(ring, { scale: 0.45 });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.55, ease: "expo.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.55, ease: "expo.out" });
    let mode: "idle" | "link" | "lens" = "idle";

    const setMode = (next: typeof mode, text = "") => {
      if (next === mode && label.textContent === text) return;
      mode = next;
      label.textContent = text;
      gsap.to(ring, { scale: next === "lens" ? 1 : next === "link" ? 0.75 : 0.45, duration: 0.45, ease: "power3.out" });
      gsap.to(ring, {
        backgroundColor: next === "lens" ? "rgb(31 33 28 / 0.88)" : next === "link" ? "rgb(31 33 28 / 0.45)" : "rgb(31 33 28 / 0.2)",
        duration: 0.25,
      });
      gsap.to(label, { autoAlpha: next === "lens" ? 1 : 0, duration: 0.2 });
      gsap.to(dot, { autoAlpha: next === "idle" ? 1 : 0, duration: 0.2 });
    };

    const onMove = (event: PointerEvent) => {
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      const target = event.target instanceof Element ? event.target : null;
      const lens = target?.closest<HTMLElement>("[data-cursor]");
      if (lens) setMode("lens", lens.dataset.cursor ?? "");
      else if (target?.closest("a, button, summary, label, [role=button]")) setMode("link");
      else setMode("idle");
    };
    const onLeave = () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
    const onDown = () => gsap.to(ring, { scale: "*=0.85", duration: 0.15, ease: "power2.out" });
    const onUp = () => setMode(mode === "idle" ? "link" : mode, label.textContent ?? "");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  });

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      {/* No mix-blend-difference: on warm sunset photos it inverted into a cyan/blue blob. */}
      <div
        ref={ringRef}
        className="invisible fixed top-0 left-0 flex size-[4.5rem] items-center justify-center rounded-full border border-cream/90 bg-charcoal/35 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
      >
        <span ref={labelRef} className="invisible px-2 text-center text-[0.75rem] font-bold leading-tight text-cream" />
      </div>
      <div ref={dotRef} className="invisible fixed top-0 left-0 size-1.5 rounded-full bg-sunset shadow-[0_0_0_3px_rgba(224,122,46,0.25)]" />
    </div>
  );
}
