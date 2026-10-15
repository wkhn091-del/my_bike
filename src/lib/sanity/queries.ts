/**
 * GROQ: explicit projections only, and user input only ever travels as a $param.
 * Testimonials and gallery images are filtered on the consent flag so nothing unapproved can publish;
 * a testimonial also needs the date the consent was given.
 */

const IMAGE = `{
  "alt": coalesce(alt, ""),
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "lqip": asset->metadata.lqip
}`;

export const SITE_CONTENT_QUERY = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    legalName, vatNumber, address, phone, whatsapp, email, answeringHours,
    accessibility{name, phone, email},
    instagramUrl, facebookUrl, stravaUrl, youtubeUrl, instagramFollowers, followersAsOf,
    coachingText, coachingResponseDays, healthDeclaration,
    google{rating, reviewCount, profileUrl, checkedAt},
    pastEdition{riders, soldOut, date},
    credentials[0...6]{title, issuer, year, url}
  },
  "event": *[_type == "event" && _id == "event"][0]{
    title, date, rainDate, region, meetingPoint, parking,
    priceShekels, capacity, earlyPriceShekels, earlySeats, friendDiscountShekels, salesOpen,
    schedule[]{time, title, detail},
    included,
    route{km, elevationM, terrain, bikes, fitText, paceText, stravaUrl},
    photosDelivery, safety,
    "heroImage": heroImage${IMAGE},
    "yoavImages": yoavImages[]${IMAGE}
  },
  "testimonials": *[_type == "testimonial" && consentConfirmed == true && defined(consentDate)] | order(order asc)[0...12]{
    name, quote, verifiedParticipant,
    "image": image${IMAGE}
  },
  "faq": *[_type == "faqItem"] | order(order asc)[0...20]{question, answer},
  "gallery": *[_type == "galleryImage" && consentConfirmed == true] | order(order asc)[0...12]{
    "alt": coalesce(image.alt, ""),
    "url": image.asset->url,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
    "lqip": image.asset->metadata.lqip
  }
}`;

export const COUPON_QUERY = `*[_type == "coupon" && upper(code) == $code][0]{
  code, amountOffShekels, validUntil, maxUses, active
}`;
