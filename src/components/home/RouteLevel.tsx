import Image from "next/image";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ILLUSTRATIVE } from "@/content/illustrative";
import { IllustrativeTag } from "./IllustrativeTag";
import type { EventContent } from "@/lib/content/types";
import { inPlace } from "@/lib/format";
import { Reveal } from "@/motion/Reveal";
import { TypeGate } from "@/motion/TypeGate";

export function RouteLevel({ event }: { event: EventContent }) {
  const { route } = event;
  const stats: Array<{ icon: IconName; label: string; value: string }> = [];
  if (route.km) stats.push({ icon: "route", label: "אורך", value: `${route.km} ק״מ` });
  if (route.elevationM) stats.push({ icon: "mountain", label: "עלייה מצטברת", value: `${route.elevationM.toLocaleString("he-IL")} מ׳` });
  if (route.terrain) stats.push({ icon: "mapPin", label: "סוג שטח", value: route.terrain });
  if (route.bikes) stats.push({ icon: "bike", label: "אופניים מתאימים", value: route.bikes });
  const hasMore = stats.length > 0 || Boolean(route.fitText) || Boolean(route.stravaUrl);

  return (
    <section id="route" aria-labelledby="route-title" className="relative bg-charcoal text-cream">
      <TypeGate
        word={event.region}
        hint="גללו פנימה"
        media={
          <>
            <Image src={ILLUSTRATIVE.route.src} alt={ILLUSTRATIVE.route.alt} fill sizes="100vw" placeholder="blur" className="object-cover" />
            <IllustrativeTag className="top-[calc(var(--header-h)+0.75rem)] bottom-auto" />
          </>
        }
      >
        <div className="container-x pb-16 md:pb-24">
          <p className="text-micro font-semibold tracking-wide text-cream/70">המסלול</p>
          <h2 id="route-title" className="mt-3 max-w-4xl text-h2">
            {route.km ? `${route.km} ק״מ ${inPlace(event.region)}, ברמה שלכם` : `שבילים ${inPlace(event.region)}, ברמה שלכם`}
          </h2>
          <p className="mt-5 max-w-xl text-lead text-cream/80">
            המסלול מתאים לרוכבים מתחילים-בינוניים שכבר רוכבים באופן קבוע.{route.paceText ? ` ${route.paceText}` : ""}
          </p>
        </div>
      </TypeGate>

      {hasMore ? (
        <div className="container-x pt-4 pb-20 md:pb-28">
          {stats.length ? (
            <Reveal as="dl" stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-cream/10 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-charcoal p-6">
                  <Icon name={stat.icon} className="size-7 text-cream/70" />
                  <dt className="mt-3 text-micro text-cream/60">{stat.label}</dt>
                  <dd className="text-h3 font-bold">
                    <bdi>{stat.value}</bdi>
                  </dd>
                </div>
              ))}
            </Reveal>
          ) : null}
          {route.fitText ? (
            <p className="mt-8 max-w-2xl text-cream/85">
              <strong className="text-cream">מתאים לכם אם:</strong> {route.fitText}
            </p>
          ) : null}
          {route.stravaUrl ? (
            <p className="mt-4">
              <a href={route.stravaUrl} className="footer-link" target="_blank" rel="noopener noreferrer">
                למסלול המלא ב-<bdi dir="ltr">Strava</bdi>
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
