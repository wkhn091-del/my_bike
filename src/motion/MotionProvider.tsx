"use client";

import "./motion.css";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ScrollTrigger } from "./gsap";

/**
 * Refresh ScrollTrigger after navigation / first paint only.
 * Do NOT ResizeObserver the body: pin-spacers change height and that
 * creates an infinite refresh loop (page feels like it reloads forever).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const id = requestAnimationFrame(refresh);
    void document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("load", refresh);
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
