import { defineField, defineType } from "sanity";
import { imageWithAlt } from "./imageWithAlt";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "תמונת גלריה",
  type: "document",
  fields: [
    defineField({ ...imageWithAlt("image", "תמונה"), validation: (r) => r.required() }),
    defineField({
      name: "consentConfirmed",
      title: "כל מי שמזוהה בתמונה אישר/ה פרסום",
      description: "בלי הסימון הזה התמונה לא תופיע באתר",
      type: "boolean",
      initialValue: false,
      validation: (r) => r.required(),
    }),
    defineField({ name: "order", title: "סדר הופעה", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "image.alt", media: "image" } },
});
