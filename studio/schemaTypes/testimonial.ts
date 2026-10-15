import { defineField, defineType } from "sanity";
import { imageWithAlt } from "./imageWithAlt";

export const testimonial = defineType({
  name: "testimonial",
  title: "המלצה",
  type: "document",
  fields: [
    defineField({ name: "name", title: "שם (כמו שהרוכב/ת אישר/ה להציג)", type: "string", validation: (r) => r.required().max(60) }),
    defineField({ name: "quote", title: "ההמלצה, במילים שלהם", type: "text", rows: 3, validation: (r) => r.required().max(220) }),
    imageWithAlt("image", "תמונה"),
    defineField({
      name: "source",
      title: "מאיפה ההמלצה",
      type: "string",
      options: {
        list: [
          { title: "משתתף/ת ביום קהילה קודם", value: "pastEvent" },
          { title: "רוכב/ת בליווי השנתי", value: "coaching" },
          { title: "אחר", value: "other" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "verifiedParticipant",
      title: "הגיעה מטופס המשוב של הזמנה ששולמה",
      description: "לסמן רק כשההמלצה הגיעה מקישור המשוב שנשלח במייל אחרי האירוע. באתר יופיע ״השתתף/ה ביום הקהילה״.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "consentConfirmed",
      title: "יש אישור בכתב לפרסם",
      description: "בלי הסימון הזה ההמלצה לא תופיע באתר",
      type: "boolean",
      initialValue: false,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "consentDate",
      title: "מתי התקבל האישור",
      type: "date",
      hidden: ({ document }) => !document?.consentConfirmed,
      validation: (r) =>
        r.custom((value, context) => (context.document?.consentConfirmed && !value ? "חובה כשיש אישור לפרסם" : true)),
    }),
    defineField({
      name: "consentMethod",
      title: "איפה האישור שמור",
      type: "string",
      options: {
        list: [
          { title: "הודעת וואטסאפ", value: "whatsapp" },
          { title: "מייל", value: "email" },
          { title: "טופס המשוב באתר", value: "feedbackForm" },
        ],
        layout: "radio",
      },
      hidden: ({ document }) => !document?.consentConfirmed,
      validation: (r) =>
        r.custom((value, context) => (context.document?.consentConfirmed && !value ? "חובה כשיש אישור לפרסם" : true)),
    }),
    defineField({ name: "order", title: "סדר הופעה", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "סדר הופעה", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "quote", media: "image" } },
});
