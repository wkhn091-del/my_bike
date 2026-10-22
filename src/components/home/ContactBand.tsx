import { BrandIcon } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import type { SiteSettings } from "@/lib/content/types";

/** Contact strip under coaching — sits above the closing CTA / footer. */
export function ContactBand({ settings }: { settings: SiteSettings }) {
  return (
    <section id="contact" aria-label="יצירת קשר" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#dfe8d2] via-[#e8f0dc] to-[#f0e6d6]" />
        <div className="absolute top-0 inset-x-0 h-px bg-olive/15" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-14 text-center md:py-18">
        <p className="text-[0.7rem] font-semibold tracking-[0.08em] text-olive-deep">דברו איתנו</p>
        <p className="mt-3 max-w-md text-[1.05rem] leading-relaxed text-charcoal/80 md:text-lead">
          שאלה על היום או על ליווי שנתי? כתבו או התקשרו — יואב עונה בעצמו.
        </p>

        <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5 sm:max-w-md sm:flex-row sm:justify-center">
          <a
            href={`tel:${settings.phone.replace(/\D/g, "")}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-charcoal/15 bg-cream px-4 text-[0.9rem] font-semibold text-charcoal transition-colors hover:border-charcoal/30"
          >
            <Icon name="phone" className="size-4 text-charcoal/80" />
            <bdi dir="ltr">{settings.phone}</bdi>
          </a>
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-olive px-4 text-[0.9rem] font-semibold text-cream transition-colors hover:bg-olive-deep"
          >
            <BrandIcon name="whatsapp" className="size-4" />
            וואטסאפ
            <span className="sr-only"> (נפתח בחלון חדש)</span>
          </a>
        </div>

        <a
          href={`mailto:${settings.email}`}
          className="mt-4 text-[0.875rem] text-charcoal/80 underline-offset-4 hover:text-charcoal hover:underline"
        >
          <bdi dir="ltr">{settings.email}</bdi>
        </a>
        {settings.answeringHours ? (
          <p className="mt-2 text-[0.8rem] text-charcoal/80">שעות מענה: {settings.answeringHours}</p>
        ) : null}
      </div>
    </section>
  );
}
