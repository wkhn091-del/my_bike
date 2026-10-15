import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("תוכן")
    .items([
      S.listItem().title("פרטי העסק").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.listItem().title("יום הקהילה").id("event").child(S.document().schemaType("event").documentId("event")),
      S.divider(),
      S.documentTypeListItem("coupon").title("קודי קופון"),
      S.documentTypeListItem("testimonial").title("המלצות"),
      S.documentTypeListItem("galleryImage").title("גלריה"),
      S.documentTypeListItem("faqItem").title("שאלות נפוצות"),
    ]);
