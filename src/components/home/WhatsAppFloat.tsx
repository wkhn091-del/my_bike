"use client";

import { useEffect, useState } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { CtaLink } from "@/components/ui/CtaLink";

/** Appears once the hero CTA has scrolled away, so it never covers the hero; sits above the mobile sticky CTA. */
export function WhatsAppFloat({ number }: { number: string }) {
  const [visible, setVisible] = useState(false);
  const text = encodeURIComponent("היי יואב, יש לי שאלה על יום הקהילה");

  useEffect(() => {
    const target = document.getElementById("hero-cta");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed end-4 bottom-[calc(env(safe-area-inset-bottom)+6.75rem)] z-30 transition-[transform,opacity] duration-[var(--motion-base)] ease-[var(--ease-soft-out)] md:bottom-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <CtaLink
        href={`https://wa.me/${number}?text=${text}`}
        location="float"
        kind="whatsapp"
        className="inline-flex size-12 items-center justify-center gap-2 rounded-full bg-olive text-small font-semibold text-cream shadow-soft hover:bg-olive-deep md:size-auto md:min-h-12 md:px-4"
      >
        <BrandIcon name="whatsapp" className="size-5" />
        <span className="sr-only md:not-sr-only">שאלה ליואב בוואטסאפ</span>
      </CtaLink>
    </div>
  );
}
