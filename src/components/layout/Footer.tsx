import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { BrandIcon, type BrandName } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import type { SiteSettings } from "@/lib/content/types";
import { Reveal } from "@/motion/Reveal";

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
    <div>
      <h2 className="font-sans text-[0.875rem] font-semibold tracking-wide text-cream/50">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** `cta` is the page's mini-hero (the closing seats CTA on the home page), rendered first. */
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
      <div className="container-x border-t border-cream/10 pt-14 pb-[calc(env(safe-area-inset-bottom)+7rem)] text-[0.9375rem] md:pb-10">
        <Reveal stagger className="flex flex-col gap-10 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-12">
          <div>
            <Logo tone="light" />
            <p className="mt-3 max-w-xs text-cream/65">רכיבות קהילה וליווי שנתי לרוכבי שטח, עם יואב לוי.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:flex md:flex-col md:items-start md:gap-0">
              <a
                href={`tel:${settings.phone.replace(/\D/g, "")}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/20 px-4 transition-colors hover:bg-cream/10 md:justify-start md:rounded-none md:border-0 md:px-0 md:hover:bg-transparent"
              >
                <Icon name="phone" className="size-5 text-cream/60" />
                <bdi dir="ltr">{settings.phone}</bdi>
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/20 px-4 transition-colors hover:bg-cream/10 md:justify-start md:rounded-none md:border-0 md:px-0 md:hover:bg-transparent"
              >
                <BrandIcon name="whatsapp" className="size-5 text-cream/60" />
                וואטסאפ
              </a>
              <a href={`mailto:${settings.email}`} className="footer-link col-span-2 justify-center md:justify-start">
                <bdi dir="ltr">{settings.email}</bdi>
              </a>
            </div>
            {settings.answeringHours ? <p className="mt-2 text-cream/60">שעות מענה: {settings.answeringHours}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:gap-12">
            <Group title="יום הקהילה">
              <ul>
                {EVENT_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>

            <Group title="עוד מיואב">
              <ul>
                <li>
                  <Link href="/#coaching" className="footer-link">
                    ליווי שנתי
                  </Link>
                </li>
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2">
                {social.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="inline-flex size-12 items-center justify-center rounded-full border border-cream/15 text-cream/75 transition-[transform,color,border-color] duration-300 ease-[var(--ease-soft-out)] hover:-translate-y-0.5 hover:border-cream/40 hover:text-cream"
                    >
                      <BrandIcon name={item.name} />
                    </a>
                  </li>
                ))}
              </ul>
            </Group>
          </div>

          <Group title="מידע משפטי">
            <nav aria-label="מידע משפטי">
              <ul className="grid grid-cols-2 md:grid-cols-1">
                {LEGAL_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} rel="noopener noreferrer" className="footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Group>
        </Reveal>

        <div className="mt-12 flex flex-col gap-2 border-t border-cream/10 pt-6 text-[0.875rem] text-cream/50 md:flex-row md:justify-between">
          <p>
            © <bdi>{new Date().getFullYear()}</bdi> <bdi dir="ltr">RideWithYoav</bdi>
          </p>
          {business.length ? <p>{business.join(" · ")}</p> : null}
        </div>
      </div>
    </footer>
  );
}
