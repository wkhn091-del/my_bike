import { defineField, defineType } from "sanity";

export const coupon = defineType({
  name: "coupon",
  title: "קוד קופון",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "הקוד",
      description: "אותיות באנגלית גדולות ומספרים בלבד, 3 עד 20 תווים. למשל YOAV50",
      type: "string",
      validation: (r) => r.required().regex(/^[A-Z0-9]{3,20}$/, { name: "A-Z ו-0-9 בלבד" }),
    }),
    defineField({ name: "amountOffShekels", title: "הנחה לכל כרטיס (₪)", type: "number", validation: (r) => r.required().integer().min(1).max(10_000) }),
    defineField({ name: "active", title: "פעיל", type: "boolean", initialValue: true }),
    defineField({ name: "validUntil", title: "בתוקף עד", type: "datetime" }),
    defineField({ name: "maxUses", title: "מספר שימושים מקסימלי (הזמנות)", type: "number", validation: (r) => r.integer().min(1) }),
  ],
  preview: {
    select: { code: "code", amount: "amountOffShekels", active: "active" },
    prepare: ({ code, amount, active }) => ({ title: code, subtitle: `${amount ?? "?"} ₪ לכרטיס${active === false ? " · כבוי" : ""}` }),
  },
});
