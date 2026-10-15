import type { StaticImageData } from "next/image";
import closingDusk from "./images/closing-dusk.jpg";
import dayBreakfast from "./images/day-breakfast.jpg";
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
    alt: "רוכב שטח על שביל הררי באור יום, עם נוף הרים פתוח מאחוריו",
  },
  route: {
    src: route,
    alt: "שביל עפר מתפתל בין גבעות ירוקות באור יום בהיר",
  },
  closing: {
    src: closingDusk,
    alt: "מסלול הרים באור יום — שביל פתוח בין גבעות",
  },
  price: {
    src: priceCard,
    alt: "אופני שטח על תצפית הררית באור יום",
  },
  moments: [
    {
      src: dayBreakfast,
      alt: "קבוצת רוכבים עוצרת על רכס באור יום עם האופניים והקפה",
    },
    {
      src: dayWorkshop,
      alt: "הדרכה בשטח באור יום: כיוון אופניים על רקע הרים",
    },
    {
      src: groupSunset,
      alt: "קבוצת רוכבים בתצפית הררית באור אחר הצהריים",
    },
  ],
} satisfies Record<string, StaticPhoto | StaticPhoto[]>;
