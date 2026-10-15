import { z } from "zod";
import { MAX_TICKETS_PER_ORDER } from "@/lib/pricing/calculate";

/** Error texts are the approved microcopy (docs/copy-deck.md, part ד). */
export const MESSAGES = {
  required: (field: string) => `נשאר למלא: ${field}`,
  phone: "מספר נייד ישראלי מתחיל ב-05 ויש בו 10 ספרות",
  email: "כדאי לבדוק את המייל, למשל name@gmail.com",
  terms: "כדי להמשיך צריך לאשר את תנאי ההשתתפות ואת הצהרת הבריאות",
  birthDate: "תאריך לידה לא תקין",
  tooYoung: "ההשתתפות מגיל 16",
} as const;

export const FIELD_LABELS = {
  fullName: "שם מלא",
  phone: "טלפון נייד",
  email: "מייל",
  ridingLevel: "רמת רכיבה",
  quantity: "כמות רוכבים",
  terms: "אישור התנאים",
} as const;

const cleanText = (value: string) => value.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();

export const fullNameField = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(2, MESSAGES.required(FIELD_LABELS.fullName)).max(80));

export const phoneField = z
  .string()
  .transform((value) => value.replace(/[\s\-()]/g, "").replace(/^\+972/, "0"))
  .pipe(z.string().regex(/^05\d{8}$/, MESSAGES.phone));

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email(MESSAGES.email).max(120, MESSAGES.email));

const checkbox = z
  .string()
  .nullish()
  .transform((value) => value === "on");

export const couponField = z
  .string()
  .nullish()
  .transform((value) => (value ?? "").trim().toUpperCase())
  .pipe(z.string().regex(/^([A-Z0-9]{3,20})?$/));

export const quantityField = z.coerce.number().int().min(1).max(MAX_TICKETS_PER_ORDER);

export const checkoutSchema = z.object({
  quantity: quantityField,
  fullName: fullNameField,
  phone: phoneField,
  email: emailField,
  ridingLevel: z.enum(["beginner", "intermediate", "advanced"], MESSAGES.required(FIELD_LABELS.ridingLevel)),
  coupon: couponField.catch(""),
  terms: z.literal("on", MESSAGES.terms),
  marketing: checkbox,
  wall: checkbox,
  expectedTotal: z.coerce.number().int().min(0).max(10_000_000),
  retryToken: z.string().max(200).nullish(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const LEAD_SOURCES = ["home", "thank_you"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const coachingSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  marketing: checkbox,
  source: z.enum(LEAD_SOURCES).catch("home"),
});

export const waitlistSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  email: emailField,
  quantity: quantityField,
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, MESSAGES.birthDate)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.getUTCFullYear() >= 1930 && date.getTime() < Date.now();
  }, MESSAGES.birthDate);

export const participantSchema = z.object({
  fullName: fullNameField,
  phone: z.union([z.literal(""), phoneField]).transform((value) => value || null),
  birthDate: isoDate,
  parentName: z.string().max(80).transform(cleanText).optional(),
  parentPhone: z.union([z.literal(""), phoneField]).optional(),
  parentEmail: z.union([z.literal(""), emailField]).optional(),
});

export const detailsSchema = z.object({
  bikeType: z.string().transform(cleanText).pipe(z.string().min(2, MESSAGES.required("סוג אופניים")).max(60)),
  participants: z.array(participantSchema).min(1).max(MAX_TICKETS_PER_ORDER),
});

export const FEEDBACK_MAX = 600;

/** Plain text only: stored as typed (minus control characters and angle brackets), rendered as text, never HTML. */
export const feedbackSchema = z.object({
  rating: z.coerce.number({ error: "נשאר לבחור דירוג" }).int().min(1, "נשאר לבחור דירוג").max(5, "נשאר לבחור דירוג"),
  message: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(2, "נשאר לכתוב כמה מילים").max(FEEDBACK_MAX, `עד ${FEEDBACK_MAX} תווים`)),
  publish: checkbox,
});

export const consentSchema = z.object({
  signedName: fullNameField,
  agree: z.literal("on", MESSAGES.terms),
});

/** First message per field, for inline errors next to each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}
