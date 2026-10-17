import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security/headers";

const noStore = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];

function serverActionOrigins(): string[] {
  const hosts = new Set<string>(["ridewithyoav.co.il", "www.ridewithyoav.co.il"]);
  if (process.env.NODE_ENV !== "production") hosts.add("localhost:3000");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      hosts.add(new URL(site).host);
    } catch {
      /* the env schema reports a bad URL when the server boots */
    }
  }
  if (process.env.VERCEL_URL) hosts.add(process.env.VERCEL_URL);
  return [...hosts];
}

/*
 * No cacheComponents / partialPrefetching: the CSP nonce is per request, so every page renders
 * dynamically. Sanity content is cached at the data layer with tags instead (src/lib/content).
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "64kb",
      allowedOrigins: serverActionOrigins(),
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...SECURITY_HEADERS] },
      { source: "/thank-you/:path*", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/consent/:path*", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/feedback/:path*", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/register", headers: noStore },
      { source: "/api/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
