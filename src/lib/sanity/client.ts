import "server-only";
import { createClient, type SanityClient } from "@sanity/client";
import { serverEnv } from "@/lib/env/server";

/**
 * The dataset is private: coupon codes live in it, and a public dataset would let anyone list them.
 * Every read goes through the server with the Viewer token, which never reaches the browser.
 */
const base =
  serverEnv.SANITY_PROJECT_ID && serverEnv.SANITY_READ_TOKEN
    ? {
        projectId: serverEnv.SANITY_PROJECT_ID,
        dataset: serverEnv.SANITY_DATASET,
        apiVersion: serverEnv.SANITY_API_VERSION,
        token: serverEnv.SANITY_READ_TOKEN,
      }
    : null;

/** Published content through the CDN. */
export const sanityPublished: SanityClient | null = base ? createClient({ ...base, useCdn: true, perspective: "published" }) : null;

/** Drafts for the Studio preview. */
export const sanityPreview: SanityClient | null = base ? createClient({ ...base, useCdn: false, perspective: "drafts" }) : null;

/** Coupons are read uncached and without the CDN so a just-disabled code stops working at once. */
export const sanityFresh: SanityClient | null = base ? createClient({ ...base, useCdn: false, perspective: "published" }) : null;

export const CONTENT_TAG = "sanity:content";
