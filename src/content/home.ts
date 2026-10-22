import type { StaticImageData } from "next/image";
import { ILLUSTRATIVE } from "./illustrative";

export type HeroCard = {
  src: StaticImageData;
  title: string;
  /** object-position utility so faces/bikes stay in the phone frame */
  focus: string;
};

/**
 * Fan cards under the centered hero — vertical phone frames, best ride stills.
 * Copy titles mirror docs/copy-deck.md day beats (רכיבה / מסלול / קהילה / סדנה / שקיעה).
 */
export const home = {
  hero: {
    cards: [
      { src: ILLUSTRATIVE.dayStages[1]!.src, title: "קפה בשטח", focus: "object-[center_40%]" },
      { src: ILLUSTRATIVE.moments[2]!.src, title: "עם החבר׳ה", focus: "object-[center_42%]" },
      { src: ILLUSTRATIVE.dayStages[0]!.src, title: "יציאה לשטח", focus: "object-[center_38%]" },
      { src: ILLUSTRATIVE.route.src, title: "מסלול מודרך", focus: "object-[center_32%]" },
      { src: ILLUSTRATIVE.hero.src, title: "יום הקהילה", focus: "object-[center_40%]" },
      { src: ILLUSTRATIVE.dayStages[3]!.src, title: "שקיעה בגליל", focus: "object-[center_45%]" },
      { src: ILLUSTRATIVE.moments[1]!.src, title: "סדנת טכניקה", focus: "object-[center_28%]" },
      { src: ILLUSTRATIVE.moments[0]!.src, title: "הפסקה בשטח", focus: "object-[center_35%]" },
      { src: ILLUSTRATIVE.dayStages[2]!.src, title: "ביער", focus: "object-[center_22%]" },
    ] satisfies HeroCard[],
  },
} as const;
