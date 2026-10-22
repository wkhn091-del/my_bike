import type { Metadata, Viewport } from "next";
import { Heebo, Secular_One } from "next/font/google";
import { headers } from "next/headers";
import { ConsentAndAnalytics } from "@/components/layout/ConsentAndAnalytics";
import { getSiteContent } from "@/lib/content/get";
import { analyticsIds } from "@/lib/env/public";
import { siteUrl } from "@/lib/env/server";
import { formatShortDate, inPlace } from "@/lib/format";
import { MotionProvider } from "@/motion/MotionProvider";
import "./globals.css";

// next/font downloads both families at build time and serves them from our own domain.
const secular = Secular_One({ weight: "400", subsets: ["hebrew", "latin"], variable: "--font-secular", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await getSiteContent();
  const title = `${event.title} של RideWithYoav · יום רכיבה מודרך ${inPlace(event.region)}, ${formatShortDate(event.date)}`;
  const description = `קבוצה שלא בורחת קדימה: יום אחד ${inPlace(event.region)} עם יואב, ${event.capacity} רוכבים בלבד. מדריך, ארוחות וצלם כלולים — ${event.priceAgorot / 100} ₪ כולל מע״מ.`;
  const ogImage = event.heroImage?.url ?? "/og.jpg";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s · RideWithYoav" },
    description,
    openGraph: { type: "website", locale: "he_IL", siteName: "RideWithYoav", title, description, url: "/", images: [{ url: ogImage, width: 1200, height: 630, alt: `${event.title} של RideWithYoav` }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    alternates: { canonical: "/" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#F4EDE0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="he" dir="rtl" className={`${secular.variable} ${heebo.variable}`}>
      <body className="antialiased">
        <a href="#main" className="skip-link">
          דילוג לתוכן
        </a>
        <MotionProvider>{children}</MotionProvider>
        <ConsentAndAnalytics ids={analyticsIds()} nonce={nonce} />
      </body>
    </html>
  );
}
