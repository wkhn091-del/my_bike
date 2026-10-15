import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content/get";
import { Footer } from "./Footer";
import { Header } from "./Header";

export async function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const { settings } = await getSiteContent();
  return (
    <>
      <Header />
      <main id="main" className="section pt-10">
        <article className="container-x max-w-3xl [&_h2]:mt-10 [&_h2]:text-h3 [&_h2]:font-bold [&_h2]:font-sans [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:ps-6">
          <h1 className="text-h2">{title}</h1>
          <p className="text-small text-charcoal-soft">עודכן לאחרונה: <bdi>{updated}</bdi></p>
          {children}
        </article>
      </main>
      <Footer settings={settings} />
    </>
  );
}

export async function BusinessLine() {
  const { settings } = await getSiteContent();
  const parts = [settings.legalName ?? "יואב לוי (RideWithYoav)", settings.vatNumber ? `עוסק מורשה ${settings.vatNumber}` : null, settings.address].filter(Boolean);
  return <>{parts.join(", ")}</>;
}
