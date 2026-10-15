"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics/track";

type Props = {
  href: string;
  location: string;
  children: ReactNode;
  className?: string;
  id?: string;
  kind?: "cta" | "whatsapp";
};

export function CtaLink({ href, location, children, className = "btn-primary", id, kind = "cta" }: Props) {
  const external = href.startsWith("https://");
  const onClick = () => track(kind === "whatsapp" ? { name: "whatsapp_click", location } : { name: "cta_click", location });
  if (external) {
    return (
      <a href={href} id={id} className={className} onClick={onClick} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} id={id} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
