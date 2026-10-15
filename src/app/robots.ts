import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env/server";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";
  return {
    rules: isProduction
      ? [{ userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you/", "/consent/", "/feedback/"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
