import Image from "next/image";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { SiteImage } from "@/lib/content/types";
import { ScrollStory, type StoryScene } from "@/motion/ScrollStory";
import { SplitReveal } from "@/motion/SplitReveal";
import { IllustrativeTag } from "./IllustrativeTag";

const COPY = [
  { step: "עוצרים לאכול", title: "ארוחות לאורך היום", detail: "עוצרים לאכול יחד, בלי לסחוב כלום ובלי לתכנן." },
  { step: "לומדים בשטח", title: "לומדים טכניקה על הסינגל", detail: "לומדים עליות, ירידות וקווים — ומיישמים עוד באותו יום." },
  { step: "מסיימים יחד", title: "מסיימים יחד בשקיעה", detail: "מסיימים יחד בתצפית, בלי להתפזר בדרך חזרה." },
];

/**
 * Keep faces / main subject in the upper half so the bottom caption band
 * never sits on top of the important part of the photo (phone + desktop).
 */
const MOOD_FOCUS = [
  "object-[center_28%] md:object-[center_32%]",
  "object-[center_30%] md:object-[center_35%]",
  "object-[center_38%] md:object-[center_42%]",
] as const;

/** Real gallery photos from Sanity when there are 3; until then, clearly labelled mood images. */
export function Moments({ gallery }: { gallery: SiteImage[] }) {
  const real = gallery.length >= 3;
  const scenes: StoryScene[] = COPY.map((copy, index) => {
    const photo = real ? gallery[index] : null;
    const mood = ILLUSTRATIVE.moments[index];
    return {
      key: copy.title,
      ...copy,
      media: photo ? (
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="100vw"
          placeholder={photo.lqip ? "blur" : "empty"}
          blurDataURL={photo.lqip ?? undefined}
          className="object-cover object-[center_30%]"
        />
      ) : (
        <Image
          src={mood.src}
          alt={mood.alt}
          fill
          sizes="100vw"
          placeholder="blur"
          className={`object-cover ${MOOD_FOCUS[index]}`}
        />
      ),
      badge: photo ? undefined : (
        <IllustrativeTag className="top-[calc(var(--header-h)+4.5rem)] bottom-auto start-6 md:start-10" />
      ),
    };
  });

  return (
    <section id="day" aria-labelledby="moments-title" className="relative bg-charcoal text-cream">
      <div className="container-x pt-20 pb-12 md:pt-32 md:pb-16">
        <p className="text-micro font-semibold tracking-[0.06em] text-cream/85">ככה נראה היום</p>
        <SplitReveal id="moments-title" className="mt-3 max-w-3xl text-h2">
          יום שלם בחוץ, עם החבר׳ה
        </SplitReveal>
        <p className="mt-5 max-w-xl text-lead text-cream/85">שלושה קטעים. בלי לרדוף בין לבין.</p>
      </div>
      <ScrollStory scenes={scenes} />
    </section>
  );
}
