"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { CtaLink } from "@/components/ui/CtaLink";

/**
 * `overHero`: the header floats transparent over the full-screen hero photo and turns solid once the
 * visitor scrolls. Its CTA stays an outline so the hero's orange button is the only accent on screen.
 */
export function Header({ showCta = true, ctaLabel = "להרשמה", overHero = false }: { showCta?: boolean; ctaLabel?: string; overHero?: boolean }) {
  const [solid, setSolid] = useState(!overHero);

  useEffect(() => {
    if (!overHero) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSolid(window.scrollY > 48));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [overHero]);

  const light = overHero && !solid;
  return (
    <header
      className={`${overHero ? "fixed inset-x-0" : "sticky"} top-0 z-40 h-[var(--header-h)] transition-[background-color,border-color] duration-[var(--motion-base)] ${
        light ? "border-b border-transparent bg-transparent" : "border-b border-line bg-cream/90 backdrop-blur-md"
      }`}
    >
      <div className="container-x flex h-full items-center justify-between">
        <Logo tone={light ? "light" : "dark"} />
        {showCta ? (
          <CtaLink
            href="/register"
            location="header"
            className={`btn-secondary min-h-10 px-4 transition-colors ${light ? "border-cream/70 text-cream hover:bg-cream/10" : ""}`}
          >
            {ctaLabel}
          </CtaLink>
        ) : null}
      </div>
    </header>
  );
}
