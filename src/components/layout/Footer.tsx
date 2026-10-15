import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { BrandIcon, type BrandName } from "@/components/ui/BrandIcon";
import type { SiteSettings } from "@/lib/content/types";

const EVENT_LINKS = [
  ["/#day", "מהלך היום"],
  ["/#route", "המסלול"],
  ["/#included", "מה כלול"],
  ["/#faq", "שאלות נפוצות"],
  ["/register", "הרשמה"],
] as const;

const MORE_LINKS = [
  ["/#coaching", "ליווי שנתי"],
  ["/#price", "מחיר והחזרים"],
] as const;

const LEGAL_LINKS = [
  ["/terms", "תנאי השתתפות"],
  ["/privacy", "מדיניות פרטיות"],
  ["/accessibility", "הצהרת נגישות"],
  ["/cookies", "מדיניות עוגיות"],
] as const;

function Col({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-cream/40 uppercase">{title}</p>
      <ul className="mt-4 space-y-1">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-10 items-center text-[0.9rem] text-cream/70 transition-colors hover:text-cream"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Premium dark footer. No WhatsApp here — ContactBand + float cover that. */
export function Footer({ settings, cta }: { settings: SiteSettings; cta?: ReactNode }) {
  const business = [settings.legalName, settings.vatNumber ? `עוסק מורשה ${settings.vatNumber}` : null, settings.address].filter(Boolean);
  const social: Array<{ name: BrandName; href: string; label: string }> = [
    settings.instagramUrl ? { name: "instagram" as const, href: settings.instagramUrl, label: "אינסטגרם" } : null,
    settings.facebookUrl ? { name: "facebook" as const, href: settings.facebookUrl, label: "פייסבוק" } : null,
    settings.stravaUrl ? { name: "strava" as const, href: settings.stravaUrl, label: "סטרבה" } : null,
    settings.youtubeUrl ? { name: "youtube" as const, href: settings.youtubeUrl, label: "יוטיוב" } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="bg-charcoal text-cream">
      {cta}

      <div className="border-t border-cream/[0.08]">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:px-8 md:pt-20 md:pb-14">
          <div className="grid gap-12 md:grid-cols-[1.35fr_1fr_1fr_1fr] md:gap-10 lg:gap-14">
            <div className="max-w-xs">
              <Logo tone="light" />
              <p className="mt-4 text-[0.9rem] leading-relaxed text-cream/55">
                רכיבות קהילה וליווי שנתי לרוכבי שטח, עם יואב לוי.
              </p>
              {social.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-3">
                  {social.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="inline-flex size-9 items-center justify-center rounded-full border border-cream/12 text-cream/60 transition-colors hover:border-cream/30 hover:text-cream"
                      >
                        <BrandIcon name={item.name} className="size-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <Col title="יום הקהילה" links={EVENT_LINKS} />
            <Col title="עוד" links={MORE_LINKS} />

            <div>
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-cream/40 uppercase">יצירת קשר</p>
              <ul className="mt-4 space-y-1">
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/\D/g, "")}`}
                    className="inline-flex min-h-10 items-center text-[0.9rem] text-cream/70 transition-colors hover:text-cream"
                  >
                    <bdi dir="ltr">{settings.phone}</bdi>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex min-h-10 items-center text-[0.9rem] text-cream/70 transition-colors hover:text-cream"
                  >
                    <bdi dir="ltr">{settings.email}</bdi>
                  </a>
                </li>
              </ul>
              {settings.answeringHours ? (
                <p className="mt-3 text-[0.8rem] leading-relaxed text-cream/40">שעות מענה: {settings.answeringHours}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-5 border-t border-cream/[0.08] pt-6 md:mt-16 md:flex-row md:items-center md:justify-between md:gap-8">
            <nav aria-label="מידע משפטי">
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {LEGAL_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-9 items-center text-[0.75rem] text-cream/40 transition-colors hover:text-cream/70">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-1 text-[0.75rem] text-cream/35 md:items-end md:text-end">
              <p>
                © <bdi>{new Date().getFullYear()}</bdi> <bdi dir="ltr">RideWithYoav</bdi>
              </p>
              {business.length ? <p className="max-w-sm leading-relaxed">{business.join(" · ")}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
