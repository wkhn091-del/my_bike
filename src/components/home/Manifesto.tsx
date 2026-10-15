import type { EventContent } from "@/lib/content/types";
import { inPlace } from "@/lib/format";
import { ScrollWords } from "@/motion/ScrollWords";

/** Names the pains the client picked (alone, same route, the group's pace, no progress), then the way out. */
export function Manifesto({ event }: { event: EventContent }) {
  return (
    <section aria-label="למה יום הקהילה" className="section relative overflow-hidden">
      <div className="container-x">
        <p className="text-micro font-semibold tracking-wide text-olive">מכירים את זה?</p>
        <ScrollWords
          className="mt-6 max-w-5xl font-display text-statement text-charcoal"
          text={`אותו מסלול, אותה שעה, לבד. לא בטוחים שתעמדו בקצב של קבוצה, ולא יודעים לאן להמשיך מכאן. ${event.title} נבנה בדיוק בשביל זה: יום אחד ${inPlace(event.region)}, עם רוכבים ברמה שלכם, ומדריך שרוכב איתכם כל הדרך.`}
        />
      </div>
    </section>
  );
}
