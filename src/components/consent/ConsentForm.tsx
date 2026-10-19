"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { consentAction, type ConsentState } from "@/app/consent/[token]/actions";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { FormPrivacyNote } from "@/components/forms/FormPrivacyNote";
import { useSubmit } from "@/components/forms/useSubmit";
import { TurnstileField } from "@/components/ui/TurnstileField";

export function ConsentForm({ token, turnstileKey }: { token: string; turnstileKey: string | null }) {
  const [state, action, pending] = useActionState<ConsentState, FormData>(consentAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);
  const errors = state.status === "invalid" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "invalid") focusFirstError(formRef.current, Object.keys(state.fieldErrors));
  }, [state]);

  if (state.status === "ok") {
    return (
      <p role="status" className="fade-up rounded-lg bg-cream-deep p-6 text-lead font-semibold">
        האישור התקבל. תודה!
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <div data-field>
        <label htmlFor="signedName" className="field-label">
          השם המלא שלך (ההורה / האפוטרופוס החוקי)
        </label>
        <input
          id="signedName"
          name="signedName"
          autoComplete="name"
          maxLength={80}
          className="field-input"
          aria-invalid={Boolean(errors.signedName)}
          aria-describedby={errors.signedName ? "signedName-error" : undefined}
        />
        <FieldError id="signedName-error" message={errors.signedName} />
      </div>
      <div data-field>
        <label className="check">
          <input type="checkbox" name="agree" aria-invalid={Boolean(errors.agree)} aria-describedby={errors.agree ? "agree-error" : undefined} />
          <span>
            אני ההורה או האפוטרופוס החוקי, קראתי את{" "}
            <Link href="/terms" target="_blank" className="link">
              תנאי ההשתתפות
            </Link>
            , את{" "}
            <Link href="/terms#health" target="_blank" className="link">
              הצהרת הבריאות
            </Link>{" "}
            ואת{" "}
            <Link href="/privacy" target="_blank" className="link">
              מדיניות הפרטיות
            </Link>
            , ואני מאשר/ת את ההשתתפות.
          </span>
        </label>
        <FieldError id="agree-error" message={errors.agree} />
      </div>
      <TurnstileField siteKey={turnstileKey} action="consent" resetSignal={state} />
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "שומרים..." : "לאישור ההשתתפות"}
        </button>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
