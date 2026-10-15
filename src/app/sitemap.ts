import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env/server";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/register", "/terms", "/privacy", "/accessibility", "/cookies"];
  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/register" ? 0.8 : 0.3,
  }));
}
