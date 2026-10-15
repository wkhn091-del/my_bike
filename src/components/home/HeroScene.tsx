"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroSceneCanvas = dynamic(() => import("./HeroSceneCanvas").then((module) => module.HeroSceneCanvas), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="rounded-full border border-cream/20 bg-charcoal/70 px-4 py-2 text-micro font-semibold text-cream backdrop-blur-sm">
        מכינים את המסלול…
      </div>
    </div>
  ),
});

type NavigatorWithMemory = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

function supportsScene(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as NavigatorWithMemory;
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory && nav.deviceMemory <= 2) return false;
  return true;
}

/**
 * Poster paints first from the server. WebGL is progressive enhancement only.
 */
export function HeroScene() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (supportsScene()) setEnabled(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div data-hero-scene={enabled ? "enabled" : "poster"} className="hero-scene absolute inset-0">
      {enabled ? <HeroSceneCanvas /> : null}
    </div>
  );
}
