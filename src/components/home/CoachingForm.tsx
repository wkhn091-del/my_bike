"use client";

import { useActionState, useEffect, useRef } from "react";
import { coachingAction, type LeadState } from "@/app/actions/leads";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { FormPrivacyNote } from "@/components/forms/FormPrivacyNote";
import { useSubmit } from "@/components/forms/useSubmit";
import { TurnstileField } from "@/components/ui/TurnstileField";
import { track } from "@/lib/analytics/track";
import type { LeadSource } from "@/lib/validation/forms";

type Props = {
  turnstileKey: string | null;
  responseDays: number | null;
  /** The buyer's own details on their private thank-you page, so the offer is one tap. */
  prefill?: { fullName: string; phone: string };
  source?: LeadSource;
};

export function CoachingForm({ turnstileKey, responseDays, prefill, source = "home" }: Props) {
  const [state, action, pending] = useActionState<LeadState, FormData>(coachingAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);
  const errors = state.status === "invalid" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "invalid") focusFirstError(formRef.current, Object.keys(state.fieldErrors));
    if (state.status === "ok") track({ name: "generate_lead", form: source === "thank_you" ? "coaching_thank_you" : "coaching" });
  }, [state, source]);

  if (state.status === "ok") {
    return (
      <p role="status" className="fade-up rounded-lg bg-cream p-6 text-lead">
        קיבלתי! אחזור אליכם{responseDays ? ` תוך ${responseDays} ימי עבודה` : " תוך יומיים"}. — יואב
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5 rounded-lg bg-cream p-6 shadow-soft">
      <input type="hidden" name="source" value={source} />
      {prefill ? <p className="text-small text-charcoal-soft">הפרטים כבר מולאו מההזמנה. אפשר לשנות אותם.</p> : null}
      <div data-field>
        <label htmlFor="coach-name" className="field-label">
          שם
        </label>
        <input
          id="coach-name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={prefill?.fullName}
          className="field-input"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "coach-name-error" : undefined}
        />
        <FieldError id="coach-name-error" message={errors.fullName} />
      </div>
      <div data-field>
        <label htmlFor="coach-phone" className="field-label">
          טלפון נייד
        </label>
        <input
          id="coach-phone"
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
          aria-describedby={errors.phone ? "coach-phone-error" : undefined}
        />
        <FieldError id="coach-phone-error" message={errors.phone} />
      </div>
      <label className="check text-small">
        <input type="checkbox" name="marketing" />
        <span>
          אני מסכים/ה לקבל דיוור מ־RideWithYoav על אירועים. הסרה בכל הודעה / בוואטסאפ.
        </span>
      </label>
      <TurnstileField siteKey={turnstileKey} action="coaching" resetSignal={state} />
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className="btn-secondary w-full min-h-14 text-body" disabled={pending}>
          {pending ? "שולחים..." : "לשיחת היכרות עם יואב"}
        </button>
        <p className="mt-2 text-center text-micro text-charcoal-soft">
          {responseDays ? `יואב חוזר אליכם תוך ${responseDays} ימי עבודה. ` : ""}בלי התחייבות.
        </p>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
