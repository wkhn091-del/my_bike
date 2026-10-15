import Image from "next/image";
import { YEARS_RIDING } from "@/lib/content/proof";
import type { SiteContent } from "@/lib/content/types";
import { Parallax } from "@/motion/Parallax";
import { Reveal } from "@/motion/Reveal";
import { ScrollWords } from "@/motion/ScrollWords";

export function AboutYoav({ content }: { content: SiteContent }) {
  const { settings, event } = content;
  const asOf = settings.followersAsOf ? new Date(`${settings.followersAsOf}T12:00:00Z`).toLocaleDateString("he-IL") : null;
  const followers = asOf ? settings.instagramFollowers : null;
  const community = followers ? `ובונה קהילה שגדלה ל-${followers} עוקבים באינסטגרם` : "ובונה קהילה";
  const { credentials } = settings.proof;

  return (
    <section aria-labelledby="yoav-title" className="section relative overflow-hidden bg-olive-deep text-cream">
      <div className={`container-x relative grid items-center gap-12 ${event.yoavImages.length ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
        <div>
          <h2 id="yoav-title" className="text-micro font-semibold tracking-wide font-sans text-cream/70">
            מי מוביל את היום
          </h2>
          <ScrollWords
            as="blockquote"
            dim={0.22}
            className="mt-6 max-w-4xl font-display text-statement"
            text={`״ב${event.title} אני לא מסתכל מהצד. אני רוכב איתכם כל המסלול, מהקילומטר הראשון ועד האחרון.״`}
          />
          <Reveal className="mt-10 flex items-center gap-4 border-t border-cream/15 pt-6">
            <div>
              <p className="font-display text-h3">יואב לוי</p>
              <p className="mt-1 max-w-xl text-cream/75">
                רוכב כבר <bdi>{YEARS_RIDING}</bdi> שנה ומגיע מספורט תחרותי. בשלוש השנים האחרונות מאמן רוכבים {community}.
              </p>
              {followers && asOf ? <p className="mt-1 text-micro text-cream/60">מספר העוקבים נכון ל-<bdi>{asOf}</bdi></p> : null}
              {settings.instagramUrl ? (
                <p className="mt-3">
                  <a href={settings.instagramUrl} className="footer-link" target="_blank" rel="noopener noreferrer">
                    לאינסטגרם של יואב
                  </a>
                </p>
              ) : null}
            </div>
          </Reveal>
          {credentials.length ? <h3 className="sr-only">תעודות ושותפים</h3> : null}
          {credentials.length ? (
            <Reveal as="ul" stagger className="mt-8 flex flex-wrap gap-3">
              {credentials.map((item) => {
                const label = (
                  <>
                    <span className="font-semibold">{item.title}</span>
                    {item.issuer || item.year ? (
                      <span className="text-cream/65">
                        {" · "}
                        {item.issuer}
                        {item.issuer && item.year ? ", " : ""}
                        {item.year ? <bdi>{item.year}</bdi> : null}
                      </span>
                    ) : null}
                  </>
                );
                return (
                  <li key={`${item.title}-${item.issuer ?? ""}`} className="rounded-full border border-cream/20 px-4 py-2 text-small">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
                        {label}
                        <span className="sr-only"> (נפתח בחלון חדש)</span>
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </Reveal>
          ) : null}
        </div>

        {event.yoavImages.length ? (
          <div className="grid grid-cols-2 gap-4">
            {event.yoavImages.slice(0, 2).map((image, index) => (
              <div key={image.url} className={`overflow-hidden rounded-lg ${index === 1 ? "mt-16" : ""}`}>
                <Parallax>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    placeholder={image.lqip ? "blur" : "empty"}
                    blurDataURL={image.lqip ?? undefined}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </Parallax>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
