"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * A statement that lights up word by word as the visitor scrolls through it. Words, never letters,
 * so Hebrew shaping is untouched. The full text is always in the DOM; reduced motion shows it lit.
 */
export function ScrollWords({ text, as: Tag = "p", className, dim = 0.16 }: { text: string; as?: "p" | "blockquote"; className?: string; dim?: number }) {
  const ref = useRef<HTMLElement>(null);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el.querySelectorAll("[data-word]"),
        { opacity: dim },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        },
      );
    },
    { scope: ref, dependencies: [text, dim] },
  );

  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag ref={setRef} className={className}>
      {words.map((word, index) => (
        <span key={`${index}-${word}`} data-word="">
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
