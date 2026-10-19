"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { feedbackAction, type FeedbackState } from "@/app/feedback/[token]/actions";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { FormPrivacyNote } from "@/components/forms/FormPrivacyNote";
import { useSubmit } from "@/components/forms/useSubmit";
import { TurnstileField } from "@/components/ui/TurnstileField";
import { FEEDBACK_MAX } from "@/lib/validation/forms";

const RATINGS = [
  { value: 1, label: "לא טוב" },
  { value: 2, label: "בסדר" },
  { value: 3, label: "טוב" },
  { value: 4, label: "טוב מאוד" },
  { value: 5, label: "מעולה" },
] as const;

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-9 transition-transform ${filled ? "fill-sunset text-sunset" : "fill-none text-charcoal-soft"}`}>
      <path
        d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeedbackForm({ token, turnstileKey }: { token: string; turnstileKey: string | null }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(feedbackAction, { status: "idle" });
  const [rating, setRating] = useState(0);
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);
  const errors = state.status === "invalid" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "invalid") focusFirstError(formRef.current, Object.keys(state.fieldErrors));
  }, [state]);

  if (state.status === "ok") {
    return (
      <p role="status" className="fade-up rounded-lg bg-cream-deep p-6 text-lead font-semibold">
        תודה! יואב קורא כל משוב בעצמו.
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6">
      <input type="hidden" name="token" value={token} />
      <fieldset data-field aria-describedby={errors.rating ? "rating-error" : undefined}>
        <legend className="field-label">איך היה, מ-1 עד 5?</legend>
        <div className="mt-2 flex gap-1">
          {RATINGS.map((option) => (
            <label
              key={option.value}
              className="grid min-h-12 min-w-12 cursor-pointer place-items-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sunset"
            >
              <input
                type="radio"
                name="rating"
                value={option.value}
                className="sr-only"
                checked={rating === option.value}
                onChange={() => setRating(option.value)}
              />
              <Star filled={option.value <= rating} />
              <span className="sr-only">
                <bdi>{option.value}</bdi>: {option.label}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1 min-h-6 text-small text-charcoal-soft" aria-hidden="true">
          {rating ? RATINGS[rating - 1].label : ""}
        </p>
        <FieldError id="rating-error" message={errors.rating} />
      </fieldset>

      <div data-field>
        <label htmlFor="message" className="field-label">
          מה הכי זכור לך מהיום?
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={FEEDBACK_MAX}
          onChange={(event) => setLength(event.target.value.length)}
          className="field-input min-h-36 py-3"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={`message-count${errors.message ? " message-error" : ""}`}
        />
        <p id="message-count" className="mt-1 text-end text-micro text-charcoal-soft">
          <bdi>{length}</bdi> מתוך <bdi>{FEEDBACK_MAX}</bdi> תווים
        </p>
        <FieldError id="message-error" message={errors.message} />
      </div>

      <label className="check text-small">
        <input type="checkbox" name="publish" />
        <span>מותר לפרסם את המשוב באתר, עם השם הפרטי שלי. יואב יבחר ציטוט ולא ישנה את המילים.</span>
      </label>

      <TurnstileField siteKey={turnstileKey} action="feedback" resetSignal={state} />
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "שולחים..." : "לשליחת המשוב"}
        </button>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
