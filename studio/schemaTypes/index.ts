import { coupon } from "./coupon";
import { event } from "./event";
import { faqItem } from "./faqItem";
import { galleryImage } from "./galleryImage";
import { siteSettings } from "./siteSettings";
import { testimonial } from "./testimonial";

export const schemaTypes = [siteSettings, event, coupon, testimonial, galleryImage, faqItem];

/** One document each, fixed _id (the site queries `_id == "siteSettings"` / `"event"`). */
export const SINGLETON_TYPES = new Set(["siteSettings", "event"]);
