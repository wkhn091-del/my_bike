"use client";

import { useEffect, useState } from "react";
import { CtaLink } from "@/components/ui/CtaLink";

/** Mobile bar that slides up once the hero CTA has scrolled out of view (A-3: `base`, translateY). */
export function StickyCta({ label, note, href }: { label: string; note: string; href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-cta");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm transition-[transform,opacity] duration-[var(--motion-base)] ease-[var(--ease-soft-out)] motion-reduce:transition-opacity md:hidden ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 motion-reduce:translate-y-0"
      }`}
    >
      <CtaLink href={href} location="sticky" className="btn-primary w-full">
        {label}
      </CtaLink>
      <p className="mt-1.5 text-center text-micro text-charcoal-soft">{note}</p>
    </div>
  );
}
