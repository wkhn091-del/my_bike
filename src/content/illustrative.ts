import type { StaticImageData } from "next/image";
import closingDusk from "./images/closing-dusk.jpg";
import dayBreakfast from "./images/day-breakfast.jpg";
import dayStage01 from "./images/day-stage-01.jpg";
import dayStage02 from "./images/day-stage-02.jpg";
import dayStage03 from "./images/day-stage-03.jpg";
import dayStage04 from "./images/day-stage-04.jpg";
import dayWorkshop from "./images/day-workshop.jpg";
import groupSunset from "./images/group-sunset.jpg";
import hero from "./images/hero.jpg";
import priceCard from "./images/price-card.jpg";
import route from "./images/route.jpg";

export type StaticPhoto = { src: StaticImageData; alt: string };

/**
 * Premium mood images shown only where Sanity has no real photo.
 * Wherever one appears the UI must say "תמונה להמחשה".
 */
export const ILLUSTRATIVE = {
  hero: {
    src: hero,
    alt: "קבוצת רוכבי שטח על שביל הררי פתוח בין גבעות",
  },
  route: {
    src: route,
    alt: "רוכבי שטח על סינגלטק ירוק בגבעות הגליל",
  },
  closing: {
    src: closingDusk,
    alt: "שלושה רוכבי שטח על מסלול בין צמחייה ירוקה",
  },
  price: {
    src: priceCard,
    alt: "אופני שטח שחורים על שביל ביער באור יום",
  },
  /** Wide landscape frames for the pinned day roadmap (full-bleed on all viewports). */
  dayStages: [
    {
      src: dayStage01,
      alt: "קבוצת רוכבי שטח מתכנסים על שביל עפר בין גבעות ירוקות",
    },
    {
      src: dayStage02,
      alt: "רוכבי שטח בהפסקת קפה על שביל בין גבעות הגליל",
    },
    {
      src: dayStage03,
      alt: "רוכבי שטח על סינגלטק ביער לומדים טכניקה בשטח",
    },
    {
      src: dayStage04,
      alt: "קבוצת רוכבי שטח מסיימים יחד על שביל בשקיעה זהובה",
    },
  ],
  moments: [
    {
      src: dayBreakfast,
      alt: "רוכבי שטח בהפסקת קפה על שביל בין גבעות הגליל",
    },
    {
      src: dayWorkshop,
      alt: "שלושה רוכבים על שביל הררי פתוח עם נוף הרים",
    },
    {
      src: groupSunset,
      alt: "ארבעה רוכבי שטח על שביל עפר בגבעה ירוקה",
    },
  ],
} satisfies Record<string, StaticPhoto | StaticPhoto[]>;
