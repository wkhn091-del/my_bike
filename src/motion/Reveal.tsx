"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motionSettings } from "./config";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

export interface RevealProps {
  children: ReactNode;
  as?: "div" | "ol" | "ul" | "dl";
  className?: string;
  style?: CSSProperties;
  /** Animate each direct child one after another instead of the whole block. */
  stagger?: boolean;
}

/** Fades and lifts content in once when it scrolls into view. Below the fold only (rule 2). */
export function Reveal({ children, as: Tag = "div", className, style, stagger = false }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      el.removeAttribute("data-motion-pending");
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        stagger ? Array.from(el.children) : el,
        { autoAlpha: 0, y: motionSettings.distance },
        {
          autoAlpha: 1,
          y: 0,
          duration: motionSettings.duration,
          ease: motionSettings.ease,
          stagger: stagger ? motionSettings.stagger : 0,
          scrollTrigger: { trigger: el, start: motionSettings.start, toggleActions: "play none none none" },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={setRef} className={className} style={style} data-motion-pending="">
      {children}
    </Tag>
  );
}
