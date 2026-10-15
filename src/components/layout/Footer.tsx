import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { BrandIcon, type BrandName } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import type { SiteSettings } from "@/lib/content/types";

const EVENT_LINKS = [
  ["/#day", "מהלך היום"],
  ["/#route", "המסלול"],
  ["/#included", "מה כלול"],
  ["/#faq", "שאלות נפוצות"],
  ["/register", "הרשמה"],
] as const;

const LEGAL_LINKS = [
  ["/terms", "תנאי השתתפות"],
  ["/privacy", "מדיניות פרטיות"],
  ["/accessibility", "הצהרת נגישות"],
  ["/cookies", "מדיניות עוגיות"],
] as const;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 className="text-center font-sans text-[0.75rem] font-semibold tracking-[0.14em] text-cream/50 uppercase md:text-start md:text-[0.8125rem] md:normal-case md:tracking-wide">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** `cta` is the page's mini-hero (closing seats), rendered above the footer chrome. */
export function Footer({ settings, cta }: { settings: SiteSettings; cta?: ReactNode }) {
  const business = [settings.legalName, settings.vatNumber ? `עוסק מורשה ${settings.vatNumber}` : null, settings.address].filter(Boolean);
  const social: Array<{ name: BrandName; href: string; label: string }> = [
    settings.instagramUrl ? { name: "instagram" as const, href: settings.instagramUrl, label: "האינסטגרם של יואב" } : null,
    settings.facebookUrl ? { name: "facebook" as const, href: settings.facebookUrl, label: "הפייסבוק של יואב" } : null,
    settings.stravaUrl ? { name: "strava" as const, href: settings.stravaUrl, label: "יואב בסטרבה" } : null,
    settings.youtubeUrl ? { name: "youtube" as const, href: settings.youtubeUrl, label: "ערוץ היוטיוב של יואב" } : null,
    { name: "whatsapp" as const, href: `https://wa.me/${settings.whatsapp}`, label: "וואטסאפ ליואב" },
  ].filter((item) => item !== null);

  return (
    <footer className="bg-charcoal text-cream">
      {cta}
      <div className="container-x mx-auto max-w-6xl border-t border-cream/10 pt-10 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:pt-14 md:pb-10">
        {/* Brand + contact — centered on mobile, start-aligned on desktop */}
        <div className="flex flex-col items-center text-center md:items-start md:text-start">
          <Logo tone="light" />
          <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-cream/65">
            רכיבות קהילה וליווי שנתי לרוכבי שטח, עם יואב לוי.
          </p>
          <div className="mt-5 flex w-full max-w-sm flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center md:justify-start md:gap-3">
            <a
              href={`tel:${settings.phone.replace(/\D/g, "")}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-cream/20 px-4 text-[0.875rem] transition-colors hover:bg-cream/10 md:flex-none md:justify-start md:rounded-none md:border-0 md:px-0 md:hover:bg-transparent"
            >
              <Icon name="phone" className="size-4 text-cream/60" />
              <bdi dir="ltr">{settings.phone}</bdi>
            </a>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-cream/20 px-4 text-[0.875rem] transition-colors hover:bg-cream/10 md:flex-none md:justify-start md:rounded-none md:border-0 md:px-0 md:hover:bg-transparent"
            >
              <BrandIcon name="whatsapp" className="size-4 text-cream/60" />
              וואטסאפ
            </a>
          </div>
          <a href={`mailto:${settings.email}`} className="mt-3 text-[0.875rem] text-cream/60 underline-offset-4 hover:text-cream hover:underline">
            <bdi dir="ltr">{settings.email}</bdi>
          </a>
          {settings.answeringHours ? <p className="mt-2 text-[0.8125rem] text-cream/50">שעות מענה: {settings.answeringHours}</p> : null}
        </div>

        {/* Link columns — stacked & centered on mobile, grid on desktop */}
        <div className="mt-10 grid gap-8 border-t border-cream/10 pt-8 md:mt-12 md:grid-cols-3 md:gap-10 md:pt-10">
          <Group title="יום הקהילה">
            <ul className="flex flex-col items-center gap-1 md:items-start">
              {EVENT_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-10 items-center px-2 text-[0.9375rem] text-cream/80 transition-colors hover:text-cream md:px-0">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Group>

          <Group title="עוד מיואב">
            <ul className="flex flex-col items-center gap-1 md:items-start">
              <li>
                <Link href="/#coaching" className="inline-flex min-h-10 items-center px-2 text-[0.9375rem] text-cream/80 transition-colors hover:text-cream md:px-0">
                  ליווי שנתי
                </Link>
              </li>
            </ul>
            <ul className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {social.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-cream/15 text-cream/75 transition-[transform,color,border-color] hover:-translate-y-0.5 hover:border-cream/40 hover:text-cream"
                  >
                    <BrandIcon name={item.name} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </Group>

          <Group title="מידע משפטי">
            <nav aria-label="מידע משפטי">
              <ul className="flex flex-col items-center gap-1 md:items-start">
                {LEGAL_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-10 items-center px-2 text-[0.9375rem] text-cream/80 transition-colors hover:text-cream md:px-0">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Group>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-cream/10 pt-5 text-center text-[0.8125rem] text-cream/45 md:mt-12 md:flex-row md:justify-between md:text-start">
          <p>
            © <bdi>{new Date().getFullYear()}</bdi> <bdi dir="ltr">RideWithYoav</bdi>
          </p>
          {business.length ? <p className="max-w-md">{business.join(" · ")}</p> : null}
        </div>
      </div>
    </footer>
  );
}
