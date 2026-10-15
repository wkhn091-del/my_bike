"use client";

import "./motion.css";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ScrollTrigger } from "./gsap";

/**
 * The kit's provider without Lenis: smooth scrolling is off (module A-3 — on touch it does nothing,
 * on desktop it changes the scroll speed). It only keeps ScrollTrigger measurements fresh.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Images, fonts and client navigation change the page height after load.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    observer.observe(document.body);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
