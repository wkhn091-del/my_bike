import { headers } from "next/headers";
import { AboutYoav } from "@/components/home/AboutYoav";
import { Closing } from "@/components/home/Closing";
import { CoachingForm } from "@/components/home/CoachingForm";
import { ContactBand } from "@/components/home/ContactBand";
import { DaySchedule } from "@/components/home/DaySchedule";
import { Manifesto } from "@/components/home/Manifesto";
import { Numbers } from "@/components/home/Numbers";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import { Included } from "@/components/home/Included";
import { PriceAndPeace } from "@/components/home/PriceAndPeace";
import { RideRoadmap } from "@/components/home/RideRoadmap";
import { RouteLevel } from "@/components/home/RouteLevel";
import { ScrollDepth } from "@/components/home/ScrollDepth";
import { StickyCta } from "@/components/home/StickyCta";
import { WallSection } from "@/components/home/WallSection";
import { WhatsAppFloat } from "@/components/home/WhatsAppFloat";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getAvailability, salesAreOpen } from "@/lib/checkout/service";
import { getSiteContent } from "@/lib/content/get";
import { readWall, type WallSeat } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db/pool";
import { turnstileSiteKey } from "@/lib/env/public";
import { siteUrl } from "@/lib/env/server";
import { formatShekels } from "@/lib/format";
import { reportError } from "@/lib/observability/report";
import { eventJsonLd, serializeJsonLd } from "@/lib/seo/event-schema";
import { CustomCursor } from "@/motion/CustomCursor";
import { RouteThread } from "@/motion/RouteThread";
import { SplitReveal } from "@/motion/SplitReveal";

async function wallData(fallbackTaken: number): Promise<{ taken: number; named: WallSeat[] }> {
  if (!hasDatabase) return { taken: fallbackTaken, named: [] };
  try {
    return await readWall();
  } catch (error) {
    reportError("wall", error);
    return { taken: fallbackTaken, named: [] };
  }
}

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const content = await getSiteContent();
  const { event, settings } = content;
  const availability = await getAvailability(event);
  const wall = await wallData(availability.taken);
  const open = salesAreOpen(event);
  const soldOut = availability.seatsLeft === 0;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventJsonLd(content, availability, siteUrl)) }}
      />
      <Header />
      <main id="main">
        <Hero event={event} availability={availability} open={open} />
        <div className="relative">
          <RouteThread />
          <Manifesto event={event} />
          <Numbers event={event} />
          <RideRoadmap gallery={content.gallery} />
          {event.schedule.length ? <DaySchedule event={event} /> : null}
          <RouteLevel event={event} />
          <Included event={event} />
          <AboutYoav content={content} />
          <WallSection content={content} taken={wall.taken} named={wall.named} open={open} />
        </div>
        <PriceAndPeace event={event} availability={availability} open={open} />
        <HomeFaq items={content.faq} />

        <section id="coaching" aria-labelledby="coaching-title" className="section relative overflow-hidden bg-gradient-to-b from-cream to-cream-deep/50">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -start-24 top-10 hidden h-72 w-72 rounded-full bg-olive/10 blur-3xl lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-16 bottom-0 hidden h-64 w-64 rounded-full bg-sunset/10 blur-3xl lg:block"
          />
          <div className="container-x grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div>
                <p className="text-micro font-semibold tracking-[0.06em] text-olive-deep">ליווי שנתי</p>
                <SplitReveal id="coaching-title" className="mt-3 text-h2">
                  אחרי {event.title} — ליווי שנתי עם יואב
                </SplitReveal>
                {settings.coachingText ? <p className="mt-4 text-lead measure">{settings.coachingText}</p> : null}
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {["תוכנית אימונים אישית", "בדיקה חודשית עם יואב", "תוכנית לפי הקצב שלכם בשטח", "שיחת היכרות בלי התחייבות"].map((line) => (
                  <li key={line} className="rounded-2xl border border-charcoal/8 bg-cream/80 px-4 py-3 text-small font-semibold text-charcoal shadow-contact">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <CoachingForm turnstileKey={turnstileSiteKey()} responseDays={settings.coachingResponseDays} />
          </div>
        </section>

        <ContactBand settings={settings} />
      </main>
      <Footer settings={settings} cta={<Closing event={event} availability={availability} open={open} />} />

      <StickyCta
        href="/register"
        label={
          soldOut
            ? "לרשימת ההמתנה"
            : open
              ? `שמרו מקום · ${formatShekels(event.priceAgorot)}`
              : `שמרו מקום · ${event.capacity} בלבד`
        }
      />
      <WhatsAppFloat number={settings.whatsapp} />
      <CustomCursor />
      <ScrollDepth />
    </>
  );
}
