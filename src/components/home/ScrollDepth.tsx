"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

/** 25 / 50 / 75 / 100% scroll-depth events (PROJECT_BRIEF §3). */
export function ScrollDepth() {
  useEffect(() => {
    const marks = [25, 50, 75, 100];
    const sent = new Set<number>();
    let frame = 0;
    const check = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const percent = (window.scrollY / max) * 100;
      for (const mark of marks) {
        if (percent >= mark - 1 && !sent.has(mark)) {
          sent.add(mark);
          track({ name: "scroll_depth", percent: mark });
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
