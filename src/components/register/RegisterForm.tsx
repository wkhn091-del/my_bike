"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { checkoutAction, quoteAction } from "@/app/register/actions";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { FormPrivacyNote } from "@/components/forms/FormPrivacyNote";
import { MarketingConsent } from "@/components/forms/MarketingConsent";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TurnstileField } from "@/components/ui/TurnstileField";
import { track } from "@/lib/analytics/track";
import type { CheckoutState, QuoteView } from "@/lib/checkout/types";
import { formatShekels } from "@/lib/format";

export type Prefill = {
  quantity: number;
  fullName: string;
  phone: string;
  email: string;
  ridingLevel: "beginner" | "intermediate" | "advanced";
  coupon: string;
};

type Props = {
  initialQuote: QuoteView;
  hasFriendDiscount: boolean;
  turnstileKey: string | null;
  prefill: Prefill | null;
  retryToken: string | null;
  minutesLeft: number | null;
};

const LEVELS = [
  { value: "beginner", label: "מתחיל" },
  { value: "intermediate", label: "בינוני" },
  { value: "advanced", label: "מתקדם" },
] as const;

const FIELD_ORDER = ["quantity", "fullName", "phone", "email", "ridingLevel", "terms"];

function validateClient(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const errors: Record<string, string> = {};
  const name = String(data.get("fullName") ?? "").trim();
  const phone = String(data.get("phone") ?? "").replace(/[\s\-()]/g, "").replace(/^\+972/, "0");
  const email = String(data.get("email") ?? "").trim();
  if (name.length < 2) errors.fullName = "נשאר למלא: שם מלא";
  if (!phone) errors.phone = "נשאר למלא: טלפון נייד";
  else if (!/^05\d{8}$/.test(phone)) errors.phone = "מספר נייד ישראלי מתחיל ב-05 ויש בו 10 ספרות";
  if (!email) errors.email = "נשאר למלא: מייל";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "כדאי לבדוק את המייל, למשל name@gmail.com";
  if (!data.get("ridingLevel")) errors.ridingLevel = "נשאר למלא: רמת רכיבה";
  if (!data.get("terms")) errors.terms = "כדי להמשיך צריך לאשר את תנאי ההשתתפות ואת הצהרת הבריאות";
  return errors;
}

function couponMessage(quote: QuoteView, code: string): { tone: "ok" | "info"; text: string } | null {
  if (quote.status !== "ok" || !code) return null;
  switch (quote.couponStatus) {
    case "applied":
      return { tone: "ok", text: `הקוד הופעל: −${formatShekels(quote.discountAgorot)}` };
    case "not_best":
      return { tone: "info", text: "הקוד תקף, אבל כבר קיבלתם הנחה משתלמת יותר. מקבלים את הטובה מביניהן." };
    case "not_found":
    case "expired":
    case "used_up":
      return { tone: "info", text: "הקוד הזה לא בתוקף. אפשר להמשיך במחיר הרגיל או לבדוק את הקוד" };
    default:
      return null;
  }
}

export function RegisterForm({ initialQuote, hasFriendDiscount, turnstileKey, prefill, retryToken, minutesLeft }: Props) {
  const [state, action, submitting] = useActionState<CheckoutState, FormData>(checkoutAction, { status: "idle" });
  const [quote, setQuote] = useState<QuoteView>(initialQuote);
  const [quantity, setQuantity] = useState(prefill?.quantity ?? 1);
  const [couponOpen, setCouponOpen] = useState(Boolean(prefill?.coupon));
  const [couponInput, setCouponInput] = useState(prefill?.coupon ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState(prefill?.coupon ?? "");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [quoting, startQuote] = useTransition();
  const [, startSubmit] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const serverErrors = state.status === "invalid" ? state.fieldErrors : {};
  const errors = { ...serverErrors, ...clientErrors };

  function refreshQuote(nextQuantity: number, nextCoupon: string) {
    startQuote(async () => {
      const next = await quoteAction(nextQuantity, nextCoupon, retryToken);
      setQuote(next);
      if (next.status === "ok" && next.quantityClamped) {
        setQuantity(next.quantity);
        setNotice(`נשארו רק ${next.seatsLeft} מקומות. עדכנו את הכמות ל-${next.quantity}`);
      } else if (next.status === "rate_limited") {
        setNotice("רגע, יותר מדי ניסיונות. אפשר לנסות שוב בעוד דקה");
      } else {
        setNotice(null);
      }
    });
  }

  const [handledState, setHandledState] = useState(state);
  if (handledState !== state) {
    setHandledState(state);
    if (state.status === "price_changed") {
      setQuote(state.quote);
      if (state.quote.status === "ok") setQuantity(state.quote.quantity);
      setNotice(state.message);
    }
  }

  useEffect(() => {
    if (state.status === "invalid") focusFirstError(formRef.current, FIELD_ORDER.filter((field) => state.fieldErrors[field]));
  }, [state]);

  /** Dispatched by hand (not <form action>) so React does not clear the fields after a failed attempt. */
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validateClient(form);
    setClientErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(form, FIELD_ORDER.filter((field) => found[field]));
      return;
    }
    if (quote.status === "ok") track({ name: "begin_checkout", value: quote.totalAgorot / 100, quantity: quote.quantity });
    const formData = new FormData(form);
    startSubmit(() => action(formData));
  }

  const ok = quote.status === "ok" ? quote : null;
  const coupon = couponMessage(quote, appliedCoupon);
  const busy = submitting || quoting;
  const describe = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-8 grid gap-7">
      {minutesLeft !== null ? (
        <p role="status" className="rounded-md border border-error/40 bg-cream-deep p-4 font-semibold">
          התשלום לא הושלם ולא חויבתם.{" "}
          {minutesLeft > 0 ? (
            <>
              המקום שמור לכם עוד <bdi>{minutesLeft}</bdi> דקות.
            </>
          ) : null}
        </p>
      ) : null}

      <fieldset data-field>
        <legend className="field-label">
          רוכבים עם חבר? <span className="font-normal text-charcoal-soft">כמה מקומות לשמור</span>
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((value) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="quantity"
                value={value}
                checked={quantity === value}
                onChange={() => {
                  setQuantity(value);
                  refreshQuote(value, appliedCoupon);
                }}
                className="peer sr-only"
              />
              <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border-2 border-line text-lead font-bold peer-checked:border-olive peer-checked:bg-olive peer-checked:text-cream peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive-deep">
                <bdi>{value}</bdi>
              </span>
            </label>
          ))}
        </div>
        <p className="field-hint" aria-live="polite">
          {ok && quantity > 1 ? (
            <>
              <bdi>{quantity}</bdi> רוכבים · <bdi>{formatShekels(ok.totalAgorot)}</bdi> יחד, כולל מע״מ. כל אחד מקבל מספר משתתף משלו.
            </>
          ) : (
            <>עד 4 מקומות בהזמנה אחת. את פרטי החברים ממלאים אחרי התשלום.</>
          )}
          {hasFriendDiscount ? " הנחת חברים מ-2 כרטיסים." : ""}
        </p>
      </fieldset>

      <div data-field>
        <label htmlFor="fullName" className="field-label">
          שם מלא
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={prefill?.fullName}
          className="field-input"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describe("fullName")}
        />
        <FieldError id="fullName-error" message={errors.fullName} />
      </div>

      <div data-field>
        <label htmlFor="phone" className="field-label">
          טלפון נייד
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          required
          maxLength={20}
          defaultValue={prefill?.phone}
          className="field-input text-end"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={`phone-hint ${describe("phone") ?? ""}`.trim()}
        />
        <p id="phone-hint" className="field-hint">
          רק לעדכונים על האירוע
        </p>
        <FieldError id="phone-error" message={errors.phone} />
      </div>

      <div data-field>
        <label htmlFor="email" className="field-label">
          מייל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          maxLength={120}
          defaultValue={prefill?.email}
          className="field-input text-end"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={`email-hint ${describe("email") ?? ""}`.trim()}
        />
        <p id="email-hint" className="field-hint">
          לשם נשלחים האישור והחשבונית
        </p>
        <FieldError id="email-error" message={errors.email} />
      </div>

      <fieldset data-field aria-describedby="level-hint">
        <legend className="field-label">איך הייתם מגדירים את הרכיבה שלכם?</legend>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((level) => (
            <label key={level.value} className="relative">
              <input
                type="radio"
                name="ridingLevel"
                value={level.value}
                defaultChecked={prefill?.ridingLevel === level.value}
                className="peer sr-only"
              />
              <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border-2 border-line font-semibold peer-checked:border-olive peer-checked:bg-olive peer-checked:text-cream peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive-deep">
                {level.label}
              </span>
            </label>
          ))}
        </div>
        <p id="level-hint" className="field-hint">
          כל הרמות מוזמנות. זה עוזר לנו לחלק לקבוצות
        </p>
        <FieldError id="ridingLevel-error" message={errors.ridingLevel} />
      </fieldset>

      <div>
        {couponOpen ? (
          <div className="fade-up">
            <label htmlFor="coupon-input" className="field-label">
              קוד הנחה
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-input"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                maxLength={20}
                dir="ltr"
                autoComplete="off"
                autoCapitalize="characters"
                className="field-input text-end"
              />
              <button
                type="button"
                className="btn-secondary shrink-0"
                disabled={quoting}
                onClick={() => {
                  const code = couponInput.trim();
                  setAppliedCoupon(code);
                  refreshQuote(quantity, code);
                }}
              >
                להפעלת הקוד
              </button>
            </div>
            {coupon ? (
              <p role="status" className={`mt-2 text-small font-semibold ${coupon.tone === "ok" ? "text-olive-deep" : "text-charcoal-soft"}`}>
                {coupon.text}
              </p>
            ) : null}
          </div>
        ) : (
          <button type="button" className="link min-h-12 text-small" onClick={() => setCouponOpen(true)}>
            יש לי קוד הנחה
          </button>
        )}
        <input type="hidden" name="coupon" value={appliedCoupon} />
      </div>

      <div className="grid gap-2">
        <div data-field>
          <label className="check">
            <input type="checkbox" name="terms" aria-invalid={Boolean(errors.terms)} aria-describedby={describe("terms")} />
            <span>
              קראתי ואני מאשר/ת את{" "}
              <Link href="/terms" target="_blank" rel="noopener" className="link">
                תנאי ההשתתפות
                <span className="sr-only"> (נפתח בחלון חדש)</span>
              </Link>{" "}
              ואת{" "}
              <Link href="/terms#health" target="_blank" rel="noopener" className="link">
                הצהרת הבריאות
                <span className="sr-only"> (נפתח בחלון חדש)</span>
              </Link>
            </span>
          </label>
          <FieldError id="terms-error" message={errors.terms} />
        </div>
        <label className="check text-small">
          <input type="checkbox" name="wall" />
          <span>אפשר להציג את השם הפרטי שלי ואות ראשונה בקיר הנרשמים</span>
        </label>
        <MarketingConsent />
      </div>

      {ok ? (
        <div className="rounded-lg bg-cream-deep p-5" aria-live="polite">
          <ul className="grid gap-1 text-small">
            {ok.lines.map((line) => (
              <li key={line.label} className="flex justify-between gap-4">
                <span>{line.label}</span>
                <bdi>{line.amountAgorot < 0 ? `−${formatShekels(-line.amountAgorot)}` : formatShekels(line.amountAgorot)}</bdi>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">סה״כ לתשלום</span>
            <span className="text-h3 font-bold">
              <bdi>
                <AnimatedNumber value={ok.totalAgorot} format={formatShekels} />
              </bdi>
            </span>
          </p>
          <p className="text-micro text-charcoal-soft">כולל מע״מ</p>
        </div>
      ) : null}

      {notice ? (
        <p role="alert" className="fade-up rounded-md border border-line bg-cream p-4 font-semibold">
          {notice}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      {state.status === "sold_out" || quote.status === "sold_out" ? (
        <p role="alert" className="font-semibold">
          כל המקומות נתפסו.{" "}
          <Link href="/register" className="link">
            לרשימת ההמתנה
          </Link>
        </p>
      ) : null}

      <input type="hidden" name="expectedTotal" value={ok?.totalAgorot ?? 0} />
      {retryToken ? <input type="hidden" name="retryToken" value={retryToken} /> : null}
      <TurnstileField siteKey={turnstileKey} action="checkout" resetSignal={state} />

      <div>
        <button type="submit" className="btn-primary w-full" disabled={busy || !ok}>
          {submitting ? (
            <>
              <svg viewBox="0 0 24 24" className="spinner size-5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
              </svg>
              מעבירים אתכם לתשלום מאובטח...
            </>
          ) : ok ? (
            <>
              לתשלום מאובטח · <bdi>{formatShekels(ok.totalAgorot)}</bdi>
            </>
          ) : (
            "לתשלום מאובטח"
          )}
        </button>
        <p className="mt-2 text-center text-micro text-charcoal-soft">כולל מע״מ · החזר מלא עד 14 יום לפני</p>
        <FormPrivacyNote>
          הפרטים להרשמה ולתשלום ליום הקהילה, לפי{" "}
          <Link href="/privacy" className="link">
            מדיניות הפרטיות
          </Link>
          . דיוור נשלח רק אם סימנתם הסכמה למעלה.
        </FormPrivacyNote>
      </div>
    </form>
  );
}
