import Image from "next/image";
import { ILLUSTRATIVE } from "@/content/illustrative";
import type { SiteImage } from "@/lib/content/types";
import { ScrollStory, type StoryScene } from "@/motion/ScrollStory";
import { SplitReveal } from "@/motion/SplitReveal";
import { IllustrativeTag } from "./IllustrativeTag";

const COPY = [
  { step: "עוצרים לאכול", title: "ארוחות לאורך היום", detail: "עוצרים לאכול יחד, בלי לסחוב כלום ובלי לתכנן." },
  { step: "לומדים בשטח", title: "סדנאות מקצועיות בשטח", detail: "לומדים משהו שתיקחו איתכם לכל רכיבה מעכשיו." },
  { step: "מסיימים יחד", title: "מסיימים יחד בשקיעה", detail: "תצפית אחרונה, כולם יחד, וחוזרים הביתה עם חברים חדשים." },
];

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
        <Image src={photo.url} alt={photo.alt} fill sizes="100vw" placeholder={photo.lqip ? "blur" : "empty"} blurDataURL={photo.lqip ?? undefined} className="object-cover" />
      ) : (
        <Image src={mood.src} alt={mood.alt} fill sizes="100vw" placeholder="blur" className="object-cover" />
      ),
      badge: photo ? undefined : <IllustrativeTag className="top-[calc(var(--header-h)+4.5rem)] bottom-auto start-6 md:start-10" />,
    };
  });

  return (
    <section id="day" aria-labelledby="moments-title" className="relative bg-charcoal text-cream">
      <div className="container-x pt-20 pb-12 md:pt-32 md:pb-16">
        <p className="text-micro font-semibold tracking-wide text-cream/60">ככה נראה היום</p>
        <SplitReveal id="moments-title" className="mt-3 max-w-3xl text-h2">
          יום שלם בחוץ, עם החבר׳ה
        </SplitReveal>
        <p className="mt-5 max-w-xl text-lead text-cream/75">גללו, ותעברו את היום בעצמכם: מהעצירה הראשונה ועד השקיעה.</p>
      </div>
      <ScrollStory scenes={scenes} />
    </section>
  );
}
