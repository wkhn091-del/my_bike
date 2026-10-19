"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { waitlistAction, type LeadState } from "@/app/actions/leads";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { FormPrivacyNote } from "@/components/forms/FormPrivacyNote";
import { useSubmit } from "@/components/forms/useSubmit";
import { TurnstileField } from "@/components/ui/TurnstileField";
import { track } from "@/lib/analytics/track";

export function WaitlistForm({ turnstileKey }: { turnstileKey: string | null }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(waitlistAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);
  const errors = state.status === "invalid" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "invalid") focusFirstError(formRef.current, Object.keys(state.fieldErrors));
    if (state.status === "ok") track({ name: "generate_lead", form: "waitlist" });
  }, [state]);

  if (state.status === "ok") {
    return (
      <p role="status" className="fade-up rounded-lg bg-cream-deep p-6 text-lead">
        נרשמתם לרשימת ההמתנה. אם מתפנה מקום, נודיע לכם ראשונים.
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5">
      <div data-field>
        <label htmlFor="wl-name" className="field-label">
          שם מלא
        </label>
        <input
          id="wl-name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          className="field-input"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "wl-name-error" : undefined}
        />
        <FieldError id="wl-name-error" message={errors.fullName} />
      </div>
      <div data-field>
        <label htmlFor="wl-phone" className="field-label">
          טלפון נייד
        </label>
        <input
          id="wl-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          required
          maxLength={20}
          className="field-input text-end"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "wl-phone-error" : undefined}
        />
        <FieldError id="wl-phone-error" message={errors.phone} />
      </div>
      <div data-field>
        <label htmlFor="wl-email" className="field-label">
          מייל
        </label>
        <input
          id="wl-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          maxLength={120}
          className="field-input text-end"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "wl-email-error" : undefined}
        />
        <FieldError id="wl-email-error" message={errors.email} />
      </div>
      <div data-field>
        <label htmlFor="wl-qty" className="field-label">
          כמה מקומות תרצו?
        </label>
        <select id="wl-qty" name="quantity" defaultValue="1" className="field-input">
          {[1, 2, 3, 4].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <TurnstileField siteKey={turnstileKey} action="waitlist" resetSignal={state} />
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "שולחים..." : "לרשימת ההמתנה"}
        </button>
        <FormPrivacyNote>
          הפרטים ישמשו רק לעדכון על מקום פנוי, לפי{" "}
          <Link href="/privacy" className="link">
            מדיניות הפרטיות
          </Link>
          .
        </FormPrivacyNote>
      </div>
    </form>
  );
}
