import { defineField, defineType } from "sanity";

export const faqItem = defineType({
  name: "faqItem",
  title: "שאלה נפוצה",
  type: "document",
  fields: [
    defineField({ name: "question", title: "שאלה", type: "string", validation: (r) => r.required().max(160) }),
    defineField({ name: "answer", title: "תשובה", type: "text", rows: 4, validation: (r) => r.required().max(1200) }),
    defineField({ name: "order", title: "סדר הופעה", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "question", subtitle: "answer" } },
});
