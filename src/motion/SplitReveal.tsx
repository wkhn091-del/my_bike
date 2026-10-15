"use client";

import { Children, isValidElement, useRef, type ReactNode } from "react";
import { motionSettings } from "./config";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "./gsap";

export interface SplitRevealProps {
  children: ReactNode;
  as?: "h2" | "h3";
  className?: string;
  id?: string;
}

function textOf(node: ReactNode): string {
  let out = "";
  Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") out += child;
    else if (isValidElement<{ children?: ReactNode }>(child)) out += textOf(child.props.children);
  });
  return out;
}

/**
 * Section headings (H2) rise line by line from behind a mask. Lines, not letters, so Hebrew
 * shaping is never broken. Never used on the H1 (rule 2: the hero headline is there immediately).
 * SplitText rewrites the heading's DOM, so React must never diff inside it: a text change
 * remounts the element (key) and re-splits it.
 */
export function SplitReveal({ children, as: Tag = "h2", className, id }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };
  const signature = textOf(children);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      el.removeAttribute("data-motion-pending");
      if (prefersReducedMotion()) return;

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "mk-split-line",
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: motionSettings.duration,
            ease: motionSettings.ease,
            stagger: motionSettings.stagger,
            scrollTrigger: { trigger: el, start: motionSettings.start, once: true },
          });
        },
      });
      return () => split.revert();
    },
    { dependencies: [signature] },
  );

  return (
    <Tag key={signature} ref={setRef} id={id} className={className} data-motion-pending="">
      {children}
    </Tag>
  );
}
