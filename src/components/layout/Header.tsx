"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { CtaLink } from "@/components/ui/CtaLink";

const NAV = [
  { href: "/#price", label: "מחיר" },
  { href: "/#included", label: "מה כלול" },
  { href: "/#route", label: "המסלול" },
  { href: "/#contact", label: "צור קשר" },
] as const;

/**
 * RTL header: nav + filled CTA on the right (CTA outermost), logo on the left.
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
        light ? "border-b border-transparent bg-transparent" : "border-b border-charcoal/10 bg-cream"
      }`}
    >
      <div className="flex h-full w-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 md:px-8 lg:px-10">
        {/* First in RTL = right: CTA + nav */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-5 md:gap-7">
          {showCta ? (
            <CtaLink
              href="/register"
              location="header"
              className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 text-[0.8rem] font-semibold touch-manipulation transition-colors sm:min-h-10 sm:px-5 sm:text-[0.9rem] ${
                light
                  ? "border border-cream/70 bg-transparent text-cream hover:bg-cream/10"
                  : "bg-charcoal text-cream hover:bg-charcoal/90"
              }`}
            >
              {ctaLabel}
            </CtaLink>
          ) : null}
          <nav aria-label="ניווט ראשי" className="hidden items-center gap-5 md:flex lg:gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[0.95rem] font-medium transition-colors ${
                  light ? "text-cream/90 hover:text-cream" : "text-charcoal hover:text-olive-deep"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Logo tone={light ? "light" : "dark"} className="shrink-0" />
      </div>
    </header>
  );
}
