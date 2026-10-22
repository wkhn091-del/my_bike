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
    <div className="min-w-0">
      <p className="text-[0.7rem] font-semibold tracking-[0.08em] text-cream/80">{title}</p>
      <ul className="mt-3 space-y-0.5 md:mt-4 md:space-y-1">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-10 items-center text-[0.875rem] text-cream/80 transition-colors hover:text-cream md:text-[0.9rem]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mobile: brand + balanced 2-column links. Desktop: 4-column premium grid. No WhatsApp. */
export function Footer({ settings, cta }: { settings: SiteSettings; cta?: ReactNode }) {
  const business = [
    settings.legalName ?? "יואב לוי",
    settings.vatNumber ? `עוסק מורשה ${settings.vatNumber}` : "עוסק מורשה",
    settings.address,
    settings.phone,
    settings.email,
  ].filter(Boolean);
  const social: Array<{ name: BrandName; href: string; label: string }> = [
    settings.instagramUrl ? { name: "instagram" as const, href: settings.instagramUrl, label: "אינסטגרם" } : null,
    settings.facebookUrl ? { name: "facebook" as const, href: settings.facebookUrl, label: "פייסבוק" } : null,
    settings.stravaUrl ? { name: "strava" as const, href: settings.stravaUrl, label: "סטרבה" } : null,
    settings.youtubeUrl ? { name: "youtube" as const, href: settings.youtubeUrl, label: "יוטיוב" } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="bg-[#1a2214] text-cream">
      {cta}

      <div className="border-t border-cream/[0.1]">
        <div className="mx-auto w-full max-w-6xl px-5 pt-12 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:px-8 md:pt-20 md:pb-14">
          {/* Brand — full width */}
          <div className="flex flex-col items-center text-center md:items-start md:text-start">
            <Logo tone="light" />
            {social.length > 0 ? (
              <ul className="mt-5 flex flex-wrap justify-center gap-2.5 md:justify-start">
                {social.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.label} (נפתח בחלון חדש)`}
                      className="inline-flex size-9 items-center justify-center rounded-full border border-cream/20 text-cream/85 transition-colors hover:border-cream/40 hover:text-cream"
                    >
                      <BrandIcon name={item.name} className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Links — 2 equal columns on phone, 3 on desktop */}
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-cream/[0.08] pt-8 md:mt-14 md:grid-cols-3 md:gap-10 md:pt-12">
            <Col title="יום הקהילה" links={EVENT_LINKS} />

            <div className="min-w-0 space-y-8">
              <Col title="עוד" links={MORE_LINKS} />
              <div>
                <p className="text-[0.7rem] font-semibold tracking-[0.08em] text-cream/80">יצירת קשר</p>
                <ul className="mt-3 space-y-0.5 md:mt-4">
                  <li>
                    <a
                      href={`tel:${settings.phone.replace(/\D/g, "")}`}
                      className="inline-flex min-h-10 items-center text-[0.875rem] text-cream/80 transition-colors hover:text-cream md:text-[0.9rem]"
                    >
                      <bdi dir="ltr">{settings.phone}</bdi>
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${settings.email}`}
                      className="inline-flex min-h-10 max-w-full items-center break-all text-[0.875rem] text-cream/85 transition-colors hover:text-cream md:text-[0.9rem]"
                    >
                      <bdi dir="ltr">{settings.email}</bdi>
                    </a>
                  </li>
                </ul>
                {settings.answeringHours ? (
                  <p className="mt-2 text-[0.75rem] leading-relaxed text-cream/80">שעות מענה: {settings.answeringHours}</p>
                ) : null}
              </div>
            </div>

            {/* Legal sits as 3rd col on desktop; on mobile merges into bottom bar */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-[0.7rem] font-semibold tracking-[0.08em] text-cream/80">מידע משפטי</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5 md:mt-4 md:grid-cols-1">
                {LEGAL_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex min-h-10 items-center text-[0.8rem] text-cream/80 transition-colors hover:text-cream md:text-[0.9rem]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-cream/[0.08] pt-5 text-center text-[0.75rem] text-cream/80 md:mt-14 md:flex md:items-center md:justify-between md:pt-6 md:text-start">
            <p>
              © <bdi>{new Date().getFullYear()}</bdi> <bdi dir="ltr">RideWithYoav</bdi>
            </p>
            <p className="mt-2 max-w-md leading-relaxed md:mt-0 md:text-end">{business.join(" · ")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
