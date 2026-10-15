import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt } from "./imageWithAlt";

export const event = defineType({
  name: "event",
  title: "יום הקהילה",
  type: "document",
  groups: [
    { name: "basics", title: "תאריך ומקום", default: true },
    { name: "pricing", title: "מחיר ומכירה" },
    { name: "day", title: "מהלך היום" },
    { name: "route", title: "מסלול" },
    { name: "images", title: "תמונות" },
  ],
  fields: [
    defineField({ name: "title", title: "שם האירוע", type: "string", group: "basics", initialValue: "יום הקהילה", validation: (r) => r.required().max(60) }),
    defineField({ name: "date", title: "תאריך", type: "date", group: "basics", validation: (r) => r.required() }),
    defineField({ name: "rainDate", title: "תאריך חלופי לגשם", type: "date", group: "basics" }),
    defineField({
      name: "region",
      title: "אזור",
      description: "עם ה' הידיעה, למשל: הגליל. האתר כותב לבד \"בגליל\"",
      type: "string",
      group: "basics",
      initialValue: "הגליל",
      validation: (r) => r.required().max(60),
    }),
    defineField({ name: "meetingPoint", title: "נקודת מפגש", type: "string", group: "basics", validation: (r) => r.max(200) }),
    defineField({ name: "parking", title: "חניה", type: "string", group: "basics", validation: (r) => r.max(200) }),

    defineField({
      name: "salesOpen",
      title: "ההרשמה פתוחה",
      description: "כבוי = האתר מציג רשימת המתנה במקום טופס תשלום",
      type: "boolean",
      group: "pricing",
      initialValue: false,
    }),
    defineField({ name: "priceShekels", title: "מחיר לכרטיס (₪, כולל מע״מ)", type: "number", group: "pricing", validation: (r) => r.required().integer().min(1).max(100_000) }),
    defineField({ name: "capacity", title: "מספר מקומות", type: "number", group: "pricing", validation: (r) => r.required().integer().min(1).max(500) }),
    defineField({
      name: "earlyPriceShekels",
      title: "מחיר מוקדם (₪)",
      description: "חייב להיות נמוך מהמחיר הרגיל. ריק = אין מחיר מוקדם",
      type: "number",
      group: "pricing",
      validation: (r) =>
        r
          .integer()
          .min(1)
          .custom((value, context) => {
            const price = (context.document as { priceShekels?: number } | undefined)?.priceShekels;
            return value === undefined || !price || value < price ? true : "המחיר המוקדם צריך להיות נמוך מהמחיר הרגיל";
          }),
    }),
    defineField({ name: "earlySeats", title: "כמה מקומות במחיר המוקדם", type: "number", group: "pricing", validation: (r) => r.integer().min(0).max(500) }),
    defineField({
      name: "friendDiscountShekels",
      title: "הנחת חבר לכל כרטיס (₪)",
      description: "חלה כשקונים 2 כרטיסים ומעלה. בכל הזמנה ניתנת רק ההנחה המשתלמת ביותר",
      type: "number",
      group: "pricing",
      validation: (r) => r.integer().min(1).max(100_000),
    }),

    defineField({
      name: "schedule",
      title: "לו״ז",
      type: "array",
      group: "day",
      validation: (r) => r.max(20),
      of: [
        defineArrayMember({
          type: "object",
          name: "scheduleItem",
          fields: [
            defineField({ name: "time", title: "שעה", type: "string", validation: (r) => r.required().regex(/^\d{1,2}:\d{2}$/) }),
            defineField({ name: "title", title: "מה קורה", type: "string", validation: (r) => r.required().max(120) }),
            defineField({ name: "detail", title: "פירוט", type: "string", validation: (r) => r.max(200) }),
          ],
          preview: { select: { title: "title", subtitle: "time" } },
        }),
      ],
    }),
    defineField({ name: "included", title: "מה כלול", type: "array", group: "day", of: [defineArrayMember({ type: "string", validation: (r) => r.max(160) })], validation: (r) => r.max(20) }),
    defineField({ name: "photosDelivery", title: "מתי מקבלים את התמונות", type: "string", group: "day", validation: (r) => r.max(160) }),
    defineField({ name: "safety", title: "בטיחות", type: "text", rows: 4, group: "day", validation: (r) => r.max(600) }),

    defineField({
      name: "route",
      title: "מסלול",
      type: "object",
      group: "route",
      fields: [
        defineField({ name: "km", title: "אורך (ק״מ)", type: "number", validation: (r) => r.min(0).max(400) }),
        defineField({ name: "elevationM", title: "טיפוס מצטבר (מטר)", type: "number", validation: (r) => r.min(0).max(8000) }),
        defineField({ name: "terrain", title: "סוג שטח", type: "string", validation: (r) => r.max(80) }),
        defineField({ name: "bikes", title: "אילו אופניים מתאימים", type: "string", validation: (r) => r.max(160) }),
        defineField({ name: "fitText", title: "למי זה מתאים", type: "text", rows: 3, validation: (r) => r.max(300) }),
        defineField({ name: "paceText", title: "קצב וקבוצות", type: "text", rows: 3, validation: (r) => r.max(300) }),
        defineField({ name: "stravaUrl", title: "קישור למסלול (Strava / Komoot)", type: "url", validation: (r) => r.uri({ scheme: ["https"] }) }),
      ],
    }),

    defineField({ ...imageWithAlt("heroImage", "תמונה ראשית"), group: "images" }),
    defineField({
      name: "yoavImages",
      title: "תמונות של יואב",
      type: "array",
      group: "images",
      of: [defineArrayMember({ ...imageWithAlt("yoavImage", "תמונה") })],
      validation: (r) => r.max(4),
    }),
  ],
  preview: { select: { title: "title", subtitle: "date" } },
});
