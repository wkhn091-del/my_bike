import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { BrandIcon, type BrandName } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import type { SiteSettings } from "@/lib/content/types";

const NAV_LINKS = [
  ["/#day", "מהלך היום"],
  ["/#route", "המסלול"],
  ["/#included", "מה כלול"],
  ["/#faq", "שאלות נפוצות"],
  ["/#coaching", "ליווי שנתי"],
  ["/register", "הרשמה"],
] as const;

const LEGAL_LINKS = [
  ["/terms", "תנאי השתתפות"],
  ["/privacy", "מדיניות פרטיות"],
  ["/accessibility", "הצהרת נגישות"],
  ["/cookies", "מדיניות עוגיות"],
] as const;

/** `cta` is the page's mini-hero (closing seats), rendered above the footer chrome. */
export function Footer({ settings, cta }: { settings: SiteSettings; cta?: ReactNode }) {
  const business = [settings.legalName, settings.vatNumber ? `עוסק מורשה ${settings.vatNumber}` : null, settings.address].filter(Boolean);
  // WhatsApp is already in the contact row + float — don't duplicate it here.
  const social: Array<{ name: BrandName; href: string; label: string }> = [
    settings.instagramUrl ? { name: "instagram" as const, href: settings.instagramUrl, label: "האינסטגרם של יואב" } : null,
    settings.facebookUrl ? { name: "facebook" as const, href: settings.facebookUrl, label: "הפייסבוק של יואב" } : null,
    settings.stravaUrl ? { name: "strava" as const, href: settings.stravaUrl, label: "יואב בסטרבה" } : null,
    settings.youtubeUrl ? { name: "youtube" as const, href: settings.youtubeUrl, label: "ערוץ היוטיוב של יואב" } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="bg-charcoal text-cream">
      {cta}

      <div className="border-t border-cream/10">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center px-5 pt-10 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] text-center md:max-w-6xl md:items-stretch md:px-8 md:pt-14 md:pb-12 md:text-start">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Logo tone="light" />
            <p className="mt-3 max-w-xs text-[0.9rem] leading-relaxed text-cream/60 md:max-w-sm">
              רכיבות קהילה וליווי שנתי לרוכבי שטח, עם יואב לוי.
            </p>
          </div>

          {/* Contact — stacked full-width on phone */}
          <div className="mt-6 flex w-full flex-col gap-2.5 md:mt-5 md:max-w-md md:flex-row">
            <a
              href={`tel:${settings.phone.replace(/\D/g, "")}`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cream/20 px-4 text-[0.9rem] text-cream/90 transition-colors hover:border-cream/40 hover:bg-cream/5"
            >
              <Icon name="phone" className="size-4 shrink-0 text-cream/55" />
              <bdi dir="ltr">{settings.phone}</bdi>
            </a>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cream/20 px-4 text-[0.9rem] text-cream/90 transition-colors hover:border-cream/40 hover:bg-cream/5"
            >
              <BrandIcon name="whatsapp" className="size-4 shrink-0 text-cream/55" />
              וואטסאפ
            </a>
          </div>

          <a
            href={`mailto:${settings.email}`}
            className="mt-4 text-[0.875rem] text-cream/55 underline-offset-4 hover:text-cream hover:underline"
          >
            <bdi dir="ltr">{settings.email}</bdi>
          </a>
          {settings.answeringHours ? (
            <p className="mt-1.5 text-[0.8rem] text-cream/40">שעות מענה: {settings.answeringHours}</p>
          ) : null}

          {/* Nav — single column on mobile, wrap row on desktop */}
          <nav aria-label="ניווט באתר" className="mt-9 w-full border-t border-cream/10 pt-8 md:mt-10 md:pt-10">
            <p className="mb-4 text-[0.7rem] font-semibold tracking-[0.16em] text-cream/40 uppercase">ניווט</p>
            <ul className="mx-auto flex max-w-xs flex-col items-center gap-0.5 md:mx-0 md:max-w-none md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-x-1 md:gap-y-1">
              {NAV_LINKS.map(([href, label]) => (
                <li key={href} className="w-full md:w-auto">
                  <Link
                    href={href}
                    className="inline-flex min-h-11 w-full items-center justify-center text-[0.95rem] text-cream/80 transition-colors hover:text-cream md:w-auto md:justify-start md:px-3"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social — only if real profiles exist */}
          {social.length > 0 ? (
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {social.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-cream/35 hover:text-cream"
                  >
                    <BrandIcon name={item.name} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Legal — one quiet row */}
          <nav aria-label="מידע משפטי" className="mt-8 w-full border-t border-cream/10 pt-6">
            <ul className="flex flex-col items-center gap-0.5 md:flex-row md:flex-wrap md:justify-start md:gap-x-1">
              {LEGAL_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-10 items-center px-2 text-[0.8rem] text-cream/45 transition-colors hover:text-cream/80"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <div className="mt-6 flex w-full flex-col items-center gap-1.5 border-t border-cream/10 pt-5 text-[0.75rem] text-cream/35 md:flex-row md:justify-between md:gap-4">
            <p>
              © <bdi>{new Date().getFullYear()}</bdi> <bdi dir="ltr">RideWithYoav</bdi>
            </p>
            {business.length ? <p className="max-w-md leading-relaxed">{business.join(" · ")}</p> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
