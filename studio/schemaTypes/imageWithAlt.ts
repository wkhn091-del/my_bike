import { defineField } from "sanity";

export function imageWithAlt(name: string, title: string) {
  return defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "תיאור התמונה (לקוראי מסך)",
        description: "מה רואים בתמונה, במשפט אחד. למשל: יואב מוביל קבוצת רוכבים בעלייה בגליל",
        type: "string",
        validation: (r) => r.required().max(200),
      }),
    ],
  });
}
