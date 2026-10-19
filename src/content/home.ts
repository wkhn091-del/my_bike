import type { StaticImageData } from "next/image";
import { ILLUSTRATIVE } from "./illustrative";

export type HeroCard = {
  src: StaticImageData;
  title: string;
  /** object-position utility so faces/bikes stay in the phone frame */
  focus: string;
};

/**
 * Home-page only content. Hero arch mosaic cards live here — not in shared ILLUSTRATIVE.
 */
export const home = {
  hero: {
    cards: [
      { src: ILLUSTRATIVE.moments[2]!.src, title: "רכיבה בגליל", focus: "object-[center_42%]" },
      { src: ILLUSTRATIVE.route.src, title: "מסלול מודרך", focus: "object-[center_30%]" },
      { src: ILLUSTRATIVE.closing.src, title: "עם החבר׳ה", focus: "object-[center_35%]" },
      { src: ILLUSTRATIVE.moments[0]!.src, title: "ארוחות בשטח", focus: "object-[center_28%]" },
      { src: ILLUSTRATIVE.moments[1]!.src, title: "סדנאות", focus: "object-[center_32%]" },
      { src: ILLUSTRATIVE.moments[2]!.src, title: "שקיעה בגליל", focus: "object-[center_45%]" },
      { src: ILLUSTRATIVE.route.src, title: "שבילי עפר", focus: "object-[center_40%]" },
      { src: ILLUSTRATIVE.price.src, title: "צלם שרוכב איתכם", focus: "object-[center_38%]" },
      { src: ILLUSTRATIVE.moments[0]!.src, title: "הכול כלול", focus: "object-[center_30%]" },
    ] satisfies HeroCard[],
  },
} as const;
